import { IconCheck } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { languageFlags, languageNames, supportedLanguages } from '@/shared/lib/i18n'
import { cn } from '@/shared/lib/utils'

interface LanguageSelectorProps {
  value: string
  onChange: (value: string) => void
}

const NATIVE_LABELS: Record<string, string> = {
  en: 'United States',
  es: 'España',
  dk: 'Danmark',
}

export function LanguageSelector({ value, onChange }: LanguageSelectorProps) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-semibold text-foreground">
          {t('settings.language.title', 'Language')}
        </h4>
        <span className="text-xs text-muted-foreground">
          {languageNames[value as keyof typeof languageNames] ?? value}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {supportedLanguages.map((lang) => {
          const isActive = value === lang
          return (
            <button
              key={lang}
              type="button"
              onClick={() => onChange(lang)}
              data-active={isActive ? 'true' : undefined}
              className={cn(
                'group relative flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-all',
                'hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/40 hover:shadow-sm',
                isActive
                  ? 'border-primary/60 bg-primary/5 shadow-sm ring-1 ring-primary/20'
                  : 'border-border/60 bg-card',
              )}
            >
              {isActive && (
                <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <IconCheck className="size-3" />
                </span>
              )}
              <span aria-hidden="true" className="text-3xl leading-none">
                {languageFlags[lang]}
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold leading-tight text-foreground">
                  {languageNames[lang]}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {NATIVE_LABELS[lang] ?? lang}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
