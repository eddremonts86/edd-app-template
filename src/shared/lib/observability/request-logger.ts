/**
 * Request logging middleware.
 *
 * Runs around every server function / server route call. Logs:
 *  - method, URL, status code, duration
 *  - thrown errors with stack
 *
 * Kept intentionally cheap so it can run on every request.
 */
import { createMiddleware } from '@tanstack/react-start'
import { logger } from './logger'

function safeUrl(rawUrl: string): { path: string; method?: string } {
  try {
    const u = new URL(rawUrl)
    return { path: u.pathname + (u.search || '') }
  } catch {
    return { path: rawUrl }
  }
}

export const requestLoggerMiddleware = createMiddleware({ type: 'request' }).server(
  async ({ request, next }) => {
    const start = Date.now()
    const { path } = safeUrl(request.url)
    const method = request.method ?? 'GET'

    try {
      const result = await next()
      const duration = Date.now() - start
      const status = result.response?.status ?? 0

      const slow = duration > 1000
      let logLevel: 'info' | 'warn' | 'error' = 'info'
      if (status >= 500) logLevel = 'error'
      else if (status >= 400 || slow) logLevel = 'warn'
      logger[logLevel](`${method} ${path} → ${status} (${duration}ms)`)

      return result
    } catch (error) {
      const duration = Date.now() - start
      const err = error as Error
      logger.error(`${method} ${path} → THROWN (${duration}ms)`, {
        name: err?.name,
        message: err?.message,
        stack: err?.stack?.split('\n').slice(0, 5).join('\n'),
      })
      throw error
    }
  },
)
