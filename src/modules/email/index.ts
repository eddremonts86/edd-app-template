/**
 * Transactional e-mail — the module's only public entry.
 *
 * Nothing outside this directory imports from `email/server/*`; that is what
 * lets the whole folder be copied into another app
 * (docs/architecture/integration-conventions.md §2.1).
 */
export { emailModule } from './manifest'
export { emailTranslations } from './i18n'
export { isEmailConfigured, requireEmail, resolveEmail } from './server/provider'
export type { EmailFailure, EmailMessage, EmailProvider, EmailResult } from './server/provider'
export { sendEmail } from './server/send'
export type { EmailKind, SendOutcome, SendRequest } from './server/send'
export { renderPasswordResetEmail, renderVerificationEmail } from './server/templates'
export { emailOutbox } from './model/schema'
export type { EmailOutboxRow } from './model/schema'
