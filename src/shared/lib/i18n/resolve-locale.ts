import { createIsomorphicFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'
import { LOCALE_COOKIE, readLocaleCookie } from './locale-cookie'
import { defaultLocale, normalizeLocale, type SupportedLanguage } from './locales'

/**
 * The locale for this render.
 *
 * Both sides read the same cookie from the same request, so the SSR output and
 * the client hydration always agree. Falls back to the build-time default when
 * the visitor has never chosen a language.
 */
export const resolveLocale = createIsomorphicFn()
  .server((): SupportedLanguage => normalizeLocale(getCookie(LOCALE_COOKIE)) ?? defaultLocale)
  .client((): SupportedLanguage => readLocaleCookie(document.cookie) ?? defaultLocale)
