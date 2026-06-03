import { createFileRoute } from '@tanstack/react-router'
import { DevToolsPage } from '@/modules/settings'

export const Route = createFileRoute('/_dashboard/dashboard/settings/dev_tools')({
  component: DevToolsPage,
})
