import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { createCsrfMiddleware, createStart } from '@tanstack/react-start'
import type { AnyRequestMiddleware } from '@tanstack/react-start'
import { isClerkServerEnabled } from '@/shared/lib/auth/config'
import { requestLoggerMiddleware } from '@/shared/lib/observability'

function isAuthBypassEnabled(): boolean {
  if (typeof process === 'undefined') return false
  const env = process.env
  const isTruthy = (v?: string) => v === 'true' || v === '1'
  const skipAuth = isTruthy(env.SKIP_AUTH) || isTruthy(env.VITE_SKIP_AUTH) || isTruthy(env.VITE_E2E)
  return env.NODE_ENV !== 'production' && skipAuth
}

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
})

export const startInstance = createStart(() => {
  const middleware: AnyRequestMiddleware[] = [csrfMiddleware, requestLoggerMiddleware]

  if (isClerkServerEnabled() && !isAuthBypassEnabled()) {
    middleware.push(clerkMiddleware())
  }

  return {
    requestMiddleware: middleware,
  }
})
