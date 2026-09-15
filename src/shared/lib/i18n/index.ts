export type { SupportedLanguage } from './locales'
export {
  default as i18n,
  setLocale,
  languageNames,
  languageFlags,
  supportedLanguages,
  defaultLocale,
  normalizeLocale,
} from './i18n'
export { LOCALE_COOKIE, readLocaleCookie, writeLocaleCookie } from './locale-cookie'
// resolveLocale is deliberately NOT re-exported here: it reaches for
// @tanstack/react-start/server, and this barrel is imported all over the client.
// Import it directly from './resolve-locale' where the request is in scope.
