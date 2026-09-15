import { createServerFn } from '@tanstack/react-start'
import { requireAuthUser } from '@/shared/lib/auth/server'
import type { BillingSummary } from '../model/types'
import { BillingError } from '../model/types'
import { createBillingPortalLink, summarizeBilling } from '../server/checkout'
import { isWebhookConfigured } from '../server/provider'

export interface BillingPanelData {
  summary: BillingSummary
  /**
   * Checkout works without a webhook secret; subscription changes are simply
   * never recorded. Worth saying out loud in the panel rather than discovering
   * when a cancellation does not take effect.
   */
  webhookConfigured: boolean
}

export const getBillingPanelFn = createServerFn({ method: 'GET' }).handler(
  async (): Promise<BillingPanelData> => {
    const user = await requireAuthUser()
    return {
      summary: await summarizeBilling(user.userId),
      webhookConfigured: isWebhookConfigured(),
    }
  },
)

export const createPortalLinkFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<{ url: string } | { error: string }> => {
    const user = await requireAuthUser()
    try {
      return { url: await createBillingPortalLink(user.userId) }
    } catch (error) {
      // The vendor's error never reaches the client; the code does.
      return { error: error instanceof BillingError ? error.code : 'provider_unavailable' }
    }
  },
)
