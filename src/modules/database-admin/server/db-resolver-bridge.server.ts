/**
 * Wires the database-admin override store into the shared DB resolver.
 *
 * Imported once at server startup from `src/start.ts`. After this module
 * runs, `getDb()` consults the override store before falling back to
 * `process.env.DATABASE_URL`.
 */
import { setConnectionUrlResolver } from '@/shared/lib/db'
import { composeConnectionUrl, getActiveProfileSync } from './config-store'

let installed = false

export function installDbAdminResolver(): void {
  if (installed) return
  installed = true
  setConnectionUrlResolver(() => {
    try {
      const active = getActiveProfileSync()
      if (!active) return null
      return composeConnectionUrl(active)
    } catch {
      return null
    }
  })
}
