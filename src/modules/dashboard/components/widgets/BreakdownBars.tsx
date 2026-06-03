import * as React from 'react'
import { cn } from '@/shared/lib/utils'

interface Segment {
  key: string
  label: string
  value: number
  color: string
}

interface BreakdownBarsProps {
  segments: Segment[]
  total?: number
  className?: string
}

export function BreakdownBars({ segments, total, className }: Readonly<BreakdownBarsProps>) {
  const computedTotal =
    total ?? segments.reduce((acc, s) => acc + (Number.isFinite(s.value) ? s.value : 0), 0)
  const safeTotal = computedTotal > 0 ? computedTotal : 1

  return (
    <div className={cn('space-y-3', className)}>
      {segments.map((s) => {
        const pct = Math.round((s.value / safeTotal) * 100)
        return (
          <div key={s.key} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-foreground/90">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ ['--bar' as string]: s.color, background: 'var(--bar)' } as React.CSSProperties}
                  aria-hidden
                />
                {s.label}
              </span>
              <span className="font-medium tabular-nums text-muted-foreground">
                {s.value} <span className="text-muted-foreground/60">· {pct}%</span>
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ ['--bar' as string]: s.color, width: `${pct}%`, background: 'var(--bar)' } as React.CSSProperties}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
