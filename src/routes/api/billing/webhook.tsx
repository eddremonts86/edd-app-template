import { createFileRoute } from '@tanstack/react-router'
import { handleBillingWebhook } from '@/modules/billing'

/**
 * Stripe's webhook endpoint.
 *
 * The body is read as **text**, not JSON: the signature is computed over the
 * exact bytes Stripe sent, and any parse-then-restringify in between changes
 * them and fails verification for reasons that look like a wrong secret.
 */
export const Route = createFileRoute('/api/billing/webhook')({
  component: () => null,
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const rawBody = await request.text()
        const signature = request.headers.get('stripe-signature')
        const outcome = await handleBillingWebhook(rawBody, signature)

        return new Response(JSON.stringify(outcome.body), {
          status: outcome.status,
          headers: { 'Content-Type': 'application/json' },
        })
      },
    },
  },
})
