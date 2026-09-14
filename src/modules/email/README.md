# Email

Transactional e-mail: verification, password reset, and a generic sender.
Resend over plain `fetch`, no SDK.

Follows [`docs/architecture/integration-conventions.md`](../../../docs/architecture/integration-conventions.md).

## Configuration

| Key              | Required | Notes                                  |
| ---------------- | -------- | -------------------------------------- |
| `RESEND_API_KEY` | yes      | resend.com → API Keys                  |
| `EMAIL_FROM`     | yes      | must be on a domain verified at Resend |

**Both, not either.** A sending address has to be on a verified domain, so there
is no honest default for it, and reporting configured with only the key would
fail at send time with the user watching.

## What it does with no configuration

Boots. Signs users up. Verification and password reset stay off rather than
demanding a confirmation nobody can receive. Every message is still written to
`email_outbox` with status `captured` and its link in `dev_link`, which is the
development and E2E transport — a verification flow is testable without a Resend
account, and that is why this path is the default rather than an afterthought.

The absence is announced once per process as `email.unconfigured`, with a code
saying which half is missing and never the value of either.

## Use

```ts
import { renderVerificationEmail, sendEmail } from '@/modules/email'

const { subject, html, text } = renderVerificationEmail(locale, url)
const result = await sendEmail({ to, subject, html, text, kind: 'verification', link: url })

if (!result.ok && result.reason === 'unconfigured') {
  // result.devLink is the URL — log it locally, never in a deployed environment.
}
```

`requireEmail()` exists for an app that genuinely cannot run without a sender.
Nothing in the template uses it.

## Owns

- `email_outbox` — one row per attempt, written before the attempt
- `migrations/001_email_outbox.sql` — applied as `module:email/…`
- `i18n/{en,es,dk}.json` — merged under the `email.*` namespace

## Moving it to another app

1. `cp -r src/modules/email <other-app>/src/modules/`
2. Add `emailModule` to `src/modules/core/registry.ts` and
   `emailTranslations` to `src/modules/core/module-i18n.ts`
3. `cat src/modules/email/env.example >> .env.example`
4. `pnpm db:migrate`
5. `pnpm validate`
