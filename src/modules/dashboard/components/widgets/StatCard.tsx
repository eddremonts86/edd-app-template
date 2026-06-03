import * as React from 'react'
import { cn } from '@/shared/lib/utils'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface StatCardProps {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon?: React.ReactNode
  trend?: { value: number; label?: string } | null
  isLoading?: boolean
  accent?: 'primary' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky'
  className?: string
}

const ACCENT_BG: Record<NonNullable<StatCardProps['accent']>, string> = {
  primary: 'bg-primary/10 text-primary',
  emerald: 'bg-emerald-500/10 text-emerald-500',
  amber: 'bg-amber-500/10 text-amber-500',
  rose: 'bg-rose-500/10 text-rose-500',
  violet: 'bg-violet-500/10 text-violet-500',
  sky: 'bg-sky-500/10 text-sky-500',
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  trend,
  isLoading,
  accent = 'primary',
  className,
}: Readonly<StatCardProps>) {
  return (
    <Card
      className={cn(
        'relative overflow-hidden border-border/60 p-5 transition-colors hover:border-border',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <span className="text-3xl font-bold tabular-nums leading-none">{value}</span>
            )}
            {trend && !isLoading ? (
              <span
                className={cn(
                  'inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold',
                  trend.value > 0 && 'bg-emerald-500/15 text-emerald-500',
                  trend.value < 0 && 'bg-rose-500/15 text-rose-500',
                  trend.value === 0 && 'bg-muted text-muted-foreground',
                )}
              >
                {trend.value > 0 ? '+' : ''}
                {trend.value}
                {trend.label ? ` ${trend.label}` : ''}
              </span>
            ) : null}
          </div>
          {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {icon ? (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              ACCENT_BG[accent],
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  )
}
