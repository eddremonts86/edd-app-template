import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getEnabledModules, resolveCapabilities } from '@/modules'
import { buildModuleResources } from '@/modules/core/module-i18n'

/**
 * The wiring, not the module: manifest → registry → capability map, and
 * i18n/*.json → the `email.*` namespace.
 *
 * Each piece is tested elsewhere; this is the seam where a module that was
 * written correctly can still be invisible because nobody registered it.
 */

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
})

describe('module registration', () => {
  it('email is in the enabled set', () => {
    expect(getEnabledModules().map((module) => module.id)).toContain('email')
  })

  it('reports email unconfigured when the credentials are absent', () => {
    expect(resolveCapabilities().email).toBe(false)
  })

  it('reports email configured when both are set', () => {
    process.env.RESEND_API_KEY = 're_test_key'
    process.env.EMAIL_FROM = 'App <hi@example.com>'
    expect(resolveCapabilities().email).toBe(true)
  })

  it('reports a module with no third-party dependency as configured', () => {
    // users declares no capability, so it can never be "unconfigured".
    expect(resolveCapabilities().users).toBe(true)
  })

  it('leaks only booleans — no key names, no counts', () => {
    const map = resolveCapabilities()
    expect(Object.values(map).every((value) => typeof value === 'boolean')).toBe(true)
    expect(JSON.stringify(map)).not.toContain('RESEND')
  })
})

describe('module translations', () => {
  it('lands under the module id in all three languages', () => {
    for (const language of ['en', 'es', 'dk'] as const) {
      const resources = buildModuleResources(language) as Record<
        string,
        Record<string, unknown> | undefined
      >
      expect(resources.email?.unconfigured, `${language} is missing email.unconfigured`).toBeTypeOf(
        'string',
      )
    }
  })

  it('ships the unconfigured sentence the manifest points at', () => {
    const manifest = getEnabledModules().find((module) => module.id === 'email')
    expect(manifest?.capability?.unconfiguredKey).toBe('email.unconfigured')
  })
})
