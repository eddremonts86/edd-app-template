import { IconUsers } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { WidgetRefreshButton, WidgetRefreshingIndicator } from '@/modules/core/widget'
import { useDashboardStats } from '../api/dashboard.queries'

/**
 * DashboardPage — generic template version.
 * Shows basic user count stat. Replace with your app-specific KPIs.
 */
export function DashboardPage() {
  const { t } = useTranslation()
  const { data, isLoading, isFetching, refetch } = useDashboardStats()

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t('dashboard.title', 'Dashboard')}
          </h2>
          <p className="text-muted-foreground">
            {t('dashboard.subtitle', 'Overview of your application.')}
          </p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.stats.totalUsers', 'Total Users')}
            </CardTitle>
            <div className="flex items-center gap-1">
              {isFetching && <WidgetRefreshingIndicator />}
              <WidgetRefreshButton
                isRefreshing={isFetching}
                onRefresh={refetch}
              />
              <IconUsers className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse bg-muted rounded" />
            ) : (
              <div className="text-2xl font-bold">{data?.totalUsers ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.stats.registeredUsers', 'Registered users')}
            </p>
          </CardContent>
        </Card>

        {/* Add more stat cards here as your app grows */}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.quickStart.title', 'Getting Started')}</CardTitle>
          <CardDescription>
            {t('dashboard.quickStart.description', 'This is your app template. Start building!')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t(
              'dashboard.quickStart.body',
              'Replace this dashboard with your app-specific widgets. The Users module, Auth, AI assistant, Settings, and Help are already wired up.',
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
