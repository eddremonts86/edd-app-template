/**
 * Health endpoint for Coolify and docker-compose healthchecks.
 *
 * Returns 200 with a small JSON body when the app process is responsive.
 * Does NOT touch the DB on purpose — DB liveness is checked by the `db`
 * service's own healthcheck. Mixing the two would cause cascading failures
 * during planned DB maintenance.
 *
 * **That is the intent, not yet the behaviour.** Better Auth's server module
 * calls `getDb()` while it is being imported, so an unreachable database fails
 * `loadEntries` and every route answers 500 — this one included. Verified by
 * running the production image with no `DATABASE_URL`: the server logs
 * "Listening", and `/api/health` returns 500. Until that import is made lazy,
 * a database outage still takes the healthcheck down with it.
 */
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/health')({
  component: () => null,
  server: {
    handlers: {
      GET: () =>
        new Response(JSON.stringify({ ok: true, ts: new Date().toISOString() }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    },
  },
})
