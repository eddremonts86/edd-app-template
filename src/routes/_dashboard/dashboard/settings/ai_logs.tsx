import { createFileRoute } from '@tanstack/react-router'
import { AiLogsPage } from '@/modules/settings'

export const Route = createFileRoute('/_dashboard/dashboard/settings/ai_logs')({
  head: () => ({ meta: [{ title: 'AI logs · edd App Template' }] }),
  component: AiLogsPage,
})
