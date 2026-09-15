/**
 * Subscription billing — the module's only public entry.
 *
 * No Stripe type crosses this line (docs/architecture/integration-conventions.md
 * §3.4). The client lives in `server/provider.ts` and stays there; callers get
 * URLs, a `BillingSummary`, and `BillingError`.
 */
export { billingModule } from './manifest'
export { billingTranslations } from './i18n'
export { isBillingConfigured, isWebhookConfigured } from './server/provider'
export {
  createBillingPortalLink,
  createCheckoutSession,
  summarizeBilling,
  type CheckoutRequest,
} from './server/checkout'
export { handleBillingWebhook, type WebhookOutcome } from './server/webhook'
export { BillingError, isPaying } from './model/types'
export type { BillingErrorCode, BillingSummary, SubscriptionStatus } from './model/types'
export { billingCustomers, billingEvents, billingSubscriptions } from './model/schema'
export type { BillingCustomerRow, BillingSubscriptionRow } from './model/schema'
export { BillingPanel } from './components/BillingPanel'
export { createPortalLinkFn, getBillingPanelFn } from './api/billing.fn'
export type { BillingPanelData } from './api/billing.fn'
