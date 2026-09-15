import { createFileRoute } from '@tanstack/react-router'
import { SystemSettings } from '@/modules/settings'

export const Route = createFileRoute('/_dashboard/dashboard/settings/system')({
  head: () => ({ meta: [{ title: 'Language & theme · edd App Template' }] }),
  component: SystemSettings,
})
