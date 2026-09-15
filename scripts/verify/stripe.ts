/**
 * stripe.ts — exercise the billing module against a real Stripe account.
 *
 * Opt-in, never part of `pnpm test`: §8.4 of the integration conventions bars a
 * live third-party account from the suite. Run it by hand, in TEST MODE only —
 * it refuses a live key.
 *
 * It needs a database, because checkout and the webhook both write to the
 * module's own tables. Everything it creates in Stripe is torn down at the end.
 */
import { eq } from 'drizzle-orm'
import {
  billingCustomers,
  billingEvents,
  billingSubscriptions,
} from '@/modules/billing/model/schema'
import { BillingError } from '@/modules/billing/model/types'
import {
  createBillingPortalLink,
  createCheckoutSession,
  summarizeBilling,
} from '@/modules/billing/server/checkout'
import {
  isBillingConfigured,
  isWebhookConfigured,
  resolveStripe,
} from '@/modules/billing/server/provider'
import { handleBillingWebhook } from '@/modules/billing/server/webhook'
import { getDb } from '@/shared/lib/db'

let failures = 0
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures += 1
}

const key = process.env.STRIPE_SECRET_KEY ?? ''
if (!key.startsWith('sk_test') && !key.startsWith('rk_test')) {
  console.error('refusing to run: STRIPE_SECRET_KEY is not a test-mode key')
  process.exit(2)
}

check('isBillingConfigured', isBillingConfigured())
check('isWebhookConfigured', isWebhookConfigured())

const stripe = resolveStripe()!
const userId = `verify-${Date.now()}`
const email = `verify+${Date.now()}@example.com`
const db = getDb()

// A recurring price and a one-time price from the account itself, so the test
// is not pinned to ids that may be archived tomorrow.
const prices = await stripe.prices.list({ limit: 50, active: true })
const recurring = prices.data.find((price) => price.type === 'recurring')
const oneTime = prices.data.find((price) => price.type === 'one_time')
if (!recurring) {
  console.error('the account has no active recurring price to test with')
  process.exit(2)
}
console.log(
  `using price ${recurring.id} (${recurring.unit_amount} ${recurring.currency}/${recurring.recurring?.interval})\n`,
)

let customerId: string | undefined
let subscriptionId: string | undefined
const seenEventIds: string[] = []

try {
  // -- checkout ---------------------------------------------------------------
  const url = await createCheckoutSession({ userId, email, priceId: recurring.id })
  check(
    'createCheckoutSession returns a hosted url',
    url.startsWith('https://') && url.includes('checkout.stripe.com'),
    `${url.slice(0, 48)}…`,
  )

  const [row] = await db.select().from(billingCustomers).where(eq(billingCustomers.userId, userId))
  customerId = row?.providerCustomerId
  check('the customer was recorded locally', Boolean(customerId?.startsWith('cus_')))

  const sessionId = new URL(url).pathname.split('/').pop() ?? ''
  const sessions = await stripe.checkout.sessions.list({ customer: customerId, limit: 1 })
  const session = sessions.data[0]
  check('the session is a subscription checkout', session?.mode === 'subscription', session?.mode)
  check(
    'client_reference_id carries the user id',
    session?.client_reference_id === userId,
    session?.client_reference_id ?? 'null',
  )
  check('the url points at that session', sessionId.length > 0)

  // A second call must reuse the customer rather than create a new one.
  await createCheckoutSession({ userId, email, priceId: recurring.id })
  const again = await db.select().from(billingCustomers).where(eq(billingCustomers.userId, userId))
  check(
    'a second checkout reuses the same customer',
    again.length === 1 && again[0]!.providerCustomerId === customerId,
  )

  // -- the vendor error stops at the boundary ---------------------------------
  if (oneTime) {
    try {
      await createCheckoutSession({ userId, email, priceId: oneTime.id })
      check('a one-time price in subscription mode is refused', false, 'it was accepted')
    } catch (error) {
      // Not just "a BillingError": the code has to say *our* parameters were
      // wrong. It read `provider_unavailable` until a live run caught it.
      check(
        'a one-time price is provider_rejected, not provider_unavailable',
        error instanceof BillingError && error.code === 'provider_rejected',
        `${(error as Error).name}/${(error as BillingError).code}`,
      )
    }
  }

  // -- the customer portal ----------------------------------------------------
  const portal = await createBillingPortalLink(userId)
  check(
    'createBillingPortalLink returns a hosted url',
    portal.startsWith('https://billing.stripe.com'),
    `${portal.slice(0, 44)}…`,
  )

  // -- a real subscription, and the real event it fires ------------------------
  // `default_incomplete` needs no payment method, so no card is involved.
  const subscription = await stripe.subscriptions.create({
    customer: customerId!,
    items: [{ price: recurring.id }],
    metadata: { userId },
    payment_behavior: 'default_incomplete',
  })
  subscriptionId = subscription.id
  check(
    'a real subscription was created',
    subscription.status === 'incomplete',
    subscription.status,
  )
  check(
    'current_period_end lives on the item, not the subscription (the code reads the item)',
    typeof subscription.items.data[0]?.current_period_end === 'number',
    `item=${subscription.items.data[0]?.current_period_end} sub=${(subscription as unknown as Record<string, unknown>).current_period_end ?? 'absent'}`,
  )

  // Stripe's own event for it, signed with the real webhook secret.
  // Events are recorded asynchronously, so the first list can come back without
  // it — a fixed sleep would be a flake waiting to happen.
  let events = await stripe.events.list({ type: 'customer.subscription.created', limit: 10 })
  let event: (typeof events)['data'][number] | undefined
  for (let attempt = 0; attempt < 15 && !event; attempt += 1) {
    if (attempt > 0)
      events = await stripe.events.list({ type: 'customer.subscription.created', limit: 10 })
    event = events.data.find(
      (candidate) => (candidate.data.object as { id?: string }).id === subscription.id,
    )
    if (!event) await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  check('Stripe recorded the event', Boolean(event), event?.id ?? 'not found after 15s')
  if (!event) throw new Error('no event to verify against')

  seenEventIds.push(event.id)
  const rawBody = JSON.stringify(event)
  const secret = process.env.STRIPE_WEBHOOK_SECRET!
  const signature = stripe.webhooks.generateTestHeaderString({ payload: rawBody, secret })

  const first = await handleBillingWebhook(rawBody, signature)
  check('a real signed event is accepted', first.status === 200, JSON.stringify(first.body))

  const summary = await summarizeBilling(userId)
  check(
    'the subscription reached our tables',
    summary.status === subscription.status,
    JSON.stringify(summary),
  )
  check('an incomplete subscription is not paying', summary.isPaying === false)
  check(
    'the period end was stored from the item',
    summary.currentPeriodEnd !== null,
    summary.currentPeriodEnd ?? 'null',
  )

  const replay = await handleBillingWebhook(rawBody, signature)
  check(
    'a replay is a duplicate, not a second write',
    replay.status === 200 && 'duplicate' in replay.body,
    JSON.stringify(replay.body),
  )

  const tampered = await handleBillingWebhook(rawBody.replace('incomplete', 'active'), signature)
  check('a tampered body is rejected', tampered.status === 400, JSON.stringify(tampered.body))
  check('no signature is rejected', (await handleBillingWebhook(rawBody, null)).status === 400)

  // An event type the module does not act on.
  const other =
    events.data.length > 0
      ? await stripe.events.list({ limit: 20 })
      : { data: [] as typeof events.data }
  const unhandled = other.data.find(
    (candidate) => !candidate.type.startsWith('customer.subscription.'),
  )
  if (unhandled) {
    seenEventIds.push(unhandled.id)
    const body = JSON.stringify(unhandled)
    const outcome = await handleBillingWebhook(
      body,
      stripe.webhooks.generateTestHeaderString({ payload: body, secret }),
    )
    check(
      'an unhandled type is acknowledged, not processed',
      outcome.status === 202,
      `${unhandled.type} -> ${outcome.status}`,
    )
  }
} finally {
  // -- teardown ---------------------------------------------------------------
  if (subscriptionId) await stripe.subscriptions.cancel(subscriptionId).catch(() => {})
  if (customerId) await stripe.customers.del(customerId).catch(() => {})
  await db.delete(billingSubscriptions).where(eq(billingSubscriptions.userId, userId))
  await db.delete(billingCustomers).where(eq(billingCustomers.userId, userId))
  for (const id of seenEventIds) await db.delete(billingEvents).where(eq(billingEvents.eventId, id))
  console.log('\ncleaned up the customer, the subscription and the local rows')
}

console.log(failures === 0 ? 'stripe: all checks passed' : `stripe: ${failures} check(s) failed`)
process.exit(failures === 0 ? 0 : 1)
