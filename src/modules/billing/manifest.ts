import { IconCreditCard } from '@tabler/icons-react'
import type { AppModuleManifest } from '@/modules/core/types'

/**
 * Subscription billing.
 *
 * Enabled by default so a clone sees the surface and the sentence explaining it
 * is not configured — a hidden billing page in production looks identical to a
 * broken deploy, and the operator finds out from a customer.
 */
export const billingModule: AppModuleManifest = {
  id: 'billing',
  title: 'Billing',
  description: 'Subscriptions through Stripe — hosted checkout, hosted portal, webhooks.',
  tags: ['integration'],
  routes: [
    { path: '/dashboard/settings/billing', kind: 'page' },
    { path: '/api/billing/webhook', kind: 'api' },
  ],
  navigation: [
    {
      id: 'billing',
      title: 'Billing',
      titleKey: 'billing.nav.title',
      kind: 'settings',
      order: 60,
      items: [
        {
          id: 'billing-settings',
          // The group is already called Billing; repeating it in the only
          // item reads as a stutter, the way Branding does not repeat itself.
          titleKey: 'billing.nav.subscription',
          fallbackTitle: 'Subscription',
          icon: IconCreditCard,
          to: '/dashboard/settings/billing',
        },
      ],
    },
  ],
  capability: {
    requires: ['STRIPE_SECRET_KEY'],
    // Webhooks are separately configured and separately absent: checkout works
    // without them, it just never hears back.
    optional: ['STRIPE_WEBHOOK_SECRET', 'STRIPE_WEBHOOK_SECRET_PREVIOUS'],
    unconfiguredKey: 'billing.unconfigured',
  },
}
