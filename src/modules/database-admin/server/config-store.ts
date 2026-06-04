import fs from 'node:fs'
import fsp from 'node:fs/promises'
import {
  EMPTY_DB_CONFIG_STORE,
  dbConfigStoreSchema,
  type DbConfigStore,
  type DbProfile,
} from '../model/profile'
import { decryptString, encryptString } from './crypto'
import { resolveDbAdminDataDir, resolveDbAdminDataFilePath } from './data-paths'

const STORE_FILE = 'db-config-store.json'

function getStorePath(): string {
  return resolveDbAdminDataFilePath(STORE_FILE)
}

function parseStore(raw: string): DbConfigStore {
  const trimmed = raw.trim()
  if (!trimmed) return EMPTY_DB_CONFIG_STORE
  const parsed = JSON.parse(trimmed)
  const result = dbConfigStoreSchema.safeParse(parsed)
  return result.success ? result.data : EMPTY_DB_CONFIG_STORE
}

/**
 * Async reader — returns the raw store (passwords still encrypted on disk).
 */
export async function readDbConfigStore(): Promise<DbConfigStore> {
  try {
    const content = await fsp.readFile(getStorePath(), 'utf-8')
    return parseStore(content)
  } catch {
    return EMPTY_DB_CONFIG_STORE
  }
}

/**
 * Synchronous reader used by the DB connection resolver at module load.
 * Falls back to the empty store on any failure.
 */
export function readDbConfigStoreSync(): DbConfigStore {
  try {
    const content = fs.readFileSync(getStorePath(), 'utf-8')
    return parseStore(content)
  } catch {
    return EMPTY_DB_CONFIG_STORE
  }
}

export async function writeDbConfigStore(store: DbConfigStore): Promise<DbConfigStore> {
  const dir = resolveDbAdminDataDir()
  const targetPath = getStorePath()
  const uniqueSuffix = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const tempPath = `${targetPath}.${uniqueSuffix}.tmp`

  await fsp.mkdir(dir, { recursive: true })
  await fsp.writeFile(tempPath, JSON.stringify(store, null, 2))
  await fsp.rename(tempPath, targetPath)
  return store
}

// ----------------------------------------------------------------------------
// Profile helpers (encrypt/decrypt sensitive fields)
// ----------------------------------------------------------------------------

const SENSITIVE_FIELDS = ['password', 'connectionUrl'] as const

export function encryptProfileSensitiveFields(profile: DbProfile): DbProfile {
  const next = { ...profile }
  for (const field of SENSITIVE_FIELDS) {
    const value = next[field]
    if (typeof value === 'string' && value.length > 0) {
      next[field] = encryptString(value)
    }
  }
  return next
}

export function decryptProfileSensitiveFields(profile: DbProfile): DbProfile {
  const next = { ...profile }
  for (const field of SENSITIVE_FIELDS) {
    const value = next[field]
    if (typeof value === 'string' && value.length > 0) {
      next[field] = decryptString(value)
    }
  }
  return next
}

/**
 * Compose the runtime connection URL from a (decrypted) profile.
 * Prefers an explicit connectionUrl; otherwise builds one from discrete fields.
 */
export function composeConnectionUrl(profile: DbProfile): string {
  const decrypted = decryptProfileSensitiveFields(profile)
  if (decrypted.connectionUrl) return decrypted.connectionUrl

  const user = encodeURIComponent(decrypted.user ?? '')
  const password = decrypted.password ? `:${encodeURIComponent(decrypted.password)}` : ''
  const auth = decrypted.user ? `${user}${password}@` : ''
  const port = decrypted.port ? `:${decrypted.port}` : ''
  const sslParam = decrypted.ssl ? `?sslmode=${decrypted.ssl}` : ''

  return `postgres://${auth}${decrypted.host ?? 'localhost'}${port}/${decrypted.database ?? ''}${sslParam}`
}

/**
 * Resolves the active profile (with secrets decrypted) or null when the
 * store has no active override.
 */
export function getActiveProfileSync(): DbProfile | null {
  const store = readDbConfigStoreSync()
  if (!store.activeProfileId) return null
  const found = store.profiles.find((p) => p.id === store.activeProfileId)
  if (!found) return null
  try {
    return decryptProfileSensitiveFields(found)
  } catch {
    return null
  }
}
