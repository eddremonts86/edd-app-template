import { isSet } from '@/modules/core/capability'
import { IntegrationUnavailableError } from '@/shared/lib/errors/integration'
import { logger } from '@/shared/lib/observability'

/**
 * The one way this template sends an e-mail.
 *
 * Resend over plain `fetch`, no SDK. Three apps in this workspace arrived at
 * that independently, and it is the smaller thing: one POST, one bearer token,
 * and no dependency to keep patched for the handful of messages a template
 * sends.
 *
 * Fails closed and says so once (docs/architecture/integration-conventions.md
 * §3.1). Unconfigured is a supported state: sign-up works, verification is
 * simply off, and nothing pretends a message was delivered.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

export interface EmailMessage {
  to: string
  subject: string
  html: string
  text: string
}

export type EmailFailure = 'unconfigured' | 'rejected' | 'network'

export type EmailResult =
  { ok: true; id: string | null } | { ok: false; reason: EmailFailure; status?: number }

export interface EmailProvider {
  readonly from: string
  send(message: EmailMessage): Promise<EmailResult>
}

let announced = false

/**
 * Configured means **both** credentials.
 *
 * A sending address has to be on a domain verified at Resend, so there is no
 * honest default for it — a module that reported configured with only the API
 * key would fail at send time with the user watching.
 */
export function isEmailConfigured(): boolean {
  return isSet(process.env.RESEND_API_KEY) && isSet(process.env.EMAIL_FROM)
}

/** The configured sender, or undefined. Never throws. */
export function resolveEmail(): EmailProvider | undefined {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM

  if (!isSet(apiKey) || !isSet(from)) {
    if (!announced) {
      announced = true
      logger.info('email.unconfigured', {
        // Which half is missing, never the value of either.
        code: !isSet(apiKey) ? 'no_api_key' : 'no_from_address',
      })
    }
    return undefined
  }

  return {
    from: from!,
    async send(message) {
      let response: Response
      try {
        response = await fetch(RESEND_ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: from!,
            to: [message.to],
            subject: message.subject,
            html: message.html,
            text: message.text,
          }),
        })
      } catch {
        // No recipient, no subject, no link — a verification URL is a working
        // credential for its lifetime and an address is personal data.
        logger.warn('email.send.network_error', {})
        return { ok: false, reason: 'network' }
      }

      if (!response.ok) {
        logger.warn('email.send.rejected', { status: response.status })
        return { ok: false, reason: 'rejected', status: response.status }
      }

      const body = (await response.json().catch(() => null)) as { id?: string } | null
      logger.info('email.send.accepted', {})
      return { ok: true, id: body?.id ?? null }
    },
  }
}

/**
 * For call sites that cannot function without a sender.
 *
 * Nothing in the template uses this — verification and reset degrade instead.
 * It exists so an app built on the template can opt into failing loud.
 *
 * @throws IntegrationUnavailableError
 */
export function requireEmail(): EmailProvider {
  const provider = resolveEmail()
  if (!provider) throw new IntegrationUnavailableError('email')
  return provider
}
