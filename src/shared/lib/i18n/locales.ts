/**
 * Locale constants.
 *
 * Kept separate from `i18n.ts` so the cookie helpers can import them without
 * pulling in (and initialising) the i18next instance — importing i18next from
 * the locale-cookie module would create a cycle.
 */

export const supportedLanguages = ['en', 'es', 'dk'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

export const languageNames: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
  dk: 'Dansk',
}

export const languageFlags: Record<SupportedLanguage, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  dk: '🇩🇰',
}

export const defaultLocale: SupportedLanguage =
  normalizeLocale(import.meta.env.VITE_DEFAULT_LOCALE) ?? 'en'

/**
 * Narrow an arbitrary language tag ("es-ES", "ES", null) to a supported locale.
 */
export function normalizeLocale(value?: string | null): SupportedLanguage | null {
  if (!value) return null
  const base = value.toLowerCase().split('-')[0]
  return supportedLanguages.includes(base as SupportedLanguage) ? (base as SupportedLanguage) : null
}
