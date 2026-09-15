/**
 * The locale cookie.
 *
 * The language has to travel in a cookie rather than localStorage: the server
 * renders the page before any client code runs, so it needs to see the same
 * choice the browser will hydrate with. A localStorage value is invisible to
 * the server and produces a hydration mismatch.
 */

import { normalizeLocale, type SupportedLanguage } from './locales'

export const LOCALE_COOKIE = 'locale'

// A language preference, not a session — keep it for a year.
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

/**
 * Read the locale out of a raw `Cookie:` header (server) or `document.cookie`
 * (client) — both use the same `a=1; b=2` encoding.
 */
export function readLocaleCookie(cookieHeader?: string | null): SupportedLanguage | null {
  if (!cookieHeader) return null

  for (const pair of cookieHeader.split(';')) {
    const separator = pair.indexOf('=')
    if (separator === -1) continue
    if (pair.slice(0, separator).trim() !== LOCALE_COOKIE) continue
    return normalizeLocale(decodeURIComponent(pair.slice(separator + 1).trim()))
  }

  return null
}

/**
 * Persist the locale for subsequent requests. Client-only — the server never
 * needs to write it, the browser is where the choice is made.
 */
export function writeLocaleCookie(locale: SupportedLanguage): void {
  if (typeof document === 'undefined') return
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`
}
