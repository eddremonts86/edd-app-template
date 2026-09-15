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

/**
 * Which side a failure came from.
 *
 * `provider_rejected` means Stripe understood the request and refused it: a
 * price that does not exist, a one-time price asked for in subscription mode, a
 * key without the right permission. The verdict arrived; we do not like it. The
 * fix is in this repository.
 *
 * `provider_unavailable` means no verdict arrived — a connection failure, a
 * 5xx, a rate limit. The fix is to wait, or to look at Stripe.
 *
 * Collapsing the two is what this function exists to stop. A live run against
 * test mode reported a bad price id as `provider_unavailable`, which sends
 * whoever is on call to Stripe's status page to debug our own parameters.
 *
 * The classification is Stripe's own — its error subclasses already encode it,
 * including the case a hand-rolled check gets wrong: a rate limit can arrive as
 * HTTP 400 with `code: 'rate_limit'`, not only as 429.
 */
export interface StripeFailure {
  code: 'provider_rejected' | 'provider_unavailable'
  /** For the log. A class name and Stripe's stable code — never a value we sent. */
  detail: Record<string, string>
}

export function classifyStripeFailure(error: unknown): StripeFailure {
  const detail = {
    // Stripe's classes leave `name` as 'Error' and put the subclass on `type`,
    // so reading `name` here logs 'Error' for every one of them.
    type:
      error instanceof Stripe.errors.StripeError
        ? error.type
        : error instanceof Error
          ? error.name
          : 'unknown',
    // Stripe's machine-readable code: `resource_missing`, `parameter_invalid_*`.
    // An enum, not user data.
    reason: (error as { code?: string } | null)?.code ?? 'none',
  }

  const noVerdict =
    error instanceof Stripe.errors.StripeConnectionError ||
    error instanceof Stripe.errors.StripeRateLimitError ||
    error instanceof Stripe.errors.StripeAPIError

  // Anything that is not a Stripe error at all is not ours to label either —
  // it is a throw from somewhere we did not expect, so it gets the code that
  // does not claim Stripe said anything.
  if (noVerdict || !(error instanceof Stripe.errors.StripeError)) {
    return { code: 'provider_unavailable', detail }
  }

  return { code: 'provider_rejected', detail }
}
