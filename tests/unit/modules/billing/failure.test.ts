import Stripe from 'stripe'
import { describe, expect, it } from 'vitest'
import { classifyStripeFailure } from '@/modules/billing/server/provider'

/**
 * Which side failed.
 *
 * Every Stripe failure used to become `provider_unavailable`, so a live run
 * reported a one-time price asked for in subscription mode — our parameters,
 * our bug — as the provider being down. Whoever is on call opens Stripe's
 * status page and finds nothing wrong, because nothing is.
 *
 * Errors here are built with Stripe's own factory, the same one its HTTP layer
 * uses, so these are the objects the catch block really sees.
 */

/** Exactly what Stripe's transport hands to the error factory. */
function stripeError(raw: {
  statusCode?: number
  code?: string
  type?: string
  message?: string
}): unknown {
  return Stripe.errors.generateV1Error({ message: 'x', ...raw } as never)
}

describe('classifyStripeFailure', () => {
  describe('provider_rejected — a verdict arrived and we do not like it', () => {
    it('classifies the one-time-price refusal that started this', () => {
      // The live failure: `mode: subscription` with a price that is not recurring.
      const failure = classifyStripeFailure(
        stripeError({
          statusCode: 400,
          code: 'parameter_invalid_string',
          type: 'invalid_request_error',
        }),
      )
      expect(failure.code).toBe('provider_rejected')
    })

    it.each([
      ['a price id that does not exist', 404, 'resource_missing'],
      ['a key that is not valid', 401, 'api_key_expired'],
      ['a key without the permission', 403, undefined],
    ])('classifies %s', (_name, statusCode, code) => {
      expect(classifyStripeFailure(stripeError({ statusCode, code })).code).toBe(
        'provider_rejected',
      )
    })
  })

  describe('provider_unavailable — no verdict arrived', () => {
    it.each([
      ['a rate limit', 429, undefined],
      ['a server error', 500, undefined],
      ['a gateway error', 503, undefined],
    ])('classifies %s', (_name, statusCode, code) => {
      expect(classifyStripeFailure(stripeError({ statusCode, code })).code).toBe(
        'provider_unavailable',
      )
    })

    it('classifies a rate limit that arrives as HTTP 400', () => {
      // Stripe sends this one as 400 with `code: rate_limit`, so a hand-rolled
      // `status >= 400 means rejected` check calls it our fault and we go
      // looking for a bad parameter that does not exist. Delegating to Stripe's
      // own subclasses is the whole reason this case passes.
      const failure = classifyStripeFailure(stripeError({ statusCode: 400, code: 'rate_limit' }))
      expect(failure.code).toBe('provider_unavailable')
      expect(failure.detail.type).toBe('StripeRateLimitError')
    })

    it('classifies a connection failure, which carries no status at all', () => {
      const failure = classifyStripeFailure(
        new Stripe.errors.StripeConnectionError({ message: 'socket hang up' }),
      )
      expect(failure.code).toBe('provider_unavailable')
    })

    it('does not blame Stripe for a throw that is not Stripe at all', () => {
      const failure = classifyStripeFailure(new TypeError('cannot read properties of undefined'))
      expect(failure.code).toBe('provider_unavailable')
      expect(failure.detail.type).toBe('TypeError')
    })

    it('survives a thrown non-error', () => {
      expect(classifyStripeFailure('nope').code).toBe('provider_unavailable')
      expect(classifyStripeFailure(undefined).detail).toEqual({ type: 'unknown', reason: 'none' })
    })
  })

  describe('what reaches the log', () => {
    it('names the subclass, which Stripe keeps on `type` and not on `name`', () => {
      // `name` stays 'Error' on every Stripe subclass. Reading it logged the
      // same word for a rate limit and for a bad price id.
      const error = stripeError({ statusCode: 404, code: 'resource_missing' })
      expect((error as Error).name).toBe('Error')
      expect(classifyStripeFailure(error).detail).toEqual({
        type: 'StripeInvalidRequestError',
        reason: 'resource_missing',
      })
    })

    it('carries no message, and so nothing we sent', () => {
      const failure = classifyStripeFailure(
        stripeError({
          statusCode: 400,
          code: 'parameter_invalid_string',
          message: 'No such price: price_1UBVis... for customer cus_TfQ9',
        }),
      )
      expect(Object.keys(failure.detail).sort()).toEqual(['reason', 'type'])
      expect(JSON.stringify(failure.detail)).not.toContain('cus_')
    })
  })
})
