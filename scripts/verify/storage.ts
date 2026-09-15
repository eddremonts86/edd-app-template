/**
 * storage.ts — exercise the S3 provider against a real S3 server.
 *
 * Opt-in, never part of `pnpm test`: §8.4 of the integration conventions bars a
 * live third-party account from the suite. Run it by hand against a MinIO you
 * control, with STORAGE_* pointing at it.
 *
 * It checks the three claims the code makes in prose and could not otherwise
 * prove: that a presigned PUT does *not* cap the body size, that the signed
 * content-type is enforced, and that the path-style client actually reaches a
 * bucket-scoped account.
 */
import { StorageProviderError } from '@/modules/storage/model/types'
import { S3StorageProvider } from '@/modules/storage/server/s3-provider'

const required = [
  'STORAGE_ENDPOINT',
  'STORAGE_BUCKET',
  'STORAGE_ACCESS_KEY_ID',
  'STORAGE_SECRET_ACCESS_KEY',
]
const missing = required.filter((key) => !process.env[key]?.trim())
if (missing.length > 0) {
  console.error(`storage verify needs: ${missing.join(', ')}`)
  process.exit(2)
}

const provider = new S3StorageProvider({
  endpoint: process.env.STORAGE_ENDPOINT!,
  bucket: process.env.STORAGE_BUCKET!,
  accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
  secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
  region: process.env.STORAGE_REGION,
})

let failures = 0
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failures += 1
}

const stamp = Date.now()
const key = `verify/${stamp}/hello.txt`
const moved = `verify/${stamp}/moved.txt`
const body = new TextEncoder().encode('hello from the template')

// 1. presign, then upload with exactly the headers handed back.
const upload = await provider.createSignedUploadUrl({
  key,
  contentType: 'text/plain',
  maxBytes: 10,
})
check(
  'createSignedUploadUrl returns a signed PUT',
  upload.method === 'PUT' && upload.url.includes('X-Amz-Signature'),
)
check(
  'url is path-style',
  new URL(upload.url).pathname.startsWith(`/${process.env.STORAGE_BUCKET}/`),
  new URL(upload.url).pathname,
)

const put = await fetch(upload.url, {
  method: 'PUT',
  headers: upload.headers as Record<string, string>,
  body,
})
check('the presigned PUT is accepted', put.ok, `HTTP ${put.status}`)

// 2. maxBytes was 10 and the body is longer. If this passes, the doc comment is
//    right and the caller really is the only thing standing between an oversized
//    upload and a stored object.
check(
  'maxBytes does NOT cap the upload (the doc comment is true)',
  put.ok && body.length > 10,
  `${body.length} bytes stored under a 10-byte limit`,
)

// 3. the signed content-type is enforced, so the client cannot relabel the object.
const wrongType = await fetch(upload.url, {
  method: 'PUT',
  headers: { 'content-type': 'application/pdf' },
  body,
})
check('a PUT with an unsigned content-type is rejected', !wrongType.ok, `HTTP ${wrongType.status}`)

// 4. head — this is the call that enforces the size limit after the fact.
const head = await provider.headObject({ key })
check(
  'headObject reports the real size and type',
  head?.bytes === body.length && head?.contentType === 'text/plain',
  JSON.stringify(head),
)
check('headObject would catch the oversize', (head?.bytes ?? 0) > 10)
check(
  'headObject returns null for an absent key',
  (await provider.headObject({ key: `${key}.nope` })) === null,
)

// 5. download.
const download = await provider.createSignedDownloadUrl({ key, expiresInSeconds: 60 })
const got = await fetch(download.url)
check(
  'the presigned GET returns the same bytes',
  got.ok && (await got.text()) === 'hello from the template',
  `HTTP ${got.status}`,
)

// 6. move = copy + delete.
await provider.moveObject({ fromKey: key, toKey: moved })
check('moveObject leaves nothing behind', (await provider.headObject({ key })) === null)
check(
  'moveObject puts the object at the new key',
  (await provider.headObject({ key: moved }))?.bytes === body.length,
)

// 7. server-side read.
const read = await provider.readObject({ key: moved })
const chunks: Uint8Array[] = []
for await (const chunk of read.stream) chunks.push(chunk)
check(
  'readObject streams the bytes back',
  Buffer.concat(chunks).toString() === 'hello from the template',
)

// 8. a missing object throws on read, unlike head.
try {
  await provider.readObject({ key: `${moved}.nope` })
  check('readObject throws on a missing object', false)
} catch (error) {
  check(
    'readObject throws not_found on a missing object',
    error instanceof StorageProviderError && error.code === 'not_found',
    (error as StorageProviderError).code,
  )
}

// 9. delete, and the vendor error never escapes.
await provider.deleteObject({ key: moved })
check('deleteObject removes it', (await provider.headObject({ key: moved })) === null)

try {
  await new S3StorageProvider({
    endpoint: process.env.STORAGE_ENDPOINT!,
    bucket: `${process.env.STORAGE_BUCKET}-does-not-exist`,
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
  }).headObject({ key: 'x' })
  check('a bucket outside the policy is refused', false, 'it was not')
} catch (error) {
  check(
    'a bucket outside the policy raises StorageProviderError, not an SDK error',
    error instanceof StorageProviderError,
    `${(error as Error).name}/${(error as StorageProviderError).code}`,
  )
}

console.log(
  failures === 0 ? '\nstorage: all checks passed' : `\nstorage: ${failures} check(s) failed`,
)
process.exit(failures === 0 ? 0 : 1)
