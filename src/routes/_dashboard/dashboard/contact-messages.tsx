import { createFileRoute } from '@tanstack/react-router'
import { ContactMessagesPage } from '@/modules/contact-messages'

export const Route = createFileRoute('/_dashboard/dashboard/contact-messages')({
  component: ContactMessagesPage,
})
