/**
 * Isomorphic structured logger.
 *
 * On the server: emits structured JSON in production, pretty console.* in dev.
 * On the client: forwards to console with a `[CLIENT]` prefix and (when wired)
 * forwards errors to Sentry.
 *
 * Use this everywhere instead of bare `console.log` so production logs are
 * parseable and the client side stays consistent.
 */
import { createIsomorphicFn } from '@tanstack/react-start'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const SERVICE = 'edd-app-template'

function nowIso() {
  return new Date().toISOString()
}

function shouldEmit(level: LogLevel): boolean {
  // In production keep things quieter by default.
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return level !== 'debug'
  }
  return true
}

export const log = createIsomorphicFn()
  .server((level: LogLevel, message: string, data?: unknown) => {
    if (!shouldEmit(level)) return

    if (process.env.NODE_ENV === 'production') {
      // Structured JSON for log aggregators.
      // eslint-disable-next-line no-console
      console.log(
        JSON.stringify({
          ts: nowIso(),
          level,
          service: SERVICE,
          msg: message,
          data: data ?? undefined,
          env: process.env.NODE_ENV,
        }),
      )
      return
    }

    // Dev: pretty.
    const method = level === 'debug' ? 'log' : level
    // eslint-disable-next-line no-console
    console[method](`[${nowIso()}] [SERVER:${level.toUpperCase()}] ${message}`, data ?? '')
  })
  .client((level: LogLevel, message: string, data?: unknown) => {
    if (!shouldEmit(level)) return
    const method = level === 'debug' ? 'log' : level
    // eslint-disable-next-line no-console
    console[method](`[CLIENT:${level.toUpperCase()}] ${message}`, data ?? '')
  })

export const logger = {
  debug: (msg: string, data?: unknown) => log('debug', msg, data),
  info: (msg: string, data?: unknown) => log('info', msg, data),
  warn: (msg: string, data?: unknown) => log('warn', msg, data),
  error: (msg: string, data?: unknown) => log('error', msg, data),
}
