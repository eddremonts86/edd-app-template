import Stripe from 'stripe'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The webhook's four rules (docs/architecture/integration-conventions.md §8.2).
 *
 * Signatures are generated locally with Stripe's own test helper, so none of
 * this needs an account or a network — which is the point: an idempotency guard
 * that is only exercised in production is not a guard.
 */

const CURRENT = 'whsec_current_secret'
const PREVIOUS = 'whsec_previous_secret'

/** The rows `billing_events` has already claimed, per test. */
let claimed: Set<string>
/** What the subscription upsert was called with, if anything. */
let upserted: unknown[]

vi.mock('@/shared/lib/db', () => ({
  getDb: () => ({
    insert: (table: { _: { name?: string } } & Record<string, unknown>) => {
      const name = (table as unknown as { [k: symbol]: unknown; _?: { name?: string } })._?.name
      return {
        values: (row: Record<string, unknown>) => ({
          // billing_events — the idempotency claim
          onConflictDoNothing: () => ({
            returning: async () => {
              const id = String(row.eventId)
              if (claimed.has(id)) return []
              claimed.add(id)
              return [{ eventId: id }]
            },
          }),
          // billing_subscriptions — the upsert
          onConflictDoUpdate: async () => {
            upserted.push({ table: name, row })
          },
        }),
      }
    },
  }),
}))

function signed(payload: object, secret: string) {
  const body = JSON.stringify(payload)
  const header = Stripe.webhooks.generateTestHeaderString({ payload: body, secret })
  return { body, header }
}

function subscriptionEvent(id: string, status = 'active', userId: string | null = 'user_1') {
  return {
    id,
    object: 'event',
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: 'sub_123',
        object: 'subscription',
        status,
        cancel_at_period_end: false,
        metadata: userId ? { userId } : {},
        items: { data: [{ price: { id: 'price_1' }, current_period_end: 1800000000 }] },
      },
    },
  }
}

const saved: Record<string, string | undefined> = {}
const KEYS = ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_WEBHOOK_SECRET_PREVIOUS']

beforeEach(() => {
  claimed = new Set()
  upserted = []
  for (const key of KEYS) saved[key] = process.env[key]
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake'
  process.env.STRIPE_WEBHOOK_SECRET = CURRENT
  delete process.env.STRIPE_WEBHOOK_SECRET_PREVIOUS
  vi.resetModules()
})

afterEach(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) delete process.env[key]
    else process.env[key] = saved[key]
  }
})

describe('handleBillingWebhook', () => {
  it('rejects a request with no signature', async () => {
    const { handleBillingWebhook } = await import('@/modules/billing/server/webhook')
    const outcome = await handleBillingWebhook('{}', null)
    expect(outcome.status).toBe(400)
  })

  it('rejects a body signed with the wrong secret', async () => {
    const { handleBillingWebhook } = await import('@/modules/billing/server/webhook')
    const { body, header } = signed(subscriptionEvent('evt_1'), 'whsec_not_ours')
    const outcome = await handleBillingWebhook(body, header)
    expect(outcome.status).toBe(400)
  })

  it('accepts a body signed with the current secret', async () => {
    const { handleBillingWebhook } = await import('@/modules/billing/server/webhook')
    const { body, header } = signed(subscriptionEvent('evt_2'), CURRENT)
    const outcome = await handleBillingWebhook(body, header)
    expect(outcome.status).toBe(200)
    expect(upserted).toHaveLength(1)
  })

  it('still accepts the previous secret during a rotation', async () => {
    process.env.STRIPE_WEBHOOK_SECRET_PREVIOUS = PREVIOUS
    const { handleBillingWebhook } = await import('@/modules/billing/server/webhook')
    const { body, header } = signed(subscriptionEvent('evt_3'), PREVIOUS)
    const outcome = await handleBillingWebhook(body, header)
    expect(outcome.status).toBe(200)
  })

  it('processes a retried delivery once', async () => {
    const { handleBillingWebhook } = await import('@/modules/billing/server/webhook')
    const { body, header } = signed(subscriptionEvent('evt_retry'), CURRENT)

    const first = await handleBillingWebhook(body, header)
    const second = await handleBillingWebhook(body, header)

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(second.body).toMatchObject({ duplicate: true })
    // The retry must not have touched the subscription a second time.
    expect(upserted).toHaveLength(1)
  })

  it('acknowledges an event type it does not handle without applying it', async () => {
    const { handleBillingWebhook } = await import('@/modules/billing/server/webhook')
    const payload = { ...subscriptionEvent('evt_other'), type: 'invoice.paid' }
    const { body, header } = signed(payload, CURRENT)

    const outcome = await handleBillingWebhook(body, header)
    expect(outcome.status).toBe(202)
    expect(upserted).toHaveLength(0)
  })

  it('does not apply a subscription with no user metadata', async () => {
    const { handleBillingWebhook } = await import('@/modules/billing/server/webhook')
    const { body, header } = signed(subscriptionEvent('evt_nouser', 'active', null), CURRENT)

    const outcome = await handleBillingWebhook(body, header)
    expect(outcome.status).toBe(200)
    expect(upserted).toHaveLength(0)
  })

  it('refuses with 503 when billing is unconfigured', async () => {
    delete process.env.STRIPE_SECRET_KEY
    vi.resetModules()
    const { handleBillingWebhook } = await import('@/modules/billing/server/webhook')
    const outcome = await handleBillingWebhook('{}', 'sig')
    expect(outcome.status).toBe(503)
  })
})
