/**
 * What billing looks like to the rest of the app. No Stripe type appears here.
 */

export type BillingErrorCode =
  'unconfigured' | 'provider_rejected' | 'provider_unavailable' | 'unknown_customer'

export class BillingError extends Error {
  constructor(
    readonly code: BillingErrorCode,
    message: string = code,
  ) {
    super(message)
    this.name = 'BillingError'
  }
}

/** Mirrors Stripe's subscription statuses without importing them. */
export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'
  | 'paused'
  | (string & {})

/**
 * Which statuses count as paying.
 *
 * `trialing` is in and `past_due` is out, and both are decisions rather than
 * defaults. A trial is a subscription somebody agreed to and the provider will
 * bill; refusing it during the trial sells them nothing. `past_due` is a payment
 * that failed — the provider retries for a while, and during that window the
 * honest answer is that they are not currently paying. A successful retry flips
 * them back through the webhook with no action from us.
 *
 * Everything not on this list is not paying, **including statuses Stripe has not
 * invented yet**, which is the safe direction for a list like this to fail.
 */
const PAYING: ReadonlySet<string> = new Set(['active', 'trialing'])

export function isPaying(status: SubscriptionStatus | null | undefined): boolean {
  return typeof status === 'string' && PAYING.has(status)
}

export interface BillingSummary {
  status: SubscriptionStatus | null
  isPaying: boolean
  /** ISO timestamp; null when there is no subscription. */
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}
