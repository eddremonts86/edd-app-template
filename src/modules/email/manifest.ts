import type { AppModuleManifest } from '@/modules/core/types'

/**
 * Transactional e-mail.
 *
 * No routes and no navigation: it is a capability other modules call, not a
 * surface. It is in the registry so that `resolveCapabilities()` can report
 * whether it is configured, and so that disabling it is one entry in
 * `DISABLED_MODULES` rather than an edit.
 */
export const emailModule: AppModuleManifest = {
  id: 'email',
  title: 'Email',
  description: 'Transactional email — verification, password reset, notifications.',
  tags: ['integration'],
  routes: [],
  capability: {
    // Both, not either: a sending address has to be on a verified domain, so
    // there is no honest default for it.
    requires: ['RESEND_API_KEY', 'EMAIL_FROM'],
    unconfiguredKey: 'email.unconfigured',
  },
}
