/**
 * The two messages every app built on this template needs.
 *
 * The HTML deliberately sits outside the app's visual system: e-mail clients
 * strip stylesheets and support none of the CSS custom properties the rest of
 * the UI is built on, so this markup carries inline styles and names its own
 * colours. It is the one place in the codebase where that is correct.
 *
 * Both take the locale so the message matches the language the person chose,
 * and both return plain text as well — a text part is what keeps a message out
 * of a spam folder and readable in a client that refuses HTML.
 */
import i18n from 'i18next'
import type { SupportedLanguage } from '@/shared/lib/i18n/locales'

interface Rendered {
  subject: string
  html: string
  text: string
}

const BODY =
  'margin:0;padding:24px;background:#f4f4f5;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#18181b;'
const CARD =
  'max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e4e4e7;'
const BUTTON =
  'display:inline-block;background:#c2410c;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:9999px;font-weight:600;'
const MUTED = 'color:#52525b;font-size:13px;line-height:1.6;margin:24px 0 0;'

function layout(
  heading: string,
  body: string,
  cta: { label: string; url: string },
  footer: string,
) {
  return `<!doctype html><html><body style="${BODY}">
  <div style="${CARD}">
    <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">${heading}</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">${body}</p>
    <a href="${cta.url}" style="${BUTTON}">${cta.label}</a>
    <p style="${MUTED}">${footer}</p>
    <p style="${MUTED}word-break:break-all;">${cta.url}</p>
  </div>
</body></html>`
}

function t(locale: SupportedLanguage, key: string): string {
  return i18n.getFixedT(locale)(key)
}

export function renderVerificationEmail(locale: SupportedLanguage, url: string): Rendered {
  const heading = t(locale, 'email.verification.heading')
  const body = t(locale, 'email.verification.body')
  const cta = t(locale, 'email.verification.cta')
  const footer = t(locale, 'email.verification.footer')

  return {
    subject: t(locale, 'email.verification.subject'),
    html: layout(heading, body, { label: cta, url }, footer),
    text: `${heading}\n\n${body}\n\n${url}\n\n${footer}`,
  }
}

export function renderPasswordResetEmail(locale: SupportedLanguage, url: string): Rendered {
  const heading = t(locale, 'email.passwordReset.heading')
  const body = t(locale, 'email.passwordReset.body')
  const cta = t(locale, 'email.passwordReset.cta')
  const footer = t(locale, 'email.passwordReset.footer')

  return {
    subject: t(locale, 'email.passwordReset.subject'),
    html: layout(heading, body, { label: cta, url }, footer),
    text: `${heading}\n\n${body}\n\n${url}\n\n${footer}`,
  }
}
