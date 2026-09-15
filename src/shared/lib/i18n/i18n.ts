import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { buildModuleResources } from '@/modules/core/module-i18n'
import { readLocaleCookie, writeLocaleCookie } from './locale-cookie'
import { defaultLocale, normalizeLocale, supportedLanguages } from './locales'
import dkCommon from './locales/dk/common.json'
import dkErrors from './locales/dk/errors.json'
// Import locale files directly for better bundling
import enCommon from './locales/en/common.json'
import enErrors from './locales/en/errors.json'
import esCommon from './locales/es/common.json'
import esErrors from './locales/es/errors.json'

export {
  supportedLanguages,
  languageNames,
  languageFlags,
  defaultLocale,
  normalizeLocale,
} from './locales'
export type { SupportedLanguage } from './locales'

// Modules keep their own strings so they can be copied to another app without
// hand-picking a subtree out of common.json. They land under their module id.
const resources = {
  en: {
    common: { ...enCommon, ...buildModuleResources('en') },
    errors: enErrors,
  },
  es: {
    common: { ...esCommon, ...buildModuleResources('es') },
    errors: esErrors,
  },
  dk: {
    common: { ...dkCommon, ...buildModuleResources('dk') },
    errors: dkErrors,
  },
}

const shouldIgnoreI18nLog = (args: unknown[]) =>
  args.some((arg) => typeof arg === 'string' && arg.includes('locize.com'))

const i18nLogger = {
  type: 'logger' as const,
  log: (...args: unknown[]) => {
    if (shouldIgnoreI18nLog(args)) return
  },
  warn: () => {},
  error: () => {},
}

// No language detector: the locale comes from the request cookie via
// resolveLocale(), so the server and the client start on the same language.
// The detector's localStorage cache used to overwrite the stored choice with
// the init language on every reload, which is why a picked language never
// survived a navigation.
// The browser must start on the cookie's language *before* React renders, so
// the first client render matches what the server sent. Doing it later — in a
// provider's render pass or an effect — either mismatches hydration or calls
// changeLanguage() mid-render, which makes every useTranslation subscriber
// setState while another component is rendering.
const initialLocale =
  typeof document === 'undefined'
    ? defaultLocale
    : (readLocaleCookie(document.cookie) ?? defaultLocale)

i18n
  .use(i18nLogger)
  .use(initReactI18next)
  .init({
    resources,
    // On the server this is a placeholder: each request renders from a clone
    // pinned to its own locale. See I18nProvider and resolveLocale().
    lng: initialLocale,
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    ns: ['common', 'errors'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  })

/**
 * Switch language and remember it.
 *
 * Deliberately NOT wired to i18next's `languageChanged` event: init() emits
 * that event too, which would stamp the cookie with the init language on every
 * page load and wipe the visitor's choice — the same clobbering the removed
 * localStorage cache used to do. Call this instead of i18n.changeLanguage().
 */
export function setLocale(language: string): Promise<unknown> {
  const locale = normalizeLocale(language)
  if (!locale) return Promise.resolve()

  writeLocaleCookie(locale)
  return i18n.changeLanguage(locale)
}

export default i18n
