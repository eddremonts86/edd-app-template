import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import {
  assertValidKey,
  StorageProviderError,
  type SignedDownloadUrl,
  type SignedUploadUrl,
  type StorageObjectMetadata,
  type StorageProvider,
} from '../model/types'

/**
 * `StorageProvider` over the S3 API, defaulting to self-hosted MinIO.
 *
 * The env names say `STORAGE_*` rather than naming a vendor
 * (docs/architecture/integration-conventions.md §5.2) — the endpoint URL
 * already says who is serving it, and builderhunt's `INTERVIEW_R2_*` keys point
 * at MinIO, which costs a paragraph of explanation on every file that reads
 * them.
 *
 * Every vendor error is normalised before it leaves this file.
 */

export interface S3StorageConfig {
  endpoint: string
  bucket: string
  accessKeyId: string
  secretAccessKey: string
  region?: string
}

/** Long enough for a slow mobile upload, short enough that a leaked URL is stale. */
const UPLOAD_URL_TTL_SECONDS = 300

function normalise(error: unknown, fallback: string): StorageProviderError {
  if (error instanceof StorageProviderError) return error

  const name = (error as { name?: string } | null)?.name ?? ''
  const status = (error as { $metadata?: { httpStatusCode?: number } } | null)?.$metadata
    ?.httpStatusCode

  if (name === 'NotFound' || name === 'NoSuchKey' || status === 404) {
    return new StorageProviderError('object not found', 'not_found')
  }
  if (name === 'AccessDenied' || status === 403) {
    return new StorageProviderError('access denied by the object store', 'access_denied')
  }
  return new StorageProviderError(
    `${fallback}: ${error instanceof Error ? error.message : String(error)}`,
    'provider_unavailable',
  )
}

export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client
  private readonly bucket: string

  constructor(config: S3StorageConfig, client?: S3Client) {
    this.bucket = config.bucket
    const options: S3ClientConfig = {
      endpoint: config.endpoint,
      // MinIO serves path-style. Virtual-host style would resolve the bucket as
      // a subdomain of an internal hostname that has no DNS record.
      forcePathStyle: true,
      region: config.region ?? 'auto',
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    }
    this.client = client ?? new S3Client(options)
  }

  async createSignedUploadUrl(params: {
    key: string
    contentType: string
    maxBytes: number
  }): Promise<SignedUploadUrl> {
    assertValidKey(params.key)
    if (!Number.isSafeInteger(params.maxBytes) || params.maxBytes <= 0) {
      throw new StorageProviderError(
        `maxBytes must be a positive integer, got ${params.maxBytes}`,
        'invalid_key',
      )
    }

    try {
      // `signableHeaders` is not optional. Without it the SDK signs only `host`
      // and MinIO rejects the upload — "there were headers present in the
      // request which were not signed" — the moment the client sends the
      // content type back. Naming it also makes it enforced: an unsigned header
      // is one the client can change freely.
      const url = await getSignedUrl(
        this.client,
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: params.key,
          ContentType: params.contentType,
        }),
        { expiresIn: UPLOAD_URL_TTL_SECONDS, signableHeaders: new Set(['content-type']) },
      )

      return {
        url,
        method: 'PUT',
        // The only header, deliberately: MinIO rejects any header the signature
        // does not cover, so every extra one is a failure mode rather than a
        // control. This one is covered, so the upload fails if the client
        // announces a different type.
        headers: { 'content-type': params.contentType },
        expiresAt: new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000).toISOString(),
      }
    } catch (error) {
      throw normalise(error, 'could not sign an upload url')
    }
  }

  async createSignedDownloadUrl(params: {
    key: string
    expiresInSeconds: number
  }): Promise<SignedDownloadUrl> {
    assertValidKey(params.key)
    if (
      !Number.isSafeInteger(params.expiresInSeconds) ||
      params.expiresInSeconds <= 0 ||
      params.expiresInSeconds > 3600
    ) {
      throw new StorageProviderError(
        `expiresInSeconds must be 1..3600, got ${params.expiresInSeconds}`,
        'invalid_key',
      )
    }

    try {
      const url = await getSignedUrl(
        this.client,
        new GetObjectCommand({ Bucket: this.bucket, Key: params.key }),
        { expiresIn: params.expiresInSeconds },
      )
      return {
        url,
        method: 'GET',
        expiresAt: new Date(Date.now() + params.expiresInSeconds * 1000).toISOString(),
      }
    } catch (error) {
      throw normalise(error, 'could not sign a download url')
    }
  }

  async headObject(params: { key: string }): Promise<StorageObjectMetadata | null> {
    assertValidKey(params.key)
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.bucket, Key: params.key }),
      )
      return {
        bytes: result.ContentLength ?? 0,
        contentType: result.ContentType ?? 'application/octet-stream',
      }
    } catch (error) {
      const normalised = normalise(error, 'could not head the object')
      // Absence is an answer here, not a failure — this is the call that
      // enforces the upload size limit.
      if (normalised.code === 'not_found') return null
      throw normalised
    }
  }

  async deleteObject(params: { key: string }): Promise<void> {
    assertValidKey(params.key)
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: params.key }))
    } catch (error) {
      throw normalise(error, 'could not delete the object')
    }
  }

  async moveObject(params: { fromKey: string; toKey: string }): Promise<void> {
    assertValidKey(params.fromKey)
    assertValidKey(params.toKey)
    try {
      // S3 has no move: copy then delete. A failure between the two leaves the
      // source in place, which is the safe direction.
      await this.client.send(
        new CopyObjectCommand({
          Bucket: this.bucket,
          CopySource: `${this.bucket}/${params.fromKey}`,
          Key: params.toKey,
        }),
      )
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: params.fromKey }))
    } catch (error) {
      throw normalise(error, 'could not move the object')
    }
  }

  async readObject(params: {
    key: string
  }): Promise<{ bytes: number; stream: AsyncIterable<Uint8Array> }> {
    assertValidKey(params.key)
    try {
      const result = await this.client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: params.key }),
      )
      if (!result.Body) {
        throw new StorageProviderError('object has no body', 'not_found')
      }
      return {
        bytes: result.ContentLength ?? 0,
        stream: result.Body as AsyncIterable<Uint8Array>,
      }
    } catch (error) {
      throw normalise(error, 'could not read the object')
    }
  }
}
