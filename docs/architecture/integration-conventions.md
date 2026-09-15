# Integration conventions

> **Status:** decided. This document is Tier 0 of
> [`docs/planning/external-integrations-study.md`](../planning/external-integrations-study.md).
> It resolves every question the tiers below it would otherwise re-open, so that
> writing email, payments, storage or delivery is transcription rather than design.
>
> **Scope:** every module that talks to a third party. Not domain modules.
>
> Nothing here is implemented yet. When a tier lands, the code follows this
> document; where it cannot, this document changes first.

---

## 0. Why this exists

Four apps in `~/Projects/eddremonts86/actives/` send email. They do it three
different ways, and two of them read `RESEND_API_KEY` without listing it in
`.env.example` — so a fresh clone boots with email silently off. Four apps take
payments; two of them disagree about whether a missing `STRIPE_SECRET_KEY` should
make the app refuse checkout or fail to start.

Neither divergence is a bug. Both are reasonable positions that were never
decided once. This document decides them once.

---

## 1. The three states of an integration

Every integration is in exactly one of these, and the distinction is load-bearing:

| State                     | Meaning                                                                                     | What the UI does                                                |
| ------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **disabled**              | Module not in the enabled set (`DISABLED_MODULES`, or not a dependency of anything enabled) | The surface does not exist. No route, no nav entry.             |
| **enabled, unconfigured** | Module is on; its credentials are absent                                                    | The surface exists and says so. Actions refuse with a sentence. |
| **enabled, configured**   | Module is on; credentials present and well-formed                                           | Normal operation.                                               |

The middle state is the one the template exists for. A clone with an empty
`.env` must reach it for every integration — booting, rendering, and refusing
honestly.

> **The rule.** _Absent is a supported state._ A missing credential is never an
> exception at import, never a 500, and never a feature that appears to work
> while the data goes nowhere.

### 1.1 Why not fail loud

geoLocal throws when `STRIPE_SECRET_KEY` is unset. That is the right call **for
geoLocal**, whose whole product is a paid marketplace. It is the wrong default
for a template, because the template's job is to be cloned and booted before any
account exists anywhere.

The loud stance stays available, per call site, as `requireX()` (§3.3). An app
that cannot function without a provider opts into failing loud; it does not get
it by accident.

---

## 2. Module anatomy

Integrations are modules under `src/modules/<name>/`, using the existing
`AppModuleManifest`. They are not `src/lib/` helpers, and they are not a generic
"integrations framework" — three services do not justify an abstraction over
services.

A service module is **portable** when it can be copied to another app that
follows these conventions and work after one `pnpm install`, one migration run,
and one env block. That requires everything it owns to live inside its own
directory:

```
src/modules/billing/
├── manifest.ts            # id, routes, nav, capability contract (§4)
├── index.ts               # the public barrel — the ONLY cross-module entry
├── server/
│   ├── provider.ts        # resolve() / require() — the vendor boundary (§3)
│   ├── webhook.ts         # signature verification, idempotency
│   └── index.ts
├── model/
│   ├── schema.ts          # Drizzle tables this module owns
│   └── types.ts           # vendor-neutral domain types
├── migrations/            # module-owned SQL (§6)
│   └── 001_billing.sql
├── components/            # UI
├── i18n/
│   ├── en.json            # namespaced under the module id (§7)
│   ├── es.json
│   └── dk.json
├── env.example            # this module's env block, merged into .env.example (§5.4)
└── README.md              # what it needs, what it does when unconfigured
```

**Hard rule, already in CLAUDE.md:** cross-module imports go through
`index.ts`. Nothing outside `src/modules/billing/` may import
`billing/server/provider`. This is what makes the directory movable.

### 2.3 `model/` is free of I/O, and that is load-bearing

An integration's barrel necessarily re-exports server code — a webhook handler,
a server function — and importing it pulls a database connection in at module
load. That is correct on the server and wrong everywhere else.

So `model/types.ts` holds the domain types and the pure decisions (which
subscription statuses count as paying, which error codes exist) and imports
nothing that performs I/O. **Unit tests of domain logic and any browser-side
code import `model/`, not the barrel.** It is the one sanctioned exception to
§2's rule, and the reason the split exists rather than one big `types.ts` at the
module root.

### 2.1 Moving a module to another app

The procedure, and it must stay this short:

1. `cp -r src/modules/billing <other-app>/src/modules/`
2. Add its line to `src/modules/core/registry.ts` (§2.2).
3. `cat src/modules/billing/env.example >> .env.example` and fill the values.
4. Run `pnpm db:migrate` — it picks up `modules/*/migrations/` (§6).
5. `pnpm validate`.

If a step beyond these five is ever needed, the module is not portable and the
gap is a bug in the module, not in the procedure.

### 2.2 The registry stays explicit

`registry.ts` hardcodes its imports today. **Keep it that way.** Auto-discovery
by glob would remove step 2 above at the cost of making the enabled set invisible
in a diff, unanalysable by the bundler, and dependent on filesystem order. One
line per module in one reviewed file is the correct trade for a template.

---

## 3. The provider boundary

Each integration exposes exactly three server-side functions. No module exports
a vendor SDK type, ever.

### 3.1 `resolve()` — the default

```ts
/** The configured client, or undefined. Never throws. Announces absence once. */
export function resolveBilling(): BillingProvider | undefined
```

- Returns `undefined` when configuration is absent or blank. Empty string counts
  as absent — a `.env` line with nothing after the `=` is the most common way a
  key goes missing.
- Caches the client after first successful construction.
- Announces absence **once per process**, by name, with a machine-readable code,
  through the existing `logger` in `src/shared/lib/observability`:
  `logger.info('billing.unconfigured', { code: 'no_key' })`. Never the key, never
  its length, never a prefix.

The announcement is not decoration. HunterReady added it because a provider
shipped, did not appear in production, and nothing was broken enough to log.

### 3.2 `isConfigured()` — the cheap check

```ts
export function isBillingConfigured(): boolean
```

Constructs nothing. Used by the capability registry (§4) and by any branch that
needs to know without paying for a client.

**Configured means every credential the module needs, not one.** Email requires
both an API key _and_ a verified sending address; there is no honest default for
the second, and a module that reports configured with only the first will fail at
send time with the user watching.

### 3.3 `require()` — the opt-in loud path

```ts
/** @throws IntegrationUnavailableError when unconfigured. */
export function requireBilling(): BillingProvider
```

For apps and call sites where absence is genuinely fatal. It throws
`IntegrationUnavailableError` — a shared, typed error with the module id on it —
never a vendor error class.

### 3.4 Errors never leak the vendor

Domain code must never see a `Stripe.errors.StripeAPIError` or an
`S3ServiceException`. Each module defines a closed union of error codes and a
single error class:

```ts
export type StorageErrorCode =
  'not_found' | 'access_denied' | 'checksum_mismatch' | 'invalid_key' | 'provider_unavailable'

export class StorageProviderError extends Error {
  constructor(
    message: string,
    readonly code: StorageErrorCode,
  ) {
    /* … */
  }
}
```

This is builderhunt's pattern and it is the reason its storage layer could move
from one backend to another as a configuration change.

### 3.5 Pinned API versions travel with the SDK

Where a vendor has dated API versions, pin them in a `const` beside the client
and treat the pin and the SDK bump as **one change**. Stripe's own types enforce
this — `apiVersion` is typed to the single version that SDK release was generated
for, so any other string is a compile error.

⚠️ A webhook **endpoint** carries its own version, set where it was created. The
pin governs requests we make; the endpoint's version governs what we receive.
They drift silently. Change both, and say so in the PR.

---

## 4. The capability registry

A module can be enabled and unconfigured, and **the client cannot find out by
reading env** — `STRIPE_SECRET_KEY` must never reach the browser. Capability is
computed on the server and serialized down.

### 4.1 Declared in the manifest

`AppModuleManifest` gains one optional field:

```ts
export interface AppModuleCapability {
  /** Env keys that must all be present and non-empty for this module to be configured. */
  requires: string[]
  /** Keys that unlock extra behaviour but are not required. */
  optional?: string[]
  /** i18n key for the sentence shown when enabled-but-unconfigured. */
  unconfiguredKey: string
}

export interface AppModuleManifest {
  // …existing fields…
  capability?: AppModuleCapability
}
```

A module without `capability` has no third-party dependency and is always
configured. This keeps every existing manifest valid.

### 4.2 Resolved once, on the server

```ts
// server only
export function resolveCapabilities(): Record<string, boolean>
```

Runs at request time over `getEnabledModules()`, checks each `requires` list
against `process.env`, and returns a plain `Record<moduleId, boolean>`. It is
injected into the router context and read on the client through a hook:

```ts
const { isConfigured } = useCapability('billing')
```

**Only booleans cross the wire.** Never key names, never counts, never partials —
a boolean cannot leak which of four credentials is missing, and that detail
belongs in the server log, not in a page an anonymous visitor can load.

### 4.3 What the UI does with it

An enabled-but-unconfigured module renders its surface and disables its actions
with the sentence from `unconfiguredKey`. It does not hide itself: a hidden
billing page in production looks identical to a broken deploy, and the operator
finds out from a customer.

---

## 5. Environment

### 5.1 One name per concept

Across the active apps the same idea has several spellings. These are the
canonical names; a module that needs one of these uses exactly this spelling:

| Concept                  | Canonical      | Not                                          |
| ------------------------ | -------------- | -------------------------------------------- |
| Public origin of the app | `APP_URL`      | `PUBLIC_APP_URL`, `APP_BASE_URL`, `SITE_URL` |
| Sender address           | `EMAIL_FROM`   | `MAIL_FROM`, `FROM_EMAIL`                    |
| Database                 | `DATABASE_URL` | `DB_URL`, `POSTGRES_URL`                     |

New integrations prefix every key with the module id in upper snake case:
`STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `BILLING_WEBHOOK_SECRET`. The exception is
a vendor's own conventional name where deviating causes more confusion than it
solves (`STRIPE_SECRET_KEY`, `RESEND_API_KEY`).

### 5.2 Never name the vendor in a key that may change vendor

builderhunt stores MinIO credentials under `INTERVIEW_R2_*` — deliberately, so
that moving to R2 would be configuration rather than code. It works, and it costs
a paragraph of comment on every file that touches it explaining that the name
lies.

**Prefer the role to the vendor.** `STORAGE_ENDPOINT`, not `R2_ENDPOINT` or
`MINIO_ENDPOINT`. The endpoint URL already says who is serving it.

### 5.3 `VITE_` prefixed secrets are a build-time error

Any `VITE_`-prefixed variable is compiled into the client bundle. A server-only
secret that acquires that prefix is a silent, total credential leak.

Every module lists its secret keys, and the env parser throws at startup if
`VITE_<SECRET>` is set — in every environment, not only production, because it is
a static shape mistake and not a runtime condition:

```ts
for (const key of SERVER_ONLY_KEYS) {
  if (typeof input[`VITE_${key}`] !== 'undefined') {
    throw new Error(`VITE_${key} must never be set — this is a server-only secret`)
  }
}
```

This is one of the few places the fail-loud stance is correct: there is no
degraded mode for a leaked key.

### 5.4 `.env.example` is the contract, and the gate enforces it

Each module ships `env.example` with its own block, commented. A build step
concatenates them into the root `.env.example`, which stays the single source of
truth the README points at.

Add `pnpm env:check` to `pnpm validate`, modelled on the existing
`i18n:check`. It fails when:

- a key is read in code (`process.env.X`) and is absent from `.env.example`;
- a `capability.requires` entry is absent from `.env.example`;
- a documented server-only secret has a documented `VITE_` twin.

It deliberately does **not** flag a documented key that nothing in `src/` reads:
plenty are consumed by `docker-compose`, `scripts/` or the deployment, and that
rule would be false positives all the way down.

The first rule alone would have caught geoLocal and novelaudio, where
`RESEND_API_KEY` is read and undocumented, and email is off in every fresh clone
with nothing to say so.

### 5.5 Config is read through a typed module, never `process.env` in a component

Already in CLAUDE.md; restated because every integration is a chance to break it.
`src/shared/lib/env.ts` parses and validates once with Zod. On the client it
returns safe placeholders so importing it in a shared file does not crash.

---

## 6. Database ownership

Migrations today are one global, sequentially numbered chain in `drizzle/`. A
module's tables are indistinguishable from anyone else's, so moving `billing` to
another app means reading the whole chain to find its statements. Two modules
(`updates`, `ai`) already keep their own `model/schema.ts`; that precedent
becomes the rule.

**Decisions:**

1. **Every module owns its tables.** Table names are prefixed with the module id:
   `billing_customers`, `billing_events`, `email_outbox`, `storage_objects`. No
   module writes to another module's tables; it calls the owner's barrel.
2. **Schema lives in `model/schema.ts`** inside the module and is re-exported
   from the root schema for Drizzle's benefit.
3. **Migrations live in `src/modules/<id>/migrations/`**, numbered _within the
   module_ (`001_`, `002_`). The runner discovers `modules/*/migrations/*.sql`
   in addition to `drizzle/`, applying module migrations after the core chain and
   recording them in the same ledger under a `module:` prefix so re-runs are safe.
4. **No cross-module foreign keys** except to `users.id`, which every module may
   reference. A FK from `billing` to a domain table makes the module unmovable.
5. **A disabled module's tables stay.** Uninstalling does not drop data; that is
   a deliberate, manual operation.

The migration-runner change is a prerequisite for Tier 1 and should land with it.

---

## 7. i18n

`common.json` is flat and already carries keys from an app this template no longer
is (`todos`, `budgets`, `transactions`). Repeating that for integrations makes
them unmovable.

- Each module owns `i18n/<lang>.json`, merged at startup into the namespace
  `<moduleId>.*`. `billing.checkout.cta`, `email.verification.subject`.
- Moving a module carries its translations with it.
- `i18n:check` already fails on a missing key in any target language; that stays
  and now covers module files.
- Every integration must ship at least the `unconfiguredKey` sentence in all
  three languages — it is the string most likely to be seen by someone who
  cannot fix it themselves.

---

## 8. Cross-cutting rules

### 8.1 Logging

One structured line per meaningful outcome, through the existing `logger` in
`src/shared/lib/observability`.

**Never logged, in any environment:** API keys, key prefixes, key lengths, full
email addresses, verification or reset URLs (a working credential for its
lifetime), webhook payload bodies, card data of any kind.

**Always logged:** which integration, which outcome, and a stable code
(`logger.warn('billing.webhook.rejected', { code: 'bad_signature' })`).

HunterReady enforces this with a runtime allowlist — `event()` refuses any field
that could carry free text, "because conventions do not survive a hurried
Friday". Worth adopting in `observability/logger.ts` if a leak ever happens;
until then the rule above is a review item, not a guard.

### 8.2 Webhooks

Every inbound webhook route, without exception:

1. Verifies the signature **before parsing the body**, against the raw bytes.
2. Supports a `*_WEBHOOK_SECRET_PREVIOUS` alongside the current secret, so
   rotation never drops an event. builderhunt is the only app that has this;
   it is cheap and it is exactly what you do not want to discover you need
   during a rotation.
3. Is idempotent by the provider's event id, stored in a module-owned table.
   Providers retry; a retry must not charge, send or delete twice.
4. Returns 2xx as soon as the event is durably recorded, and does the work
   after. A slow handler becomes a retry storm.

### 8.3 Secrets that are ours, not a vendor's

`CRON_SECRET`, `WEBHOOK_PAYLOAD_ENCRYPTION_KEY`, `DB_CONFIG_SECRET` exist in the
credential store and follow the same rules: server-only, listed in
`.env.example`, absent-tolerant where the feature is optional, and never a
`VITE_` twin.

### 8.4 Testing

- **Unit:** the resolver's three states — absent, blank string, present — for
  every module. This is the contract, so it is the test that must exist.
- **Contract:** webhook signature verification against a recorded raw payload,
  including one with the previous secret.
- **Never:** a test that requires a live third-party account. The unconfigured
  path is testable by construction, which is another reason it is the default.
- A dev/E2E capture transport (email writes to a table instead of sending) is
  what makes the rest testable. builderhunt has it; port it.

### 8.5 Money and cards

No card field ever exists in this codebase — not a component, not a placeholder,
not a disabled input in a mockup. Checkout is a URL the user is sent to. The
strongest guarantee about data you must not hold is that there is nowhere for it
to land.

---

## 9. Resolved decisions per integration

Everything below is settled. The tier that implements it writes code, not
proposals.

### 9.1 Email — `src/modules/email/`

| Question               | Decision                                                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider               | **Resend**, over plain `fetch`. No SDK — one POST, one bearer token. All three existing implementations independently chose this.                                          |
| Configured when        | `RESEND_API_KEY` **and** `EMAIL_FROM` are both set.                                                                                                                        |
| Unconfigured behaviour | `sendEmail()` returns `{ ok: false, reason: 'unconfigured' }`. Better Auth verification and reset stay off; sign-up does not demand a confirmation nobody can receive.     |
| Reliability            | `email_outbox` table. A send is recorded before it is attempted and marked on result, so a failure is retryable rather than lost.                                          |
| Dev transport          | Writes to the outbox and returns the link instead of sending. This is how E2E tests a verification flow.                                                                   |
| Templates              | Verification and password reset ship with the module. HTML carries inline styles — email clients strip stylesheets, and it is the one place a table names its own colours. |
| Store                  | `RESEND_API_KEY` and `EMAIL_FROM` move into the AI-OS credential store as their own section. Four apps currently each keep a private copy and the store has none.          |

### 9.2 Payments — `src/modules/billing/`

| Question               | Decision                                                                                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider               | **Stripe.** Every app that charges uses it and nothing else. Open question 1 is closed.                                                                                                                 |
| Configured when        | `STRIPE_SECRET_KEY` is set. Webhook handling is separately configured by `STRIPE_WEBHOOK_SECRET` and separately absent.                                                                                 |
| Unconfigured behaviour | Pricing renders honestly; checkout refuses with a sentence; the app boots.                                                                                                                              |
| API version            | Pinned `const`, moved only with the SDK bump.                                                                                                                                                           |
| Webhooks               | Signature-verified against raw bytes, `STRIPE_WEBHOOK_SECRET_PREVIOUS` supported from day one, idempotent on `event.id` via `billing_events`.                                                           |
| Billing state          | Kept in `billing_customers` / `billing_subscriptions` owned by this module. Never read live from Stripe per request.                                                                                    |
| Paying statuses        | `active` and `trialing` count. `past_due` does not — Stripe is retrying and the honest answer is that they are not currently paying. Unknown future statuses are **not** paying; the list fails closed. |
| Cards                  | See §8.5.                                                                                                                                                                                               |
| Worth it at two apps?  | Yes — open question 2 closed. It is the most expensive thing to get wrong and the one where a divergence costs money rather than an afternoon.                                                          |

### 9.3 Object storage — `src/modules/storage/`

| Question               | Decision                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend                | **Self-hosted MinIO** via the S3 API, with a Hetzner Storage Box as the secondary. Open question 3 is closed — and the study that asked it was wrong: builderhunt does not use R2. Its own `types.ts` says the backing store is MinIO and the `INTERVIEW_R2_*` names are a deliberate lie; the credential store holds `BUILDERHUNT_MINIO_*` and `BUILDERHUNT_STORAGEBOX_*`, and no AWS or Cloudflare key at all. |
| Env naming             | `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`, `STORAGE_SECRET_ACCESS_KEY`, `STORAGE_REGION`. Role, not vendor (§5.2). Defaults point at MinIO.                                                                                                                                                                                                                                                  |
| Interface              | Port builderhunt's `StorageProvider` verbatim: signed upload, signed download, head, delete, move, and a streaming read for workers. Vendor-neutral errors (§3.4).                                                                                                                                                                                                                                               |
| Bytes                  | Never transit the app server on the user's path. Presigned URLs both directions.                                                                                                                                                                                                                                                                                                                                 |
| Dev                    | A local-disk provider behind the same interface, so an upload works with no credentials at all.                                                                                                                                                                                                                                                                                                                  |
| Unconfigured behaviour | **This is the one exception.** Storage uses `require()`: a fallback would let uploads appear to work while files went nowhere, and the first sign of trouble is a download returning nothing months later. The module is `enabledByDefault: false` instead, so a clone that does not need it never sees the error.                                                                                               |
| Scanning & retention   | ClamAV and the retention worker stay as opt-in hooks with shipped interfaces and no implementation.                                                                                                                                                                                                                                                                                                              |

### 9.4 Delivery — repository, not a module

Not a `src/modules/` entry: it is CI configuration.

| Question     | Decision                                                                                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Target       | Coolify, triggered by `GET /api/v1/deploy?uuid=<uuid>&force=false` from GitHub Actions. That is what the fleet uses; an earlier draft of this table said `POST` and was wrong.                                                              |
| Secrets      | `COOLIFY_API_URL`, `COOLIFY_API_TOKEN`, `COOLIFY_APP_UUID` — the same three names in every app, and what the values are called in the credential store. Resolve the UUID by name at setup; a stored one points at the last app provisioned. |
| Shape        | `deploy.yml` beside `quality.yml`, documented in the README.                                                                                                                                                                                |
| Waiting      | Poll `GET /api/v1/deployments/<uuid>` until `finished`; fail on `failed` or `cancelled-by-user`. With `queued` and `in_progress` those are the whole set. A workflow that only queues reports green while production breaks.                |
| Gate         | `quality.yml` runs on `main` and `dev` and **builds the production image**. Coolify builds the Dockerfile, not `pnpm build`; nothing else catches a drifted lockfile.                                                                       |
| Unconfigured | Skips with a notice. A clone with no Coolify secrets should not have a red Actions tab on day one — the same rule §1 applies to every integration.                                                                                          |
| Env sync     | **Not built.** It writes to production configuration, and there is no Coolify instance here to verify it against; shipping an unverified writer of deployed config is the wrong trade. Secrets are set by hand until it can be tested.      |

### 9.5 Notifications — `src/modules/notifications/`, later

The credential store holds `TELEGRAM_BOT_TOKEN` and `WHATSAPP_MY_NUMBER` and no
app uses them. When it is built, it is **the same sender interface as email**
with a different transport, not a parallel system: one `notify(channel, message)`
whose channels are configured independently and each absent-tolerant.

Not scheduled. Written down so that when it happens it does not become a fourth
way to send a message.

---

## 10. Explicitly not planned

- **A generic integrations framework.** Three modules that look alike because
  they follow this document, not three implementations of an interface.
- **OAuth providers beyond Clerk / Better Auth.** Better Auth supports Google and
  Microsoft already; that is configuration.
- **Everything single-app**: Deepgram, Mistral, Azure OpenAI, Ticketmaster, the
  source-API connectors, ClamAV implementations, PocketBase.
- **Hetzner provisioning and Conductor.** Operator tooling. An app must never
  hold a cloud token that can create servers.
- **Feature-flag infrastructure.** builderhunt has ~30 `*_ENABLED` keys. A
  separate question from service integration.

---

## 11. Checklist for a new integration

Copy this into the PR description.

- [ ] Lives in `src/modules/<id>/` with the layout in §2
- [ ] Exports only through `index.ts`; no deep imports from outside
- [ ] `resolve()` returns `undefined` when unconfigured, and never throws
- [ ] `isConfigured()` requires **every** credential, not the first one
- [ ] Absence announced once, by name, with no key material
- [ ] `capability.requires` declared in the manifest, `unconfiguredKey` in all 3 languages
- [ ] Vendor types and errors do not escape the module
- [ ] Env keys follow §5.1, listed in `env.example`, none `VITE_`-prefixed
- [ ] Tables prefixed with the module id; migrations in the module; no cross-module FKs
- [ ] Webhooks: raw-body signature check, `_PREVIOUS` secret, idempotent, fast 2xx
- [ ] Unit test covers absent / blank / present
- [ ] `pnpm validate` and `pnpm build` pass
- [ ] Moving the directory to another app takes the five steps in §2.1

---

## Open questions

None. That is the point of this document. When one appears, it is answered here
before the code changes.
