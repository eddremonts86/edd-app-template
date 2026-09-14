import { eq } from 'drizzle-orm'
import { getDb } from '@/shared/lib/db'
import { logger } from '@/shared/lib/observability'
import { billingCustomers, billingSubscriptions } from '../model/schema'
import { BillingError, isPaying, type BillingSummary } from '../model/types'
import { resolveStripe } from './provider'

/**
 * The three things the app asks billing to do. None of them takes a card.
 *
 * Checkout and the customer portal are URLs Stripe hosts; this module produces
 * a link and the browser goes there. `summarize` reads the local tables, never
 * the provider.
 */

function appUrl(): string {
  return process.env.APP_URL ?? 'http://localhost:2999'
}

/** The provider customer for this user, created on first need. */
async function customerIdFor(userId: string, email: string): Promise<string> {
  const db = getDb()
  const [existing] = await db
    .select({ providerCustomerId: billingCustomers.providerCustomerId })
    .from(billingCustomers)
    .where(eq(billingCustomers.userId, userId))
    .limit(1)

  if (existing) return existing.providerCustomerId

  const client = resolveStripe()
  if (!client) throw new BillingError('unconfigured')

  const customer = await client.customers.create({ email, metadata: { userId } })
  await db
    .insert(billingCustomers)
    .values({ userId, providerCustomerId: customer.id })
    .onConflictDoNothing()

  return customer.id
}

export interface CheckoutRequest {
  userId: string
  email: string
  priceId: string
  /** Appended to APP_URL. Defaults to the billing settings page. */
  returnPath?: string
}

/**
 * A hosted checkout URL.
 *
 * `metadata.userId` is set on the subscription, not only the session: the
 * webhook reads it off the subscription object, and a subscription without it
 * cannot be attached to anyone.
 */
export async function createCheckoutSession(request: CheckoutRequest): Promise<string> {
  const client = resolveStripe()
  if (!client) throw new BillingError('unconfigured')

  const customer = await customerIdFor(request.userId, request.email)
  const returnUrl = `${appUrl()}${request.returnPath ?? '/dashboard/settings/billing'}`

  try {
    const session = await client.checkout.sessions.create({
      mode: 'subscription',
      customer,
      line_items: [{ price: request.priceId, quantity: 1 }],
      success_url: `${returnUrl}?checkout=success`,
      cancel_url: `${returnUrl}?checkout=cancelled`,
      client_reference_id: request.userId,
      subscription_data: { metadata: { userId: request.userId } },
    })

    if (!session.url) throw new BillingError('provider_rejected', 'no checkout url')
    return session.url
  } catch (error) {
    if (error instanceof BillingError) throw error
    // The vendor's error class stops here.
    logger.warn('billing.checkout.failed', {})
    throw new BillingError('provider_unavailable')
  }
}

/** A link to the hosted portal, where a customer manages or cancels. */
export async function createBillingPortalLink(userId: string): Promise<string> {
  const client = resolveStripe()
  if (!client) throw new BillingError('unconfigured')

  const db = getDb()
  const [customer] = await db
    .select({ providerCustomerId: billingCustomers.providerCustomerId })
    .from(billingCustomers)
    .where(eq(billingCustomers.userId, userId))
    .limit(1)

  if (!customer) throw new BillingError('unknown_customer')

  try {
    const session = await client.billingPortal.sessions.create({
      customer: customer.providerCustomerId,
      return_url: `${appUrl()}/dashboard/settings/billing`,
    })
    return session.url
  } catch {
    logger.warn('billing.portal.failed', {})
    throw new BillingError('provider_unavailable')
  }
}

/** Read from our own tables. Never calls the provider. */
export async function summarizeBilling(userId: string): Promise<BillingSummary> {
  const [row] = await getDb()
    .select()
    .from(billingSubscriptions)
    .where(eq(billingSubscriptions.userId, userId))
    .limit(1)

  if (!row) {
    return { status: null, isPaying: false, currentPeriodEnd: null, cancelAtPeriodEnd: false }
  }

  return {
    status: row.status,
    isPaying: isPaying(row.status),
    currentPeriodEnd: row.currentPeriodEnd?.toISOString() ?? null,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
  }
}
