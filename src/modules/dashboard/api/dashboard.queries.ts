import { useTQuery } from '@/shared/lib/query'
import { getDashboardStatsFn } from './dashboard.fn'

const DASHBOARD_REFRESH_INTERVAL = 30 * 1000

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
}

export const useDashboardStats = () => {
  return useTQuery(dashboardKeys.stats(), () => getDashboardStatsFn({ data: undefined }), {
    cache: 'realtime',
    refetchInterval: DASHBOARD_REFRESH_INTERVAL,
    refetchOnWindowFocus: true,
  })
}
