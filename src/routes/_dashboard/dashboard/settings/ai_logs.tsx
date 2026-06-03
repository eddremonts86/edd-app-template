import { createFileRoute } from '@tanstack/react-router'
import { AiLogsPage } from '@/modules/settings'

export const Route = createFileRoute('/_dashboard/dashboard/settings/ai_logs')({
  component: AiLogsPage,
})
