import { IconArrowRight, IconUserPlus } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'
import { useDashboardStats } from '../../api/dashboard.queries'

function formatRelative(iso: string, locale: string) {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffSec / 60)
  const diffHour = Math.round(diffMin / 60)
  const diffDay = Math.round(diffHour / 24)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  if (Math.abs(diffSec) < 60) return rtf.format(-diffSec, 'second')
  if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, 'minute')
  if (Math.abs(diffHour) < 24) return rtf.format(-diffHour, 'hour')
  if (Math.abs(diffDay) < 30) return rtf.format(-diffDay, 'day')
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
}

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

interface RecentSignupsWidgetProps {
  className?: string
}

export function RecentSignupsWidget({ className }: Readonly<RecentSignupsWidgetProps>) {
  const { t, i18n } = useTranslation()
  const { data, isLoading } = useDashboardStats()
  const items = data?.recentSignups ?? []

  let body: React.ReactNode
  if (isLoading) {
    body = ['s1', 's2', 's3'].map((k) => (
      <div key={k} className="flex items-center gap-3 rounded-lg border border-border/60 p-2.5">
        <Skeleton className="h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2.5 w-48" />
        </div>
      </div>
    ))
  } else if (items.length === 0) {
    body = (
      <p className="rounded-lg border border-dashed border-border/60 py-6 text-center text-xs text-muted-foreground">
        {t('dashboard.overview.recentSignups.empty')}
      </p>
    )
  } else {
    body = items.map((u) => (
      <div
        key={u.id}
        className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/15 px-3 py-2.5 transition-colors hover:bg-muted/30"
      >
        <Avatar className="h-9 w-9">
          {u.avatar ? <AvatarImage src={u.avatar} alt={u.name} /> : null}
          <AvatarFallback className="text-xs">{initials(u.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium">{u.name}</p>
            <Badge variant="outline" className="h-4 px-1 text-[10px] font-normal">
              {t(`dashboard.overview.providers.${u.provider}`, { defaultValue: u.provider })}
            </Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
        </div>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {formatRelative(u.createdAt, i18n.language)}
        </span>
      </div>
    ))
  }

  return (
    <Card className={cn('flex flex-col border-border/60', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-500">
            <IconUserPlus className="h-4 w-4" aria-hidden />
          </span>
          {t('dashboard.overview.recentSignups.title')}
        </CardTitle>
        <CardDescription>{t('dashboard.overview.recentSignups.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2">
        {body}
        <Link
          to="/dashboard/users"
          className="mt-auto inline-flex items-center justify-end gap-1 pt-2 text-xs font-medium text-primary hover:underline"
        >
          {t('dashboard.overview.recentSignups.viewAll')}
          <IconArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  )
}
