import { useEffect, useMemo, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import { i18n, type SupportedLanguage } from '@/shared/lib/i18n'

interface I18nProviderProps {
  locale: SupportedLanguage
  children: ReactNode
}

export function I18nProvider({ locale, children }: I18nProviderProps) {
  // The module-level i18n is a singleton, and on the server it is shared by
  // every in-flight request. Render from a clone pinned to this request's
  // locale so two visitors on different languages cannot race each other.
  const instance = useMemo(
    () => (typeof document === 'undefined' ? i18n.cloneInstance({ lng: locale }) : i18n),
    [locale],
  )

  // In the browser the singleton already started on this locale: i18n.ts reads
  // the same cookie at module load, before React renders. This only covers the
  // case where the cookie changed underneath us (another tab), and it must stay
  // in an effect — calling changeLanguage() during render makes every
  // useTranslation subscriber setState mid-render, which locks the page up.
  useEffect(() => {
    if (i18n.language !== locale) void i18n.changeLanguage(locale)
  }, [locale])

  return <I18nextProvider i18n={instance}>{children}</I18nextProvider>
}
