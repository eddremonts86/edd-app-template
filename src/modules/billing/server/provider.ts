import Stripe from 'stripe'
import { isSet } from '@/modules/core/capability'
import { IntegrationUnavailableError } from '@/shared/lib/errors/integration'
import { logger } from '@/shared/lib/observability'

/**
 * The Stripe client, and the boundary it stays behind.
 *
 * **Internal to this module.** Nothing outside `src/modules/billing/` imports
 * this file, and the module's barrel exports no Stripe type
 * (docs/architecture/integration-conventions.md §3.4). Domain code sees
 * `BillingError` and plain objects, never a `Stripe.errors.StripeAPIError`.
 *
 * **No card details, ever, anywhere.** Not a field, not a placeholder, not a
 * disabled input in a mockup. Checkout is a URL we send somebody to and the card
 * is typed on Stripe's page. The strongest guarantee about data you must not
 * hold is that there is nowhere for it to land.
 */

/**
 * Pinned, and not a free choice.
 *
 * Stripe's SDK defaults to whatever version the *account* is set to in the
 * dashboard, so a webhook payload's shape can change because somebody clicked a
 * button in a browser. Pinning moves that into a diff.
 *
 * The literal is typed to the single version this SDK release was generated for,
 * so any other string is a compile error — which means **this line moves only
 * with a dependency bump, and the two are one change**.
 *
 * ⚠️ The webhook *endpoint* carries its own version, set where it was created.
 * This pin governs the requests we make; the endpoint's version governs what
 * Stripe sends. They drift silently. Change both.
 */
const API_VERSION = '2026-08-26.dahlia'

let cached: Stripe | undefined
let announced = false

export function isBillingConfigured(): boolean {
  return isSet(process.env.STRIPE_SECRET_KEY)
}

/** The configured client, or undefined. Never throws. Internal to the module. */
export function resolveStripe(): Stripe | undefined {
  const key = process.env.STRIPE_SECRET_KEY

  if (!isSet(key)) {
    if (!announced) {
      announced = true
      logger.info('billing.unconfigured', { code: 'no_secret_key' })
    }
    return undefined
  }

  cached ??= new Stripe(key!, { apiVersion: API_VERSION as Stripe.LatestApiVersion })
  return cached
}

/** @throws IntegrationUnavailableError */
export function requireStripe(): Stripe {
  const client = resolveStripe()
  if (!client) throw new IntegrationUnavailableError('billing')
  return client
}

/**
 * The signing secrets for the webhook route, current first.
 *
 * Two, from day one. Rotating a webhook secret means both are live for a
 * window, and an endpoint that only knows the new one drops every event signed
 * with the old one — silently, because Stripe's retries also fail. This is the
 * cheapest possible insurance and the only app in the workspace that has it
 * added it after needing it.
 */
export function webhookSecrets(): string[] {
  return [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_WEBHOOK_SECRET_PREVIOUS].filter(
    (secret): secret is string => isSet(secret),
  )
}

export function isWebhookConfigured(): boolean {
  return webhookSecrets().length > 0
}
