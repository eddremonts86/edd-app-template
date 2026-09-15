import { createReadStream } from 'node:fs'
import { mkdir, rename, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, join, resolve, sep } from 'node:path'
import {
  assertValidKey,
  StorageProviderError,
  type SignedDownloadUrl,
  type SignedUploadUrl,
  type StorageObjectMetadata,
  type StorageProvider,
} from '../model/types'

/**
 * Object storage on the local disk, for development.
 *
 * It exists so an upload path can be written and exercised without credentials
 * or a running MinIO. It is **opt-in** (`STORAGE_PROVIDER=local`) and refuses to
 * run in production: a container's disk is ephemeral, so this would be exactly
 * the failure the S3 provider's fail-loud stance guards against — uploads that
 * appear to work while the files quietly go away on the next deploy.
 *
 * There are no presigned URLs on a filesystem, so the "signed" URLs point at an
 * app route. That is the one place the bytes do transit this server, which is
 * acceptable for development and is why this provider is not for anything else.
 */

export interface LocalStorageConfig {
  /** Directory the objects live under. Created on demand. */
  directory: string
  /** Prefix the returned URLs are built from, e.g. `/api/storage/local`. */
  routePrefix: string
}

export class LocalStorageProvider implements StorageProvider {
  private readonly root: string
  private readonly routePrefix: string

  constructor(config: LocalStorageConfig) {
    this.root = resolve(config.directory)
    this.routePrefix = config.routePrefix.replace(/\/+$/, '')
  }

  /**
   * `assertValidKey` already refuses traversal, but this resolves and re-checks
   * against the root anyway. A path check that trusts an earlier validation is
   * one refactor away from not being a check.
   */
  private pathFor(key: string): string {
    assertValidKey(key)
    const full = resolve(join(this.root, key))
    if (full !== this.root && !full.startsWith(this.root + sep)) {
      throw new StorageProviderError('object key escapes the storage root', 'invalid_key')
    }
    return full
  }

  async createSignedUploadUrl(params: {
    key: string
    contentType: string
    maxBytes: number
  }): Promise<SignedUploadUrl> {
    this.pathFor(params.key)
    if (!Number.isSafeInteger(params.maxBytes) || params.maxBytes <= 0) {
      throw new StorageProviderError(
        `maxBytes must be a positive integer, got ${params.maxBytes}`,
        'invalid_key',
      )
    }
    return {
      url: `${this.routePrefix}/${params.key}`,
      method: 'PUT',
      headers: { 'content-type': params.contentType },
      expiresAt: new Date(Date.now() + 300_000).toISOString(),
    }
  }

  async createSignedDownloadUrl(params: {
    key: string
    expiresInSeconds: number
  }): Promise<SignedDownloadUrl> {
    this.pathFor(params.key)
    return {
      url: `${this.routePrefix}/${params.key}`,
      method: 'GET',
      expiresAt: new Date(Date.now() + params.expiresInSeconds * 1000).toISOString(),
    }
  }

  /** Not on the interface: the local route handler calls it to store the body. */
  async putObject(params: { key: string; body: Uint8Array }): Promise<void> {
    const path = this.pathFor(params.key)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, params.body)
  }

  async headObject(params: { key: string }): Promise<StorageObjectMetadata | null> {
    const path = this.pathFor(params.key)
    try {
      const stats = await stat(path)
      return { bytes: stats.size, contentType: 'application/octet-stream' }
    } catch {
      return null
    }
  }

  async deleteObject(params: { key: string }): Promise<void> {
    await rm(this.pathFor(params.key), { force: true })
  }

  async moveObject(params: { fromKey: string; toKey: string }): Promise<void> {
    const from = this.pathFor(params.fromKey)
    const to = this.pathFor(params.toKey)
    await mkdir(dirname(to), { recursive: true })
    try {
      await rename(from, to)
    } catch (error) {
      throw new StorageProviderError(
        `could not move the object: ${error instanceof Error ? error.message : String(error)}`,
        'not_found',
      )
    }
  }

  async readObject(params: {
    key: string
  }): Promise<{ bytes: number; stream: AsyncIterable<Uint8Array> }> {
    const path = this.pathFor(params.key)
    const meta = await this.headObject({ key: params.key })
    if (!meta) throw new StorageProviderError('object not found', 'not_found')
    return { bytes: meta.bytes, stream: createReadStream(path) }
  }
}
