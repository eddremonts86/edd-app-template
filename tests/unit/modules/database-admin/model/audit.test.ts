import { describe, expect, it } from 'vitest'
import {
  MAX_AUDIT_ENTRIES,
  dbAuditActionSchema,
  dbAuditEntrySchema,
  dbAuditStoreSchema,
  EMPTY_DB_AUDIT_STORE,
} from '@/modules/database-admin/model/audit'

describe('dbAuditActionSchema', () => {
  const validActions = [
    'profile.create',
    'profile.update',
    'profile.delete',
    'profile.activate',
    'profile.deactivate',
    'connection.test',
    'migration.dryrun',
    'migration.apply',
  ] as const

  for (const action of validActions) {
    it(`accepts "${action}"`, () => {
      expect(dbAuditActionSchema.safeParse(action).success).toBe(true)
    })
  }

  it('rejects unknown actions', () => {
    expect(dbAuditActionSchema.safeParse('profile.purge').success).toBe(false)
    expect(dbAuditActionSchema.safeParse('').success).toBe(false)
  })
})

describe('dbAuditEntrySchema', () => {
  const base = {
    id: 'e1',
    timestamp: '2024-01-01T00:00:00.000Z',
    actorUserId: 'u1',
    actorEmail: 'a@example.com',
    action: 'profile.create',
    result: 'ok',
  }

  it('accepts a minimal valid entry', () => {
    expect(dbAuditEntrySchema.safeParse(base).success).toBe(true)
  })

  it('accepts null actor fields', () => {
    const r = dbAuditEntrySchema.safeParse({
      ...base,
      actorUserId: null,
      actorEmail: null,
    })
    expect(r.success).toBe(true)
  })

  it('accepts an entry with diff', () => {
    const r = dbAuditEntrySchema.safeParse({
      ...base,
      diff: { before: { password: '••••••••' }, after: { password: '••••••••' } },
    })
    expect(r.success).toBe(true)
  })

  it('rejects entry with invalid action', () => {
    expect(dbAuditEntrySchema.safeParse({ ...base, action: 'login' }).success).toBe(false)
  })

  it('rejects entry with invalid result', () => {
    expect(dbAuditEntrySchema.safeParse({ ...base, result: 'pending' }).success).toBe(false)
  })
})

describe('dbAuditStoreSchema', () => {
  it('accepts an empty store', () => {
    const r = dbAuditStoreSchema.safeParse(EMPTY_DB_AUDIT_STORE)
    expect(r.success).toBe(true)
  })

  it('rejects wrong version', () => {
    expect(dbAuditStoreSchema.safeParse({ version: 2, entries: [] }).success).toBe(false)
  })
})

describe('MAX_AUDIT_ENTRIES', () => {
  it('is a positive number', () => {
    expect(MAX_AUDIT_ENTRIES).toBeGreaterThan(0)
  })
})
