import { IconCheck, IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'
import type { Theme } from '../model'

interface ThemeSelectorProps {
  value: Theme
  onChange: (value: Theme) => void
}

interface ThemeOption {
  id: Theme
  labelKey: string
  icon: typeof IconSun
  preview: React.ReactNode
}

function LightPreview() {
  return (
    <div className="flex h-10 w-full overflow-hidden rounded-md ring-1 ring-border/60">
      <div className="w-1/3 bg-slate-200" />
      <div className="flex-1 bg-white" />
    </div>
  )
}

function DarkPreview() {
  return (
    <div className="flex h-10 w-full overflow-hidden rounded-md ring-1 ring-border/60">
      <div className="w-1/3 bg-slate-900" />
      <div className="flex-1 bg-slate-800" />
    </div>
  )
}

function SystemPreview() {
  return (
    <div className="flex h-10 w-full overflow-hidden rounded-md ring-1 ring-border/60">
      <div className="flex w-1/2">
        <div className="w-1/2 bg-slate-200" />
        <div className="flex-1 bg-white" />
      </div>
      <div className="flex w-1/2">
        <div className="w-1/2 bg-slate-900" />
        <div className="flex-1 bg-slate-800" />
      </div>
    </div>
  )
}

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const { t } = useTranslation()

  const options: ThemeOption[] = [
    { id: 'light', labelKey: 'theme.light', icon: IconSun, preview: <LightPreview /> },
    { id: 'dark', labelKey: 'theme.dark', icon: IconMoon, preview: <DarkPreview /> },
    {
      id: 'system',
      labelKey: 'theme.system',
      icon: IconDeviceDesktop,
      preview: <SystemPreview />,
    },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h4 className="text-sm font-semibold text-foreground">Theme</h4>
        <span className="text-xs text-muted-foreground">{t(`theme.${value}`)}</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {options.map(({ id, labelKey, icon: Icon, preview }) => {
          const isActive = value === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              data-active={isActive ? 'true' : undefined}
              className={cn(
                'group relative flex flex-col gap-3 rounded-xl border p-3 text-left transition-all',
                'hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/40 hover:shadow-sm',
                isActive
                  ? 'border-primary/60 bg-primary/5 shadow-sm ring-1 ring-primary/20'
                  : 'border-border/60 bg-card',
              )}
            >
              {isActive && (
                <span className="absolute right-2 top-2 z-10 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <IconCheck className="size-3" />
                </span>
              )}
              {preview}
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">{t(labelKey)}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
