import { IconBug, IconCode } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/shared/lib/utils'

interface DevtoolsToggleProps {
  value: boolean
  onChange: (value: boolean) => void
}

export function DevtoolsToggle({ value, onChange }: DevtoolsToggleProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'group flex items-start gap-4 rounded-xl border p-4 transition-all',
        value
          ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/15'
          : 'border-border/60 bg-card hover:border-primary/30 hover:bg-accent/30',
      )}
    >
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors',
          value ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
        )}
      >
        <IconCode className="size-5" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Label htmlFor="devtools-switch" className="text-sm font-semibold text-foreground">
            {t('settings.devtools.show')}
          </Label>
          <Badge
            variant="outline"
            className="gap-1 border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[10px] font-medium text-amber-700 dark:text-amber-400"
          >
            <IconBug className="size-2.5" />
            Advanced
          </Badge>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {t('settings.devtools.showDescription')}
        </p>
      </div>
      <Switch
        id="devtools-switch"
        checked={value}
        onCheckedChange={onChange}
        className="mt-1 shrink-0"
      />
    </div>
  )
}
