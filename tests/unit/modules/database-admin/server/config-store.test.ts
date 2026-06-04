import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetCryptoForTests } from '@/modules/database-admin/server/crypto'

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

const withSecret = (value: string) => {
  const prev = process.env.DB_CONFIG_SECRET
  process.env.DB_CONFIG_SECRET = value
  return () => {
    if (typeof prev === 'undefined') delete process.env.DB_CONFIG_SECRET
    else process.env.DB_CONFIG_SECRET = prev
  }
}

// ------------------------------------------------------------------
// composeConnectionUrl
// ------------------------------------------------------------------

describe('composeConnectionUrl', () => {
  let restoreSecret: () => void

  beforeEach(() => {
    restoreSecret = withSecret('test-secret-that-is-long-enough!!')
    __resetCryptoForTests()
  })

  afterEach(() => {
    restoreSecret()
    __resetCryptoForTests()
    vi.restoreAllMocks()
  })

  it('returns the decrypted connectionUrl when present', async () => {
    const { encryptProfileSensitiveFields, composeConnectionUrl } =
      await import('@/modules/database-admin/server/config-store')
    const profile = encryptProfileSensitiveFields({
      id: '1',
      name: 'prod',
      label: 'Production',
      driver: 'postgres',
      connectionUrl: 'postgres://user:pass@host:5432/db',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    expect(composeConnectionUrl(profile)).toBe('postgres://user:pass@host:5432/db')
  })

  it('builds URL from discrete fields when no connectionUrl', async () => {
    const { composeConnectionUrl } = await import('@/modules/database-admin/server/config-store')
    const profile = {
      id: '2',
      name: 'local',
      label: 'Local',
      driver: 'postgres' as const,
      host: 'localhost',
      port: 5432,
      database: 'mydb',
      user: 'admin',
      password: 'secret',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const url = composeConnectionUrl(profile)
    expect(url).toContain('localhost')
    expect(url).toContain('5432')
    expect(url).toContain('mydb')
    expect(url).toContain('admin')
  })

  it('omits auth segment when user is not set', async () => {
    const { composeConnectionUrl } = await import('@/modules/database-admin/server/config-store')
    const profile = {
      id: '3',
      name: 'noauth',
      label: 'No Auth',
      driver: 'postgres' as const,
      host: 'db.example.com',
      database: 'public',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const url = composeConnectionUrl(profile)
    expect(url).toBe('postgres://db.example.com/public')
  })

  it('appends sslmode param when ssl is set', async () => {
    const { composeConnectionUrl } = await import('@/modules/database-admin/server/config-store')
    const profile = {
      id: '4',
      name: 'secure',
      label: 'Secure',
      driver: 'postgres' as const,
      host: 'db.example.com',
      database: 'prod',
      ssl: 'require' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const url = composeConnectionUrl(profile)
    expect(url).toContain('sslmode=require')
  })
})

// ------------------------------------------------------------------
// encryptProfileSensitiveFields / round-trip
// ------------------------------------------------------------------

describe('encryptProfileSensitiveFields', () => {
  let restoreSecret: () => void

  beforeEach(() => {
    restoreSecret = withSecret('test-secret-that-is-long-enough!!')
    __resetCryptoForTests()
  })

  afterEach(() => {
    restoreSecret()
    __resetCryptoForTests()
  })

  it('encrypts password and connectionUrl', async () => {
    const { encryptProfileSensitiveFields } =
      await import('@/modules/database-admin/server/config-store')
    const profile = {
      id: '1',
      name: 'p1',
      label: 'P1',
      driver: 'postgres' as const,
      password: 'hunter2',
      connectionUrl: 'postgres://user:pass@host/db',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const encrypted = encryptProfileSensitiveFields(profile)
    expect(encrypted.password).toMatch(/^enc:v1:/)
    expect(encrypted.connectionUrl).toMatch(/^enc:v1:/)
  })

  it('leaves other fields unchanged', async () => {
    const { encryptProfileSensitiveFields } =
      await import('@/modules/database-admin/server/config-store')
    const profile = {
      id: 'abc',
      name: 'p2',
      label: 'P2',
      driver: 'postgres' as const,
      host: 'localhost',
      database: 'mydb',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const encrypted = encryptProfileSensitiveFields(profile)
    expect(encrypted.host).toBe('localhost')
    expect(encrypted.database).toBe('mydb')
  })
})

// ------------------------------------------------------------------
// readDbConfigStore / writeDbConfigStore (tmp dir)
// ------------------------------------------------------------------

describe('readDbConfigStore / writeDbConfigStore', () => {
  let restoreSecret: () => void

  beforeEach(async () => {
    restoreSecret = withSecret('test-secret-that-is-long-enough!!')
    __resetCryptoForTests()
    // Point the data dir to a temp location so we don't write to the src tree
    const os = await import('node:os')
    const path = await import('node:path')
    const crypto = await import('node:crypto')
    const tmpDir = path.join(os.tmpdir(), `db-admin-test-${crypto.randomUUID()}`)
    vi.spyOn(
      await import('@/modules/database-admin/server/data-paths'),
      'resolveDbAdminDataDir',
    ).mockReturnValue(tmpDir)
    vi.spyOn(
      await import('@/modules/database-admin/server/data-paths'),
      'resolveDbAdminDataFilePath',
    ).mockImplementation((fileName: string) => path.join(tmpDir, fileName))
  })

  afterEach(() => {
    restoreSecret()
    __resetCryptoForTests()
    vi.restoreAllMocks()
  })

  it('returns empty store when file does not exist', async () => {
    const { readDbConfigStore } = await import('@/modules/database-admin/server/config-store')
    const store = await readDbConfigStore()
    expect(store.version).toBe(1)
    expect(store.profiles).toHaveLength(0)
    expect(store.activeProfileId).toBeNull()
  })

  it('writes and reads back a store', async () => {
    const { readDbConfigStore, writeDbConfigStore } =
      await import('@/modules/database-admin/server/config-store')
    const newStore = {
      version: 1 as const,
      activeProfileId: null,
      profiles: [
        {
          id: 'x1',
          name: 'staging',
          label: 'Staging',
          driver: 'postgres' as const,
          host: 'staging.db',
          database: 'app',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastTestedAt: null,
          lastTestResult: null,
          lastTestMessage: null,
        },
      ],
    }
    await writeDbConfigStore(newStore)
    const read = await readDbConfigStore()
    expect(read.profiles).toHaveLength(1)
    expect(read.profiles[0].name).toBe('staging')
  })
})
