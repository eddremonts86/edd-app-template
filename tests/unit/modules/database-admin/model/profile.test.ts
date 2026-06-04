import { describe, expect, it } from 'vitest'
import {
  dbProfileInputSchema,
  dbProfileSchema,
  redactProfile,
  redactUrl,
} from '@/modules/database-admin/model/profile'

describe('dbProfileSchema', () => {
  const base = {
    id: 'abc-123',
    name: 'staging',
    label: 'Staging DB',
    driver: 'postgres' as const,
    host: 'localhost',
    database: 'app',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastTestedAt: null,
    lastTestResult: null,
    lastTestMessage: null,
  }

  it('accepts a valid profile', () => {
    expect(dbProfileSchema.safeParse(base).success).toBe(true)
  })

  it('rejects an empty name', () => {
    const r = dbProfileSchema.safeParse({ ...base, name: '' })
    expect(r.success).toBe(false)
  })

  it('rejects name with invalid chars (spaces)', () => {
    const r = dbProfileSchema.safeParse({ ...base, name: 'my profile' })
    expect(r.success).toBe(false)
  })

  it('accepts name with dash and underscore', () => {
    expect(dbProfileSchema.safeParse({ ...base, name: 'my-db_prod' }).success).toBe(true)
  })

  it('rejects port > 65535', () => {
    const r = dbProfileSchema.safeParse({ ...base, port: 99999 })
    expect(r.success).toBe(false)
  })

  it('accepts optional ssl modes', () => {
    for (const ssl of ['disable', 'require', 'verify-full'] as const) {
      expect(dbProfileSchema.safeParse({ ...base, ssl }).success).toBe(true)
    }
  })

  it('rejects unknown ssl mode', () => {
    const r = dbProfileSchema.safeParse({ ...base, ssl: 'no-ssl' })
    expect(r.success).toBe(false)
  })
})

describe('dbProfileInputSchema', () => {
  it('accepts connectionUrl alone', () => {
    const r = dbProfileInputSchema.safeParse({
      name: 'prod',
      label: 'Prod',
      connectionUrl: 'postgres://localhost/mydb',
    })
    expect(r.success).toBe(true)
  })

  it('accepts host + database combination', () => {
    const r = dbProfileInputSchema.safeParse({
      name: 'local',
      label: 'Local',
      host: 'localhost',
      database: 'mydb',
    })
    expect(r.success).toBe(true)
  })

  it('rejects when neither connectionUrl nor (host+database) are provided', () => {
    const r = dbProfileInputSchema.safeParse({
      name: 'broken',
      label: 'Broken',
      host: 'localhost',
      // database intentionally missing
    })
    expect(r.success).toBe(false)
  })

  it('defaults driver to postgres when not provided', () => {
    const r = dbProfileInputSchema.safeParse({
      name: 'p1',
      label: 'P1',
      connectionUrl: 'postgres://localhost/db',
    })
    expect(r.success && r.data.driver).toBe('postgres')
  })
})

describe('redactProfile', () => {
  it('replaces password with bullets', () => {
    const result = redactProfile({
      id: '1',
      name: 'p',
      label: 'L',
      driver: 'postgres',
      password: 'hunter2',
      createdAt: '',
      updatedAt: '',
    })
    expect(result.password).toBe('••••••••')
  })

  it('redacts connectionUrl password', () => {
    const result = redactProfile({
      id: '1',
      name: 'p',
      label: 'L',
      driver: 'postgres',
      connectionUrl: 'postgres://user:secret@host:5432/db',
      createdAt: '',
      updatedAt: '',
    })
    expect(result.connectionUrl).not.toContain('secret')
    // URL class percent-encodes bullet chars, so check the password is gone
    expect(result.connectionUrl).not.toBe('postgres://user:secret@host:5432/db')
  })

  it('keeps other fields intact', () => {
    const result = redactProfile({
      id: 'id1',
      name: 'staging',
      label: 'Staging',
      driver: 'postgres',
      host: 'staging.example.com',
      password: 'x',
      createdAt: '',
      updatedAt: '',
    })
    expect(result.host).toBe('staging.example.com')
    expect(result.id).toBe('id1')
  })

  it('sets password to undefined when not present', () => {
    const result = redactProfile({
      id: '1',
      name: 'p',
      label: 'L',
      driver: 'postgres',
      createdAt: '',
      updatedAt: '',
    } as import('@/modules/database-admin/model/profile').DbProfile)
    expect(result.password).toBeUndefined()
  })
})

describe('redactUrl', () => {
  it('redacts password from a valid URL', () => {
    expect(redactUrl('postgres://user:mysecret@host:5432/db')).not.toContain('mysecret')
  })

  it('returns bullet placeholder for unparseable URL', () => {
    expect(redactUrl('not-a-url')).toBe('••••')
  })
})
