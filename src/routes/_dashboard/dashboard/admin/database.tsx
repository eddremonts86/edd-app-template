import { createFileRoute } from '@tanstack/react-router'
import { DatabaseAdminPage } from '@/modules/database-admin'

export const Route = createFileRoute('/_dashboard/dashboard/admin/database')({
  component: DatabaseAdminPage,
})
