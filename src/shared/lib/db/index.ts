import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>

let dbInstance: DrizzleDb | null = null
let clientInstance: ReturnType<typeof postgres> | null = null
let resolvedSource: 'env' | 'override' | null = null

/**
 * Optional resolver injected at server startup (see
 * `src/modules/database-admin/server/db-resolver-bridge.ts`). When present
 * and it returns a string, that connection URL wins over `process.env.DATABASE_URL`.
 * Returning `null` falls back to the env value.
 */
type ConnectionUrlResolver = () => string | null
let overrideResolver: ConnectionUrlResolver | null = null

export function setConnectionUrlResolver(resolver: ConnectionUrlResolver | null): void {
  overrideResolver = resolver
}

function resolveConnectionString(): { url: string; source: 'env' | 'override' } {
  if (overrideResolver) {
    try {
      const candidate = overrideResolver()
      if (candidate && candidate.length > 0) {
        return { url: candidate, source: 'override' }
      }
    } catch {
      // Fall through to env.
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const envUrl = process.env.DATABASE_URL || (import.meta as any).env?.DATABASE_URL
  if (!envUrl) {
    throw new Error('DATABASE_URL is not defined and no active override profile is configured')
  }
  return { url: envUrl, source: 'env' }
}

export const getDb = (): DrizzleDb => {
  if (dbInstance) return dbInstance

  if (typeof window !== 'undefined') {
    throw new Error('Database connection cannot be initialized in the browser')
  }

  try {
    const { url, source } = resolveConnectionString()
    resolvedSource = source
    clientInstance = postgres(url, { prepare: false })
    dbInstance = drizzle(clientInstance, { schema })
    return dbInstance
  } catch (error) {
    console.error('❌ Failed to initialize database connection:', error)
    throw error
  }
}

/**
 * Drop the cached connection so the next `getDb()` rebuilds from the
 * current resolver state. Used after activating a different profile.
 */
export async function invalidateDb(): Promise<void> {
  if (clientInstance) {
    try {
      await clientInstance.end({ timeout: 5 })
    } catch {
      // Swallow shutdown errors — the next getDb() will recreate the pool.
    }
  }
  clientInstance = null
  dbInstance = null
  resolvedSource = null
}

export function getResolvedConnectionSource(): 'env' | 'override' | null {
  return resolvedSource
}
