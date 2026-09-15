import type Stripe from 'stripe'
import { getDb } from '@/shared/lib/db'
import { logger } from '@/shared/lib/observability'
import { billingEvents, billingSubscriptions } from '../model/schema'
import { resolveStripe, webhookSecrets } from './provider'

/**
 * The inbound webhook, and the four rules every webhook in this codebase follows
 * (docs/architecture/integration-conventions.md §8.2).
 *
 * 1. Signature verified against the **raw bytes**, before anything parses them.
 * 2. The previous signing secret is accepted too, so a rotation drops no event.
 * 3. Idempotent on the provider's event id — providers retry, and a retry must
 *    not provision or cancel twice.
 * 4. A fast 2xx once the event is durably recorded. A slow handler becomes a
 *    retry storm.
 */

export type WebhookOutcome =
  | { status: 200; body: { received: true; duplicate?: true } }
  | { status: 202; body: { ignored: string } }
  | { status: 400; body: { error: string } }
  | { status: 503; body: { error: string } }

/** Event types this module acts on. Anything else is acknowledged and dropped. */
const HANDLED = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
])

/**
 * Verify against each configured secret in turn.
 *
 * Returns the parsed event, or undefined when no secret matched. The reason is
 * never distinguished in the response — a caller learning *which* secret failed
 * learns something about our rotation state.
 */
function verify(rawBody: string, signature: string): Stripe.Event | undefined {
  const client = resolveStripe()
  if (!client) return undefined

  for (const secret of webhookSecrets()) {
    try {
      return client.webhooks.constructEvent(rawBody, signature, secret)
    } catch {
      // Try the next secret. A rotation window has two live at once.
    }
  }
  return undefined
}

export async function handleBillingWebhook(
  rawBody: string,
  signature: string | null,
): Promise<WebhookOutcome> {
  if (!resolveStripe() || webhookSecrets().length === 0) {
    logger.warn('billing.webhook.unconfigured', {})
    return { status: 503, body: { error: 'billing_unconfigured' } }
  }

  if (!signature) {
    logger.warn('billing.webhook.rejected', { code: 'no_signature' })
    return { status: 400, body: { error: 'invalid_signature' } }
  }

  const event = verify(rawBody, signature)
  if (!event) {
    logger.warn('billing.webhook.rejected', { code: 'bad_signature' })
    return { status: 400, body: { error: 'invalid_signature' } }
  }

  const db = getDb()

  // Claiming the id IS the idempotency check: a retried delivery collides on
  // the primary key and returns zero rows.
  const claimed = await db
    .insert(billingEvents)
    .values({ eventId: event.id, type: event.type })
    .onConflictDoNothing()
    .returning({ eventId: billingEvents.eventId })

  if (claimed.length === 0) {
    logger.info('billing.webhook.duplicate', { type: event.type })
    return { status: 200, body: { received: true, duplicate: true } }
  }

  if (!HANDLED.has(event.type)) {
    logger.info('billing.webhook.ignored', { type: event.type })
    return { status: 202, body: { ignored: event.type } }
  }

  await applySubscriptionEvent(event)
  logger.info('billing.webhook.applied', { type: event.type })
  return { status: 200, body: { received: true } }
}

async function applySubscriptionEvent(event: Stripe.Event): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription
  const userId = subscription.metadata?.userId

  if (!userId) {
    // Nothing to attach it to. Recorded as seen so it is not retried forever,
    // and logged loudly enough to be found — a subscription with no user is a
    // checkout that was created without the metadata this module requires.
    logger.warn('billing.webhook.no_user_metadata', { type: event.type })
    return
  }

  const item = subscription.items?.data?.[0]
  const periodEnd = item?.current_period_end

  await getDb()
    .insert(billingSubscriptions)
    .values({
      userId,
      providerSubscriptionId: subscription.id,
      status: subscription.status,
      priceId: item?.price?.id ?? null,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: billingSubscriptions.userId,
      set: {
        providerSubscriptionId: subscription.id,
        status: subscription.status,
        priceId: item?.price?.id ?? null,
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
        updatedAt: new Date(),
      },
    })
}
