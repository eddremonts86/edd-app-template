# Observability Skill

> Load when: adding/debugging logs, server-fn timing, error tracking, or anytime
> you're tempted to write `console.log` in app code.

## TL;DR — the contract

1. **Never use raw `console.log` in app code.** Import `logger` from `@/shared/lib/observability`.
2. Every server function and server route is **already** wrapped by `requestLoggerMiddleware` (registered in `src/start.ts`). You get method, path, status, duration and stack traces for free.
3. The logger is **isomorphic** — same import works in server and client code, with `[SERVER:…]` / `[CLIENT:…]` prefixes automatically.
4. Sentry is initialized in `src/routes/__root.tsx`. For server-side captures, see the _“Sentry from server fn”_ section below.
5. `/api/health` is reserved for Coolify/docker healthchecks. **Do not** add DB calls to it (that breaks during maintenance windows).

## Files that matter

- `src/shared/lib/observability/logger.ts` — `createIsomorphicFn()`-backed logger
- `src/shared/lib/observability/request-logger.ts` — `createMiddleware({ type: 'request' }).server(…)`
- `src/shared/lib/observability/index.ts` — public barrel
- `src/start.ts` — `createStart()` registers `[requestLoggerMiddleware, clerkMiddleware?]`
- `src/routes/api/health.tsx` — process liveness only

## Use cases

### Plain logging

```ts
import { logger } from '@/shared/lib/observability'

logger.info('user signed up', { userId })
logger.warn('rate limit close', { remaining })
logger.error('payment failed', { error: err.message, orderId })
```

### Wrapping a third-party call with timing

```ts
const t0 = Date.now()
const res = await openai.chat.completions.create(…)
logger.info('openai.chat', { ms: Date.now() - t0, model: res.model })
```

### Sending a server-fn error to Sentry

```ts
import * as Sentry from '@sentry/react'
import { logger } from '@/shared/lib/observability'

try {
  …
} catch (err) {
  logger.error('myServerFn failed', { err })
  Sentry.captureException(err, { tags: { fn: 'myServerFn' } })
  throw err
}
```

### Adding more middleware (correct order)

Always add **before** clerkMiddleware so logs include auth context:

```ts
// src/start.ts
const middleware: AnyRequestMiddleware[] = [
  requestLoggerMiddleware,
  myCustomMiddleware, // e.g. requestId, rate-limit
]
if (isClerkServerEnabled() && !isAuthBypassEnabled()) middleware.push(clerkMiddleware())
```

## Anti-patterns

| Don't                                                      | Do                                                                           |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `console.log('x', x)`                                      | `logger.debug('x', { x })`                                                   |
| Wrapping every server fn in your own try/catch just to log | Trust `requestLoggerMiddleware` — it already logs thrown errors with stack   |
| Adding DB queries to `/api/health`                         | Liveness only. Add a separate `/api/health/db` if you really need readiness. |
| Logging full request bodies                                | Strip PII first. Log shapes/sizes, not contents.                             |

## How to verify it's wired

```bash
pnpm dev
curl -s http://localhost:3000/api/health
# in the pnpm dev terminal you should see:
# [<iso>] [SERVER:INFO] GET /api/health → 200 (1ms)
```

If you don't, check `src/start.ts` still exports `startInstance = createStart(() => ({ requestMiddleware: [...] }))` with `requestLoggerMiddleware` in the array.

## Production behaviour

`logger` switches to single-line JSON in `NODE_ENV=production`. Aggregate via Coolify's log driver or pipe stdout to Loki/Datadog/etc. — no extra wiring required.
