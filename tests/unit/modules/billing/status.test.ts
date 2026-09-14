import { describe, expect, it } from 'vitest'
// From model/, not the barrel: the barrel re-exports server functions that
// reach for the database at import time, and this is pure domain logic
// (docs/architecture/integration-conventions.md §2.3).
import { isPaying } from '@/modules/billing/model/types'

/**
 * Which statuses count as paying is a decision, not a default, so it gets a test
 * that states the decision rather than restating the implementation.
 */
describe('isPaying', () => {
  it('counts a trial — it is a subscription the provider will bill', () => {
    expect(isPaying('trialing')).toBe(true)
  })

  it('counts active', () => {
    expect(isPaying('active')).toBe(true)
  })

  it('does not count past_due — the retry has not succeeded yet', () => {
    expect(isPaying('past_due')).toBe(false)
  })

  it.each(['canceled', 'incomplete', 'incomplete_expired', 'unpaid', 'paused'])(
    'does not count %s',
    (status) => {
      expect(isPaying(status)).toBe(false)
    },
  )

  it('fails closed on a status Stripe has not invented yet', () => {
    expect(isPaying('some_future_status')).toBe(false)
  })

  it('fails closed on null and undefined', () => {
    expect(isPaying(null)).toBe(false)
    expect(isPaying(undefined)).toBe(false)
  })
})
