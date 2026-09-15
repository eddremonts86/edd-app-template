import { createFileRoute } from '@tanstack/react-router'
import { DatabaseAdminPage } from '@/modules/database-admin'

export const Route = createFileRoute('/_dashboard/dashboard/settings/database')({
  head: () => ({ meta: [{ title: 'Database administration · edd App Template' }] }),
  component: DatabaseAdminPage,
})
