import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DbAuditEntry } from '@/modules/database-admin/model/audit'

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

async function makeTempDir() {
  const os = await import('node:os')
  const path = await import('node:path')
  const crypto = await import('node:crypto')
  return path.join(os.tmpdir(), `audit-test-${crypto.randomUUID()}`)
}

describe('readAuditStore / appendAuditEntry', () => {
  let restoreMocks: () => void

  beforeEach(async () => {
    const tmpDir = await makeTempDir()
    const path = await import('node:path')
    const dataPaths = await import('@/modules/database-admin/server/data-paths')
    const spyDir = vi.spyOn(dataPaths, 'resolveDbAdminDataDir').mockReturnValue(tmpDir)
    const spyFile = vi
      .spyOn(dataPaths, 'resolveDbAdminDataFilePath')
      .mockImplementation((fileName: string) => path.join(tmpDir, fileName))
    restoreMocks = () => {
      spyDir.mockRestore()
      spyFile.mockRestore()
    }
  })

  afterEach(() => {
    restoreMocks?.()
    vi.restoreAllMocks()
  })

  it('returns empty store when no file exists', async () => {
    const { readAuditStore } = await import('@/modules/database-admin/server/audit-store')
    const store = await readAuditStore()
    expect(store.version).toBe(1)
    expect(store.entries).toHaveLength(0)
  })

  it('appends an entry and persists it', async () => {
    const { appendAuditEntry, readAuditStore } =
      await import('@/modules/database-admin/server/audit-store')
    const entry = await appendAuditEntry({
      actorUserId: 'user_1',
      actorEmail: 'admin@example.com',
      action: 'profile.create',
      profileId: 'p1',
      result: 'ok',
      message: 'Created',
    })

    expect(entry.id).toBeTruthy()
    expect(entry.timestamp).toBeTruthy()
    expect(entry.action).toBe('profile.create')
    expect(entry.result).toBe('ok')

    const store = await readAuditStore()
    expect(store.entries).toHaveLength(1)
    expect(store.entries[0].id).toBe(entry.id)
  })

  it('prepends newer entries (most recent first)', async () => {
    const { appendAuditEntry, readAuditStore } =
      await import('@/modules/database-admin/server/audit-store')
    const first = await appendAuditEntry({
      actorUserId: 'u1',
      actorEmail: null,
      action: 'profile.create',
      profileId: null,
      result: 'ok',
    })
    const second = await appendAuditEntry({
      actorUserId: 'u1',
      actorEmail: null,
      action: 'profile.delete',
      profileId: null,
      result: 'ok',
    })

    const store = await readAuditStore()
    expect(store.entries[0].id).toBe(second.id)
    expect(store.entries[1].id).toBe(first.id)
  })

  it('accepts an explicit id and timestamp', async () => {
    const { appendAuditEntry } = await import('@/modules/database-admin/server/audit-store')
    const known: Partial<DbAuditEntry> = {
      id: 'fixed-id-123',
      timestamp: '2024-01-01T00:00:00.000Z',
    }
    const entry = await appendAuditEntry({
      ...known,
      actorUserId: 'u2',
      actorEmail: null,
      action: 'connection.test',
      profileId: null,
      result: 'error',
    })
    expect(entry.id).toBe('fixed-id-123')
    expect(entry.timestamp).toBe('2024-01-01T00:00:00.000Z')
  })
})
