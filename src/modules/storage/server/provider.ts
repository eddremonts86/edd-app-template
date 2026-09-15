import { isSet } from '@/modules/core/capability'
import { IntegrationUnavailableError } from '@/shared/lib/errors/integration'
import { logger } from '@/shared/lib/observability'
import { StorageProviderError, type StorageProvider } from '../model/types'
import { LocalStorageProvider } from './local-provider'
import { S3StorageProvider } from './s3-provider'

/**
 * Resolving object storage, and the one place this template deliberately breaks
 * its own default.
 *
 * Every other integration resolves to `undefined` and lets the caller degrade.
 * Storage does not (docs/architecture/integration-conventions.md §9.3). The
 * reasoning is builderhunt's: a fallback would let the upload path appear to
 * work while the files went nowhere, and the first sign of trouble would be a
 * download returning nothing, months later. There is no honest degraded mode
 * for "we accepted your file".
 *
 * So the module ships `enabledByDefault: false`. A clone that does not need
 * storage never meets this; one that enables it must configure it.
 */

export type StorageProviderKind = 'local' | 's3'

const REQUIRED_S3_KEYS = [
  'STORAGE_ENDPOINT',
  'STORAGE_BUCKET',
  'STORAGE_ACCESS_KEY_ID',
  'STORAGE_SECRET_ACCESS_KEY',
] as const

let cached: StorageProvider | undefined
let announced = false

/** Drops the memo so a test can change configuration between cases. */
export function resetStorageForTesting(): void {
  cached = undefined
  announced = false
}

/**
 * Which provider, from `STORAGE_PROVIDER`. Unset is unconfigured — **never a
 * silent default to local**. Local disk in a container is ephemeral, so
 * defaulting to it would reintroduce exactly the failure this module refuses.
 */
export function storageKind(): StorageProviderKind | undefined {
  const value = process.env.STORAGE_PROVIDER?.trim().toLowerCase()
  return value === 'local' || value === 's3' ? value : undefined
}

export function isStorageConfigured(): boolean {
  const kind = storageKind()
  if (kind === 'local') return isSet(process.env.STORAGE_LOCAL_DIR)
  if (kind === 's3') return REQUIRED_S3_KEYS.every((key) => isSet(process.env[key]))
  return false
}

/**
 * The configured provider.
 *
 * @throws IntegrationUnavailableError when storage is not configured
 * @throws StorageProviderError when the configuration is contradictory
 */
export function requireStorage(): StorageProvider {
  if (cached) return cached

  const kind = storageKind()

  if (!kind) {
    announceOnce('no_provider')
    throw new IntegrationUnavailableError(
      'storage',
      'Object storage is not configured. Set STORAGE_PROVIDER to "s3" or "local".',
    )
  }

  if (kind === 'local') {
    // A container's disk does not survive a deploy. Refusing here is the whole
    // point of the module: an upload that works in staging and silently loses
    // files in production is the failure mode being designed out.
    if (process.env.NODE_ENV === 'production') {
      throw new StorageProviderError(
        'STORAGE_PROVIDER=local is refused in production — a container disk is ephemeral',
        'unconfigured',
      )
    }
    const directory = process.env.STORAGE_LOCAL_DIR
    if (!isSet(directory)) {
      announceOnce('no_local_dir')
      throw new IntegrationUnavailableError(
        'storage',
        'STORAGE_PROVIDER=local needs STORAGE_LOCAL_DIR.',
      )
    }
    cached = new LocalStorageProvider({
      directory: directory!,
      routePrefix: process.env.STORAGE_LOCAL_ROUTE_PREFIX ?? '/api/storage/local',
    })
    logger.info('storage.resolved', { kind: 'local' })
    return cached
  }

  const missing = REQUIRED_S3_KEYS.filter((key) => !isSet(process.env[key]))
  if (missing.length > 0) {
    announceOnce('incomplete_s3_config')
    throw new IntegrationUnavailableError(
      'storage',
      `Object storage is incomplete. Missing: ${missing.join(', ')}.`,
    )
  }

  cached = new S3StorageProvider({
    endpoint: process.env.STORAGE_ENDPOINT!,
    bucket: process.env.STORAGE_BUCKET!,
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
    region: process.env.STORAGE_REGION,
  })
  logger.info('storage.resolved', { kind: 's3' })
  return cached
}

/**
 * For code that wants to branch rather than fail — a settings page saying
 * storage is off, say. Callers that actually move bytes use `requireStorage`.
 */
export function resolveStorage(): StorageProvider | undefined {
  try {
    return requireStorage()
  } catch {
    return undefined
  }
}

function announceOnce(code: string): void {
  if (announced) return
  announced = true
  // Which piece is missing, never a value.
  logger.info('storage.unconfigured', { code })
}
