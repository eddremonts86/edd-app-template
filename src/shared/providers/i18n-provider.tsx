import { useMemo, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { i18n, type SupportedLanguage } from '@/shared/lib/i18n'

interface I18nProviderProps {
  locale: SupportedLanguage
  children: ReactNode
}

export function I18nProvider({ locale, children }: I18nProviderProps) {
  const instance = useMemo(() => {
    // The module-level i18n is a singleton, and on the server it is shared by
    // every in-flight request. Render from a clone pinned to this request's
    // locale so two visitors on different languages cannot race each other.
    if (typeof document === 'undefined') {
      return i18n.cloneInstance({ lng: locale })
    }

    // In the browser there is only ever one visitor, so drive the singleton —
    // that keeps setLocale() from the language switchers working.
    if (i18n.language !== locale) void i18n.changeLanguage(locale)
    return i18n
  }, [locale])

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>
}
