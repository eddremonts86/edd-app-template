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
    <div
      className="flex h-10 w-full overflow-hidden rounded-md ring-1 ring-border/40"
      style={{ backgroundColor: 'oklch(0.96 0.005 240)' }}
    >
      {/* Sidebar */}
      <div
        className="w-1/4 border-r border-border/40"
        style={{ backgroundColor: 'oklch(1 0 0)' }}
      />
      {/* Content Area */}
      <div className="flex-1 p-1 flex flex-col gap-1">
        {/* Orange Accent indicator */}
        <div
          className="h-1.5 w-2/3 rounded-xs"
          style={{ backgroundColor: 'oklch(0.60 0.20 35)' }}
        />
        <div
          className="flex-1 rounded-xs border border-border/40 shadow-2xs"
          style={{ backgroundColor: 'oklch(1 0 0)' }}
        />
      </div>
    </div>
  )
}

function DarkPreview() {
  return (
    <div
      className="flex h-10 w-full overflow-hidden rounded-md ring-1 ring-white/10"
      style={{ backgroundColor: 'oklch(0.12 0.008 30)' }}
    >
      {/* Sidebar */}
      <div
        className="w-1/4 border-r"
        style={{ backgroundColor: 'oklch(0.20 0.01 30)', borderColor: 'oklch(0.26 0.01 30)' }}
      />
      {/* Content Area */}
      <div className="flex-1 p-1 flex flex-col gap-1">
        {/* Orange Accent indicator */}
        <div
          className="h-1.5 w-2/3 rounded-xs"
          style={{ backgroundColor: 'oklch(0.68 0.22 35)' }}
        />
        <div
          className="flex-1 rounded-xs border shadow-2xs"
          style={{ backgroundColor: 'oklch(0.15 0.01 30)', borderColor: 'oklch(0.21 0.01 30)' }}
        />
      </div>
    </div>
  )
}

function SystemPreview() {
  return (
    <div className="flex h-10 w-full overflow-hidden rounded-md ring-1 ring-border/40">
      {/* Light Side */}
      <div
        className="flex w-1/2 overflow-hidden"
        style={{ backgroundColor: 'oklch(0.96 0.005 240)' }}
      >
        <div
          className="w-1/3 border-r border-border/40"
          style={{ backgroundColor: 'oklch(1 0 0)' }}
        />
        <div className="flex-1 p-1 flex flex-col gap-1">
          <div
            className="h-1.5 w-full rounded-xs"
            style={{ backgroundColor: 'oklch(0.60 0.20 35)' }}
          />
          <div
            className="flex-1 rounded-xs border border-border/40"
            style={{ backgroundColor: 'oklch(1 0 0)' }}
          />
        </div>
      </div>
      {/* Dark Side */}
      <div
        className="flex w-1/2 overflow-hidden"
        style={{ backgroundColor: 'oklch(0.12 0.008 30)' }}
      >
        <div
          className="w-1/3 border-r"
          style={{ backgroundColor: 'oklch(0.20 0.01 30)', borderColor: 'oklch(0.26 0.01 30)' }}
        />
        <div className="flex-1 p-1 flex flex-col gap-1">
          <div
            className="h-1.5 w-full rounded-xs"
            style={{ backgroundColor: 'oklch(0.68 0.22 35)' }}
          />
          <div
            className="flex-1 rounded-xs border"
            style={{ backgroundColor: 'oklch(0.15 0.01 30)', borderColor: 'oklch(0.21 0.01 30)' }}
          />
        </div>
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
        <h4 className="text-sm font-semibold text-foreground">
          {t('settings.theme.title', 'Theme')}
        </h4>
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
