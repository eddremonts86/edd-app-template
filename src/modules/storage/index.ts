/**
 * Object storage — the module's only public entry.
 *
 * No AWS SDK type crosses this line. Domain code sees `StorageProvider`,
 * `StorageProviderError` and plain shapes.
 *
 * Pure contract and key validation live in `model/types`; import from there in
 * tests and browser code, since this barrel pulls the SDK in (§2.3).
 */
export { storageModule } from './manifest'
export { storageTranslations } from './i18n'
export {
  isStorageConfigured,
  requireStorage,
  resetStorageForTesting,
  resolveStorage,
  storageKind,
  type StorageProviderKind,
} from './server/provider'
export { S3StorageProvider, type S3StorageConfig } from './server/s3-provider'
export { LocalStorageProvider, type LocalStorageConfig } from './server/local-provider'
export { assertValidKey, StorageProviderError } from './model/types'
export type {
  ScanResult,
  ScanStatus,
  SignedDownloadUrl,
  SignedUploadUrl,
  StorageErrorCode,
  StorageObjectMetadata,
  StorageProvider,
  VirusScanProvider,
} from './model/types'
