import { createFileRoute } from '@tanstack/react-router'
import { DashboardPage } from '@/modules/dashboard'

export const Route = createFileRoute('/_dashboard/dashboard/')({
  head: () => ({ meta: [{ title: 'Dashboard · edd App Template' }] }),
  component: DashboardPage,
})
