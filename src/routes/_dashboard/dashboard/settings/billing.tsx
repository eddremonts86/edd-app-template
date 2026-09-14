import { createFileRoute } from '@tanstack/react-router'
import { BillingPanel } from '@/modules/billing/components/BillingPanel'

export const Route = createFileRoute('/_dashboard/dashboard/settings/billing')({
  head: () => ({ meta: [{ title: 'Billing · edd App Template' }] }),
  component: BillingPanel,
})
