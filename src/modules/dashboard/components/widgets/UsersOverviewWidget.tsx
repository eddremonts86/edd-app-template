import { IconRefresh, IconUsers } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'
import { useDashboardStats } from '../../api/dashboard.queries'
import { BreakdownBars } from './BreakdownBars'

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'var(--color-primary, hsl(221 83% 53%))',
  admin: 'hsl(262 83% 58%)',
  user: 'hsl(173 58% 39%)',
}

const PROVIDER_COLORS: Record<string, string> = {
  'better-auth': 'hsl(221 83% 53%)',
  clerk: 'hsl(262 83% 58%)',
  local: 'hsl(173 58% 39%)',
}

interface UsersOverviewWidgetProps {
  className?: string
}

export function UsersOverviewWidget({ className }: Readonly<UsersOverviewWidgetProps>) {
  const { t } = useTranslation()
  const { data, isLoading, isFetching, refetch } = useDashboardStats()
  const u = data?.users

  const roleSegments = u
    ? (Object.entries(u.byRole) as Array<[keyof typeof u.byRole, number]>).map(([k, v]) => ({
        key: k,
        label: t(`users.roles.${k}`, { defaultValue: k }),
        value: v,
        color: ROLE_COLORS[k] ?? 'hsl(220 9% 46%)',
      }))
    : []

  const providerSegments = u
    ? (Object.entries(u.byProvider) as Array<[keyof typeof u.byProvider, number]>).map(
        ([k, v]) => ({
          key: k,
          label: t(`dashboard.overview.providers.${k}`, { defaultValue: k }),
          value: v,
          color: PROVIDER_COLORS[k] ?? 'hsl(220 9% 46%)',
        }),
      )
    : []

  const delta = u ? u.newThisWeek - u.newLastWeek : 0

  return (
    <Card className={cn('border-border/60', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <IconUsers className="h-4 w-4" aria-hidden />
            </span>
            {t('dashboard.overview.usersOverview.title')}
          </CardTitle>
          <CardDescription>{t('dashboard.overview.usersOverview.description')}</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label={t('common.refresh')}
        >
          <IconRefresh className={cn('h-4 w-4', isFetching && 'animate-spin')} aria-hidden />
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading || !u ? (
          <>
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-24 w-full" />
          </>
        ) : (
          <>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-4xl font-bold tabular-nums leading-none">{u.total}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('dashboard.overview.usersOverview.totalLabel')}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    'text-sm font-semibold tabular-nums',
                    delta > 0 && 'text-emerald-500',
                    delta < 0 && 'text-rose-500',
                    delta === 0 && 'text-muted-foreground',
                  )}
                >
                  {delta > 0 ? '+' : ''}
                  {delta}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t('dashboard.overview.usersOverview.vsLastWeek')}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('dashboard.overview.usersOverview.byRole')}
                </p>
                <BreakdownBars segments={roleSegments} total={u.total} />
              </div>
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('dashboard.overview.usersOverview.byProvider')}
                </p>
                <BreakdownBars segments={providerSegments} total={u.total} />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
