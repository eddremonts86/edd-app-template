import { IconRefresh, IconUsers } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'
import { useDashboardStats } from '../../api/dashboard.queries'
import { BreakdownBars } from './BreakdownBars'

// Read the theme's chart ramp instead of hardcoding hues: the previous values
// were the stock shadcn demo palette (blue-600, violet-500, teal-600), which
// PRODUCT.md rules out twice over.
const ROLE_COLORS: Record<string, string> = {
  super_admin: 'var(--chart-1)',
  admin: 'var(--chart-2)',
  user: 'var(--chart-3)',
}

const PROVIDER_COLORS: Record<string, string> = {
  'better-auth': 'var(--chart-1)',
  clerk: 'var(--chart-2)',
  local: 'var(--chart-3)',
}

const FALLBACK_SEGMENT_COLOR = 'var(--chart-5)'

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
        color: ROLE_COLORS[k] ?? FALLBACK_SEGMENT_COLOR,
      }))
    : []

  const providerSegments = u
    ? (Object.entries(u.byProvider) as Array<[keyof typeof u.byProvider, number]>).map(
        ([k, v]) => ({
          key: k,
          label: t(`dashboard.overview.providers.${k}`, { defaultValue: k }),
          value: v,
          color: PROVIDER_COLORS[k] ?? FALLBACK_SEGMENT_COLOR,
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
          aria-label={t('common.actions.refresh')}
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
