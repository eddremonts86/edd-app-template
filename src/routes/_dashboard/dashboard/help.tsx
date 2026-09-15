import { createFileRoute } from '@tanstack/react-router'
import { HelpChatPage } from '@/modules/ai'

export const Route = createFileRoute('/_dashboard/dashboard/help')({
  head: () => ({ meta: [{ title: 'Help · edd App Template' }] }),
  component: HelpChatPage,
})
