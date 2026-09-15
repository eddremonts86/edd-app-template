# Object storage

Presigned upload and download over the S3 API, defaulting to self-hosted MinIO.
Ported from builderhunt, where this interface is what let the backing store
change without touching a call site.

Follows [`docs/architecture/integration-conventions.md`](../../../docs/architecture/integration-conventions.md).

## Disabled by default

`enabledByDefault: false` — the only module that does this. Storage is also the
only integration that **refuses to degrade**, and the two go together: a clone
that does not need storage must never meet the refusal.

## Why it fails loud

Every other integration resolves to `undefined` and lets the caller degrade.
A fallback here would let the upload path appear to work while the files went
nowhere, and the first sign of trouble would be a download returning nothing,
months later. There is no honest degraded mode for "we accepted your file".

`STORAGE_PROVIDER` has **no default**. Local is never assumed, because a
container's disk does not survive a deploy — assuming it would reintroduce
exactly this failure. Setting `STORAGE_PROVIDER=local` in production is refused.

## Configuration

| Key                          | When     | Notes                            |
| ---------------------------- | -------- | -------------------------------- |
| `STORAGE_PROVIDER`           | always   | `s3` or `local`. No default.     |
| `STORAGE_ENDPOINT`           | `s3`     | e.g. `https://minio.example.com` |
| `STORAGE_BUCKET`             | `s3`     |                                  |
| `STORAGE_ACCESS_KEY_ID`      | `s3`     |                                  |
| `STORAGE_SECRET_ACCESS_KEY`  | `s3`     |                                  |
| `STORAGE_REGION`             | optional | defaults to `auto`               |
| `STORAGE_LOCAL_DIR`          | `local`  | development only                 |
| `STORAGE_LOCAL_ROUTE_PREFIX` | optional | defaults to `/api/storage/local` |

The names say `STORAGE_*`, not `MINIO_*` or `R2_*`. The endpoint URL already
says who is serving it, and builderhunt's `INTERVIEW_R2_*` keys point at MinIO —
which costs a paragraph of explanation on every file that reads them.

## `maxBytes` is advisory, and this is the trap

`createSignedUploadUrl({ maxBytes })` reads like an enforced limit. **It is
not.** A presigned PUT cannot cap the body size; only a presigned POST can,
through policy conditions. Signing an exact `Content-Length` is not a substitute
either — it would turn "one byte smaller than announced" into an opaque
signature failure.

So the caller must:

1. Take the signed URL and let the browser PUT to it.
2. Call `headObject` afterwards and check the real size.
3. Reject anything over the limit **before** treating the object as usable. By
   then it is written, so rejecting means `deleteObject`, not refusing.

Believing the signature would leave the only real check unwritten.

## Two details that cost builderhunt time

- **`signableHeaders: new Set(['content-type'])`** is not optional. Without it
  the SDK signs only `host`, and MinIO rejects the upload the moment the client
  sends the content type back. Naming it also makes it enforced.
- **`forcePathStyle: true`.** MinIO serves path-style; virtual-host style would
  resolve the bucket as a subdomain of an internal hostname with no DNS record.

## Not shipped

The `VirusScanProvider` interface is here; no implementation is. If you wire one
there is no degraded mode — a missing scanner switches uploads off, it does not
let them through unscanned. builderhunt has a ClamAV implementation worth
copying, along with a retention worker.

## Imports

`model/types.ts` is free of I/O. Import the contract and `assertValidKey` from
there; the barrel pulls the AWS SDK in.

## Moving it to another app

1. `cp -r src/modules/storage <other-app>/src/modules/`
2. `pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
3. Register `storageModule` in `core/registry.ts` and `storageTranslations` in
   `core/module-i18n.ts`
4. `cat src/modules/storage/env.example >> .env.example`
5. `pnpm validate`
