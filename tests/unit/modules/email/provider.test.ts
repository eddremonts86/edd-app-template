import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The contract, not the transport: absent / blank / present.
 *
 * These three are the whole reason the conventions document exists
 * (docs/architecture/integration-conventions.md §3), so they are the tests that
 * must not be allowed to rot. Nothing here needs a Resend account — which is
 * itself an argument for the unconfigured path being the default.
 */

async function freshProvider() {
  // The resolver caches its "announced" flag per module instance.
  vi.resetModules()
  return import('@/modules/email/server/provider')
}

const KEYS = ['RESEND_API_KEY', 'EMAIL_FROM'] as const
const saved: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const key of KEYS) {
    saved[key] = process.env[key]
    delete process.env[key]
  }
})

afterEach(() => {
  for (const key of KEYS) {
    if (saved[key] === undefined) delete process.env[key]
    else process.env[key] = saved[key]
  }
  vi.restoreAllMocks()
})

describe('resolveEmail', () => {
  it('returns undefined with no configuration, and does not throw', async () => {
    const { resolveEmail, isEmailConfigured } = await freshProvider()
    expect(resolveEmail()).toBeUndefined()
    expect(isEmailConfigured()).toBe(false)
  })

  it('treats a blank value as absent', async () => {
    process.env.RESEND_API_KEY = '   '
    process.env.EMAIL_FROM = ''
    const { resolveEmail, isEmailConfigured } = await freshProvider()
    expect(resolveEmail()).toBeUndefined()
    expect(isEmailConfigured()).toBe(false)
  })

  it('needs both credentials, not either', async () => {
    process.env.RESEND_API_KEY = 're_test_key'
    const { resolveEmail, isEmailConfigured } = await freshProvider()
    expect(resolveEmail()).toBeUndefined()
    expect(isEmailConfigured()).toBe(false)
  })

  it('resolves when both are set', async () => {
    process.env.RESEND_API_KEY = 're_test_key'
    process.env.EMAIL_FROM = 'App <hi@example.com>'
    const { resolveEmail, isEmailConfigured } = await freshProvider()
    expect(isEmailConfigured()).toBe(true)
    expect(resolveEmail()?.from).toBe('App <hi@example.com>')
  })

  it('never puts key material in the announcement', async () => {
    process.env.RESEND_API_KEY = 're_super_secret_value'

    // Reset first, then spy: the provider and the spy have to end up in the
    // same module graph or the spy watches a logger nobody calls.
    vi.resetModules()
    const { logger } = await import('@/shared/lib/observability')
    const info = vi.spyOn(logger, 'info').mockImplementation(() => {})
    const { resolveEmail } = await import('@/modules/email/server/provider')
    resolveEmail()

    const announced = info.mock.calls.filter(([event]) => event === 'email.unconfigured')
    expect(announced).toHaveLength(1)
    expect(JSON.stringify(announced)).not.toContain('re_super_secret_value')
    expect(announced[0]?.[1]).toEqual({ code: 'no_from_address' })
  })
})

describe('requireEmail', () => {
  it('throws IntegrationUnavailableError naming the module', async () => {
    const { requireEmail } = await freshProvider()
    const { IntegrationUnavailableError } = await import('@/shared/lib/errors/integration')
    expect(() => requireEmail()).toThrow(IntegrationUnavailableError)
    try {
      requireEmail()
    } catch (error) {
      expect((error as InstanceType<typeof IntegrationUnavailableError>).moduleId).toBe('email')
    }
  })
})
