# External integrations across the active apps — study and plan

> Survey of `~/Projects/eddremonts86/actives/` taken 2026-09-14. Nothing here is
> implemented; this is the evidence and the plan that follows from it.

## What was surveyed

Ten directories carry a `package.json`. Nine are applications; `ai-schadcn-chat`
is a published library and is excluded from the integration counts.

| App                   | Framework             | Has `.env.example` |
| --------------------- | --------------------- | ------------------ |
| HunterReady           | TanStack Start + Vite | yes                |
| budget-app            | TanStack Start + Vite | yes                |
| builderhunt           | TanStack Start + Vite | yes                |
| edd-app-template      | TanStack Start + Vite | yes                |
| edd-remonts-dashboard | TanStack Start + Vite | yes                |
| geoLocal              | TanStack Start + Vite | yes                |
| edd-app-vite          | Vite (SPA)            | yes                |
| enForma               | Vite (SPA)            | yes                |
| mdxViewer             | Vite (SPA)            | no                 |

**Six of nine share the template's exact stack.** Integration code written for
the template ports to them without translation. That is the single fact that
makes this worth doing.

`data`, `eddremonts` and `novelaudio` have no `package.json` and were skipped.

---

## The inventory

195 distinct environment keys exist across the apps. 32 appear in two or more —
those are the things being configured repeatedly.

### Already standard (in 5–6 apps)

| Concern            | Keys                                                   | Apps |
| ------------------ | ------------------------------------------------------ | ---- |
| Database           | `DATABASE_URL`                                         | 6    |
| Auth (Better Auth) | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `AUTH_MODE`   | 5–6  |
| Auth (Clerk)       | `VITE_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`       | 4–5  |
| Admin seed         | `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`        | 6    |
| AI (MiniMax)       | `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL` | 6    |
| Observability      | `VITE_SENTRY_DSN`                                      | 5    |
| App identity       | `APP_URL`, `PORT`, `NODE_ENV`                          | 5    |

The template covers all of these. This half of the problem is solved.

### Recurring but **not** in the template

| Concern                 | Keys                                            | Apps                                                  |
| ----------------------- | ----------------------------------------------- | ----------------------------------------------------- |
| **Payments**            | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`    | builderhunt, geoLocal (enForma: keys only, see below) |
| **Transactional email** | `RESEND_API_KEY` (+ `EMAIL_FROM` / `MAIL_FROM`) | HunterReady, builderhunt, geoLocal                    |
| **Object storage**      | `INTERVIEW_R2_*` (S3-compatible)                | builderhunt                                           |

`stripe` is a dependency of three apps — HunterReady, builderhunt, geoLocal —
and `@stripe/react-stripe-js` of one. `@aws-sdk/client-s3` of one. No app
depends on a Resend SDK; all three call the HTTP API directly.

**enForma is not a Stripe integration.** It declares `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET` and `STRIPE_PORTAL_URL`, but has no `stripe`
dependency, no server-side call and one billing component — it links out to a
hosted portal. Counting it would have overstated the case for Tier 2. Server
integrations: **builderhunt and geoLocal**, with HunterReady's client written
but its app not in the shared env set.

### One-offs worth knowing about

Not candidates for the template, but they show the shape of what gets bolted on:
builderhunt alone integrates GitHub, GitLab, Codeberg, Reddit, StackOverflow,
ProductHunt, HuggingFace, Deepgram, Mistral, Azure OpenAI and Cloudflare R2.
enForma integrates Google and Microsoft OAuth, Ticketmaster and a calendar
service. geoLocal has an AI scraper.

---

## The actual problem

It is not that the SDKs are missing. It is that **the same integration has been
written three times, slightly differently each time**, and the differences are
not deliberate.

### Evidence: three Resend clients

All three send over plain `fetch` with no SDK, and all three degrade when the
key is absent. They disagree on everything else:

|                | HunterReady                           | builderhunt          | geoLocal            |
| -------------- | ------------------------------------- | -------------------- | ------------------- |
| Sender env var | `EMAIL_FROM`                          | (inline)             | `MAIL_FROM`         |
| App URL var    | `APP_URL`                             | `VITE_APP_URL`       | `PUBLIC_APP_URL`    |
| Unconfigured   | returns `false`                       | returns `{ok:false}` | logs to console     |
| Templates      | `verificationEmail()`, `resetEmail()` | per-purpose senders  | per-purpose senders |

Three names for the sender address. Three failure contracts. A fourth app
starts from a coin flip.

### Evidence: two Stripe clients

`HunterReady/src/lib/stripe.ts` and `geoLocal/src/shared/lib/payments/stripe.ts`
are roughly 85% identical — cached singleton, env read at first use, pinned
`apiVersion`, a `getWebhookSecret()` helper. They differ on one real decision:

- **HunterReady** returns `undefined` when unconfigured. Its comment argues the
  case: _"Beta ships before pricing does, so a deployment with no Stripe
  configuration has to boot clean, render the pricing surface honestly, and
  refuse the checkout with a sentence rather than a 500."_
- **geoLocal** throws: _"throws a clear error if missing so developers don't
  silently call mock endpoints."_

Both are defensible. Having both, undocumented, is the problem — it means every
new app re-litigates it.

builderhunt's `src/lib/storage/provider.ts` makes the same choice a third time
and writes down why: _"Fails closed and loudly… a fallback would let the upload
path appear to work while candidate documents went nowhere."_

### Evidence: the template's own gap

A `grep` for integration files under `edd-app-template/src`:

```
stripe 0 · resend 0 · email 0 · upload 0 · s3 0 · webhook 0 · billing 0
```

The template has database, auth, AI, i18n and observability. For payments,
email and storage it has nothing — so each app has started from zero.

---

## What this costs today

Starting an app that charges money and sends email means writing, again: a
Stripe singleton, a webhook route with signature verification, an idempotency
guard, a customer↔user mapping, a billing-state read model, an email sender, a
verification template, a reset template, and the "not configured" branch for
each. Roughly a day, and the result diverges from the last one.

---

## Plan

Four tiers, ordered by how often the thing is needed and how much it hurts to
redo. Each is independently shippable.

### Tier 0 — Decide the conventions (no code)

> **Resolved.** See [`docs/architecture/integration-conventions.md`](../architecture/integration-conventions.md),
> which decides everything below and closes the three open questions at the
> foot of this document. The sketch that follows is kept as the record of what
> was proposed before it was settled.

The divergences above are decisions, not accidents waiting to be merged. Write
them into `DESIGN.md` or a new `docs/architecture/integration-conventions.md`
first, because every tier below depends on them:

1. **Absent-provider contract.** Proposal: _configured-or-absent, never
   throwing at import_. `getX()` returns `undefined`; callers decide. This is
   HunterReady's position, and it is the one that lets a template boot with an
   empty `.env` — which is the template's whole job. Storage's fail-loud stance
   stays available as an explicit `requireX()`.
2. **Env naming.** One name per concept: `EMAIL_FROM` (not `MAIL_FROM`),
   `APP_URL` (not `PUBLIC_APP_URL`/`VITE_APP_URL`).
3. **Startup announcement.** HunterReady announces which providers resolved,
   names only, never key material. Adopt it — its comment records why: _"DeepSeek
   shipped and did not appear in production, and nothing was broken enough to
   log."_
4. **Where integrations live.** `src/modules/<service>/` with the module
   manifest, matching the existing architecture, rather than `src/lib/`.

**Cost:** an afternoon of writing. **Unblocks:** everything else.

### Tier 1 — Email (`src/modules/email/`)

Highest frequency, lowest risk, no money involved. Three implementations already
exist to merge.

- Resend over `fetch`, no SDK — all three apps independently chose this.
- `sendEmail({to, subject, text, html})` plus the two templates every app needs:
  verification and password reset. Better Auth already calls for both.
- Unconfigured → returns `false` and logs; never throws.
- A dev/E2E capture mode, which builderhunt already has and is what makes email
  testable at all.

### Tier 2 — Payments (`src/modules/billing/`)

Two apps with real server integrations, plus HunterReady's client — and the
highest cost of the three to get wrong.

- Stripe singleton with pinned `apiVersion`, merged from the two existing ones.
- Webhook route with signature verification and an **idempotency table** —
  builderhunt has `billing-events` and `billing-ledger` repositories worth
  reading before designing this.
- Checkout-session creation. Carry over HunterReady's rule verbatim: **no card
  field ever exists in the codebase**; checkout is a URL Stripe hosts.
- A `billing_customer` table mapping user → Stripe customer, since every app
  needs it and every app has invented it.

Deliberately **out of scope**: pricing tiers, entitlements, tax. Those are
product decisions per app. HunterReady's `entitlements.ts` is app-specific and
should stay there.

### Tier 3 — Object storage (`src/modules/storage/`)

Only builderhunt needs it today, but it has the cleanest abstraction of the
three — a `StorageProvider` interface with an S3 implementation, covering both
AWS S3 and Cloudflare R2.

- Port `types.ts` + `s3-provider.ts` roughly as they are.
- Presigned upload/download URLs; bytes never transit the app server.
- The virus-scanner hook exists in builderhunt (`ClamAvScanner`). Keep the
  interface, ship no scanner.

### Not planned

- **OAuth providers beyond Clerk/Better Auth** (Google, Microsoft — enForma).
  Better Auth already supports them; it is configuration, not integration code.
- **Everything builderhunt-specific** (GitHub, Reddit, Deepgram, …). Those are
  its product, not infrastructure.
- **A generic "integrations framework."** Three services do not justify an
  abstraction over services. Write three modules that look alike because they
  follow Tier 0, not three implementations of an interface.

---

## Sequencing

Tier 0 first — it is cheap and everything else inherits from it. Then Tier 1,
which is small enough to validate the conventions before Tier 2 commits them to
code that handles money. Tier 3 last, or on demand.

Each tier lands with the same gate the template already enforces: `pnpm validate`
and `pnpm build`, plus `.env.example` updated, which is the file this repo treats
as the source of truth for required configuration.

## Open questions

1. **Stripe vs alternatives.** Every app that charges uses Stripe and nothing
   else. Confirm before the template hard-codes it.
2. **Is Tier 2 worth it at two apps?** Email (three apps) and the conventions
   (all apps) pay for themselves immediately. Payments is the most code for the
   narrowest use — it may be worth waiting for a third real integration, or
   doing it precisely because the next one is expensive to get wrong.
3. **Storage: S3 or R2 first?** builderhunt uses R2 through the S3 API. If R2 is
   the standing choice, the defaults should say so.
