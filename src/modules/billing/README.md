# Billing

Subscriptions through Stripe: hosted checkout, hosted customer portal, and a
webhook that keeps local state current.

Follows [`docs/architecture/integration-conventions.md`](../../../docs/architecture/integration-conventions.md).

## Configuration

| Key                              | Required | Notes                                                        |
| -------------------------------- | -------- | ------------------------------------------------------------ |
| `STRIPE_SECRET_KEY`              | yes      | dashboard → Developers → API keys                            |
| `STRIPE_WEBHOOK_SECRET`          | no       | without it checkout works but changes are never recorded     |
| `STRIPE_WEBHOOK_SECRET_PREVIOUS` | no       | set during a rotation; both are accepted while it is present |

## What it does with no configuration

Boots. The billing page renders and says billing is not configured; checkout and
the portal refuse. The page is **not** hidden — a hidden billing page in
production looks identical to a broken deploy, and the operator finds out from a
customer.

The webhook route answers `503 billing_unconfigured` rather than pretending to
accept events.

## No card details, ever

Not a field, not a placeholder, not a disabled input in a mockup. Checkout is a
URL the customer is sent to and the card is typed on Stripe's page. The
strongest guarantee about data you must not hold is that there is nowhere for it
to land.

## The webhook

1. The body is read as **text**. The signature covers the exact bytes Stripe
   sent; a parse-then-restringify in between fails verification in a way that
   looks like a wrong secret.
2. Every configured secret is tried, so a rotation drops no event.
3. The provider's `event.id` is the primary key of `billing_events`. Claiming it
   _is_ the idempotency check — a retry collides and stops.
4. Unhandled event types get `202` and are not processed.

## Billing state is ours

`summarizeBilling()` reads `billing_subscriptions`, never Stripe. A page that
asks the provider whether the visitor is paying is a page that goes down when
the provider does, and pays a round-trip on every render.

`isPaying()` counts `active` and `trialing`. Not `past_due` — that is a payment
that failed and is being retried, and during that window the honest answer is
no. Anything else, **including statuses Stripe has not invented yet**, is not
paying.

## Owns

- `billing_customers`, `billing_subscriptions`, `billing_events`
- `migrations/001_billing.sql` — applied as `module:billing/…`
- `i18n/{en,es,dk}.json` — merged under `billing.*`
- `/dashboard/settings/billing` and `/api/billing/webhook`

## Imports

`model/types.ts` is free of I/O — import domain logic and `isPaying` from there.
The barrel re-exports server code and pulls a database connection in at module
load, which is correct on the server and wrong in a test or a browser bundle.

## Moving it to another app

1. `cp -r src/modules/billing <other-app>/src/modules/`
2. Register `billingModule` in `core/registry.ts` and `billingTranslations` in
   `core/module-i18n.ts`
3. Copy the two route files under `src/routes/`
4. `cat src/modules/billing/env.example >> .env.example`
5. `pnpm db:migrate && pnpm validate`
