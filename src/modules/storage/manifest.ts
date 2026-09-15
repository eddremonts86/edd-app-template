import type { AppModuleManifest } from '@/modules/core/types'

/**
 * Object storage.
 *
 * `enabledByDefault: false` — the one module that does this, and the reason is
 * in server/provider.ts: storage refuses to degrade, so a clone that does not
 * need it must not meet that refusal. Enable it with ENABLED_MODULES or by
 * flipping this flag in a derived app.
 */
export const storageModule: AppModuleManifest = {
  id: 'storage',
  title: 'Object storage',
  description: 'Presigned upload and download over the S3 API, defaulting to self-hosted MinIO.',
  tags: ['integration'],
  enabledByDefault: false,
  routes: [],
  capability: {
    // STORAGE_PROVIDER decides which of the other keys matter, so it is the
    // only one that is unconditionally required. isStorageConfigured() checks
    // the rest against the chosen kind.
    requires: ['STORAGE_PROVIDER'],
    optional: [
      'STORAGE_ENDPOINT',
      'STORAGE_BUCKET',
      'STORAGE_ACCESS_KEY_ID',
      'STORAGE_SECRET_ACCESS_KEY',
      'STORAGE_REGION',
      'STORAGE_LOCAL_DIR',
      'STORAGE_LOCAL_ROUTE_PREFIX',
    ],
    unconfiguredKey: 'storage.unconfigured',
  },
}
