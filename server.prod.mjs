/**
 * Production HTTP server wrapper for TanStack Start.
 *
 * TanStack Start (Vite plugin) builds `dist/server/server.js` as an ESM module
 * that exports a Web Fetch API handler. This wrapper bridges it to Node.js http.
 *
 * Usage: node server.prod.mjs
 */
import { createServer } from 'node:http'

const PORT = parseInt(process.env.PORT ?? '3000', 10)
const HOST = process.env.HOST ?? '0.0.0.0'

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
