/**
 * The object-storage contract. No I/O, no vendor SDK import.
 *
 * Domain code sees these shapes and `StorageProviderError`, never an
 * `S3ServiceException` (docs/architecture/integration-conventions.md §3.4).
 * Ported from builderhunt, where this interface is what let the backing store
 * change without touching a call site.
 *
 * Free of I/O on purpose — §2.3. Tests and browser code import this file; the
 * barrel pulls the SDK in.
 */

export interface SignedUploadUrl {
  url: string
  method: 'PUT'
  headers: Readonly<Record<string, string>>
  expiresAt: string
}

export interface SignedDownloadUrl {
  url: string
  method: 'GET'
  expiresAt: string
}

export interface StorageObjectMetadata {
  bytes: number
  contentType: string
}

export type StorageErrorCode =
  'not_found' | 'access_denied' | 'invalid_key' | 'provider_unavailable' | 'unconfigured'

export class StorageProviderError extends Error {
  constructor(
    message: string,
    readonly code: StorageErrorCode,
  ) {
    super(message)
    this.name = 'StorageProviderError'
  }
}

export interface StorageProvider {
  /**
   * A URL the browser PUTs to. The bytes never transit this server.
   *
   * `maxBytes` is **advisory here and authoritative afterwards.** A presigned
   * PUT cannot cap the body size — only a presigned POST can, through policy
   * conditions, and signing an exact `Content-Length` would turn "one byte
   * smaller than announced" into an opaque signature failure. The caller must
   * read `headObject` after the upload and reject anything over the limit
   * *before* treating the object as usable. By then it is written, so rejecting
   * means deleting it.
   *
   * Written here because the signature invites the opposite assumption, and
   * believing it would leave the only real check unwritten.
   */
  createSignedUploadUrl(params: {
    key: string
    contentType: string
    maxBytes: number
  }): Promise<SignedUploadUrl>

  createSignedDownloadUrl(params: {
    key: string
    expiresInSeconds: number
  }): Promise<SignedDownloadUrl>

  /** Null when the object is absent — this is how the size check above is done. */
  headObject(params: { key: string }): Promise<StorageObjectMetadata | null>

  deleteObject(params: { key: string }): Promise<void>

  moveObject(params: { fromKey: string; toKey: string }): Promise<void>

  /**
   * Streams the bytes back, for workers that must read an object server-side.
   * Not a general-purpose read: anything serving a file to a person goes
   * through `createSignedDownloadUrl` so the bytes never transit this server.
   *
   * Unlike `headObject`, a missing object throws — a worker asked to read
   * something that is not there is a bug, not a verdict.
   */
  readObject(params: { key: string }): Promise<{ bytes: number; stream: AsyncIterable<Uint8Array> }>
}

/**
 * Keys are generated server-side, never supplied by a visitor. This rejects the
 * shapes that would still be dangerous if that ever stopped being true, rather
 * than trusting the generator to stay correct.
 */
export function assertValidKey(key: string): void {
  if (key.length === 0 || key.length > 1024) {
    throw new StorageProviderError(
      `object key must be 1..1024 characters, got ${key.length}`,
      'invalid_key',
    )
  }
  if (key.startsWith('/') || key.includes('//')) {
    throw new StorageProviderError(
      'object key must be relative and must not contain an empty segment',
      'invalid_key',
    )
  }
  if (key.split('/').some((segment) => segment === '.' || segment === '..')) {
    throw new StorageProviderError('object key must not contain a traversal segment', 'invalid_key')
  }
  // Control characters survive some S3 implementations and are stripped by
  // others, so the same key can address two different objects depending on who
  // reads it.
  // No regex: a character-class with \u escapes gets rewritten into literal
  // control characters by the formatter, leaving invisible bytes in the source.
  // Comparing code points says the same thing and survives a format pass.
  for (const character of key) {
    const code = character.codePointAt(0) ?? 0
    if (code <= 0x1f || code === 0x7f) {
      throw new StorageProviderError(
        'object key must not contain control characters',
        'invalid_key',
      )
    }
  }
}

// -- Opt-in hooks: interfaces shipped, implementations deliberately not -------

export type ScanStatus = 'clean' | 'infected' | 'error'

export interface ScanResult {
  status: ScanStatus
  /** The scanner's own label. An internal diagnostic, never shown to a user as-is. */
  detailCode: string | null
}

/**
 * Virus scanning. No implementation ships with the template — an app that needs
 * it wires one (builderhunt has a ClamAV one worth copying).
 *
 * If you do wire one: there is no degraded mode. A missing scanner must switch
 * uploads off, not let them through unscanned.
 */
export interface VirusScanProvider {
  scanObject(params: { key: string }): Promise<ScanResult>
}
