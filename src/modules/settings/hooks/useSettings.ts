import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { setLocale } from '@/shared/lib/i18n'
import { useTheme } from '@/shared/providers/theme-context'
import { DEFAULT_SETTINGS, DEVTOOLS_STORAGE_KEY, type SettingsState, type Theme } from '../model'

function getStoredDevtoolsVisibility(): boolean {
  if (globalThis.window === undefined) return DEFAULT_SETTINGS.devtoolsVisible
  const stored = localStorage.getItem(DEVTOOLS_STORAGE_KEY)
  if (stored === null) return DEFAULT_SETTINGS.devtoolsVisible
  return stored === 'true'
}

export function useSettings() {
  const { i18n } = useTranslation()
  const { theme, setTheme } = useTheme()

  const [pendingLanguage, setPendingLanguage] = useState<string>(i18n.language)
  const [pendingTheme, setPendingTheme] = useState<Theme>(theme)
  const [pendingDevtools, setPendingDevtools] = useState<boolean>(getStoredDevtoolsVisibility)
  const [isSaving, setIsSaving] = useState(false)

  const currentSettings: SettingsState = useMemo(
    () => ({
      language: i18n.language,
      theme,
      devtoolsVisible: getStoredDevtoolsVisibility(),
    }),
    [i18n.language, theme],
  )

  const pendingSettings: SettingsState = useMemo(
    () => ({
      language: pendingLanguage,
      theme: pendingTheme,
      devtoolsVisible: pendingDevtools,
    }),
    [pendingLanguage, pendingTheme, pendingDevtools],
  )

  // Theme and language apply the moment you pick them. Both controls preview the
  // thing they change — the theme cards literally render a miniature of each
  // mode — and gating them behind Save meant clicking Dark highlighted a card
  // and changed nothing, so the control read as broken. Both are client-side and
  // free to apply; Save is left owning the settings that actually need it.
  const selectTheme = useCallback(
    (next: Theme) => {
      setPendingTheme(next)
      setTheme(next)
    },
    [setTheme],
  )

  const selectLanguage = useCallback((next: string) => {
    setPendingLanguage(next)
    void setLocale(next)
  }, [])

  const hasChanges = useMemo(
    () =>
      pendingLanguage !== currentSettings.language ||
      pendingTheme !== currentSettings.theme ||
      pendingDevtools !== currentSettings.devtoolsVisible,
    [pendingLanguage, pendingTheme, pendingDevtools, currentSettings],
  )

  const saveSettings = useCallback(async () => {
    setIsSaving(true)

    // Simulate a small delay for UX feedback
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Apply language
    if (pendingLanguage !== i18n.language) {
      await setLocale(pendingLanguage)
    }

    // Apply theme
    if (pendingTheme !== theme) {
      setTheme(pendingTheme)
    }

    // Persist devtools visibility
    localStorage.setItem(DEVTOOLS_STORAGE_KEY, String(pendingDevtools))

    // Dispatch custom event so RootDocument can react
    globalThis.dispatchEvent(
      new CustomEvent('devtools-visibility-change', {
        detail: { visible: pendingDevtools },
      }),
    )

    setIsSaving(false)
  }, [pendingLanguage, pendingTheme, pendingDevtools, i18n, theme, setTheme])

  const resetToDefaults = useCallback(() => {
    selectLanguage(DEFAULT_SETTINGS.language)
    selectTheme(DEFAULT_SETTINGS.theme)
    setPendingDevtools(DEFAULT_SETTINGS.devtoolsVisible)
  }, [selectLanguage, selectTheme])

  return {
    pendingSettings,
    currentSettings,
    hasChanges,
    isSaving,
    setPendingLanguage,
    setPendingTheme,
    selectLanguage,
    selectTheme,
    setPendingDevtools,
    saveSettings,
    resetToDefaults,
  }
}
