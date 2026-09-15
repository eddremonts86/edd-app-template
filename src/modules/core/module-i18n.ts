import { billingTranslations } from '@/modules/billing/i18n'
import { emailTranslations } from '@/modules/email/i18n'
import { storageTranslations } from '@/modules/storage/i18n'
import type { SupportedLanguage } from '@/shared/lib/i18n/locales'

/** One module's translations, one object per supported language. */
export type ModuleTranslations = Record<SupportedLanguage, Record<string, unknown>>

/**
 * Translations that ship inside a module rather than in the shared catalogue.
 *
 * `common.json` is flat and still carries keys from an app this template no
 * longer is. Repeating that for integrations would make them unmovable: copying
 * `src/modules/email/` to another app has to carry its strings with it
 * (docs/architecture/integration-conventions.md §7).
 *
 * Merged into the `common` namespace under the module id, so a module's keys are
 * `email.*` and cannot collide with another module's.
 *
 * Explicit, like `registry.ts` and for the same reason: one reviewed line per
 * module beats glob discovery that hides the set from a diff.
 */
export const moduleTranslations: Record<string, ModuleTranslations> = {
  email: emailTranslations,
  billing: billingTranslations,
  storage: storageTranslations,
}

export function buildModuleResources(language: SupportedLanguage): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  for (const [moduleId, translations] of Object.entries(moduleTranslations)) {
    merged[moduleId] = translations[language]
  }
  return merged
}
