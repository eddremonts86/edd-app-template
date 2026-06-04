import postgres from 'postgres'

export interface ConnectionTestResult {
  ok: boolean
  latencyMs: number
  serverVersion?: string
  currentDatabase?: string
  error?: string
}

/**
 * Open an ephemeral connection, run a trivial query, then close.
 * Used by the Test button in the UI and as a safety check before
 * activating a profile.
 */
export async function testDatabaseConnection(
  connectionUrl: string,
  options: { timeoutMs?: number } = {},
): Promise<ConnectionTestResult> {
  const timeoutMs = options.timeoutMs ?? 5000
  const startedAt = Date.now()
  let client: ReturnType<typeof postgres> | null = null
  try {
    client = postgres(connectionUrl, {
      max: 1,
      prepare: false,
      idle_timeout: 1,
      connect_timeout: Math.ceil(timeoutMs / 1000),
      onnotice: () => {},
    })

    const result = await Promise.race([
      Promise.all([client`SELECT version() as version`, client`SELECT current_database() as db`]),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Connection test timed out')), timeoutMs),
      ),
    ])

    const [[versionRow], [dbRow]] = result as unknown as [
      Array<{ version: string }>,
      Array<{ db: string }>,
    ]
    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      serverVersion: versionRow?.version,
      currentDatabase: dbRow?.db,
    }
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  } finally {
    if (client) {
      try {
        await client.end({ timeout: 2 })
      } catch {
        // Best-effort cleanup.
      }
    }
  }
}
