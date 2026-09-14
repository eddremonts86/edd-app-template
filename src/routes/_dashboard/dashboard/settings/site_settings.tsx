import { createFileRoute } from '@tanstack/react-router'
import { SiteSettingsPage } from '@/modules/settings'

export const Route = createFileRoute('/_dashboard/dashboard/settings/site_settings')({
  head: () => ({ meta: [{ title: 'Site settings · edd App Template' }] }),
  component: SiteSettingsPage,
})
