/**
 * Production HTTP server wrapper for TanStack Start.
 *
 * TanStack Start (Vite plugin) builds:
 *   dist/server/server.js  — Web Fetch API handler (SSR)
 *   dist/client/           — static assets served at /
 *
 * Usage: node server.prod.mjs
 */
import { createReadStream, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PORT = parseInt(process.env.PORT ?? '3000', 10)
const HOST = process.env.HOST ?? '0.0.0.0'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const CLIENT_DIR = resolve(__dirname, 'dist/client')

// MIME types for static files
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain',
  '.webmanifest': 'application/manifest+json',
}

// Try to serve a static file; return true if served
function tryServeStatic(pathname, res) {
  // Prevent path traversal
  const safePath = pathname.replace(/\.\./g, '')
  const filePath = join(CLIENT_DIR, safePath)

  // Must stay within CLIENT_DIR
  if (!filePath.startsWith(CLIENT_DIR)) return false

  let stat
  try {
    stat = statSync(filePath)
  } catch {
    return false
  }

  if (!stat.isFile()) return false

  const ext = extname(filePath).toLowerCase()
  const mime = MIME[ext] ?? 'application/octet-stream'

  // Immutable cache for hashed assets (Vite uses hash in filename)
  const isHashedAsset = /\/assets\//.test(safePath)
  const cacheControl = isHashedAsset
    ? 'public, max-age=31536000, immutable'
    : 'public, max-age=3600'

  res.writeHead(200, {
    'Content-Type': mime,
    'Content-Length': stat.size,
    'Cache-Control': cacheControl,
  })
  createReadStream(filePath).pipe(res)
  return true
}

// Dynamic import so we get the built handler
const { default: app } = await import('./dist/server/server.js')

if (!app || typeof app.fetch !== 'function') {
  console.error('ERROR: dist/server/server.js did not export a valid fetch handler')
  process.exit(1)
}

const server = createServer(async (req, res) => {
  const protocol = 'http'
  const host = req.headers.host ?? `localhost:${PORT}`
  const url = new URL(req.url ?? '/', `${protocol}://${host}`)

  // Serve static files from dist/client/ before hitting the SSR handler
  if (req.method === 'GET' || req.method === 'HEAD') {
    if (tryServeStatic(url.pathname, res)) return
  }

  const headers = new Headers()
  for (const [key, val] of Object.entries(req.headers)) {
    if (val == null) continue
    if (Array.isArray(val)) {
      for (const v of val) headers.append(key, v)
    } else {
      headers.set(key, val)
    }
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  const webRequest = new Request(url.href, {
    method: req.method,
    headers,
    ...(hasBody ? { body: req, duplex: 'half' } : {}),
  })

  let webResponse
  try {
    webResponse = await app.fetch(webRequest)
  } catch (err) {
    console.error('[server] Handler error:', err)
    res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end('Internal Server Error')
    return
  }

  // Forward status + headers
  const resHeaders = {}
  for (const [k, v] of webResponse.headers.entries()) {
    resHeaders[k] = v
  }
  res.writeHead(webResponse.status, resHeaders)

  // Stream body
  if (webResponse.body) {
    const reader = webResponse.body.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(Buffer.from(value))
      }
    } finally {
      reader.releaseLock()
    }
  }
  res.end()
})

server.listen(PORT, HOST, () => {
  console.log(`[server] Listening on http://${HOST}:${PORT}`)
})

server.on('error', (err) => {
  console.error('[server] Fatal:', err)
  process.exit(1)
})
