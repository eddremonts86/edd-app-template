import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import postgres from 'postgres'
import type { MigrationFileReport, MigrationRunReport, MigrationStatus } from '../model/migration'

const MIGRATIONS_DIR = join(process.cwd(), 'drizzle')

interface AppliedRow {
  name: string
  applied_at: string
}

async function listMigrationFiles(): Promise<string[]> {
  const entries = await readdir(MIGRATIONS_DIR)
  return entries.filter((f) => f.endsWith('.sql')).sort()
}

async function ensureMigrationsTable(sql: ReturnType<typeof postgres>): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS __migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `
}

/**
 * Open an ephemeral connection and report which migration files exist on
 * disk vs which are already recorded in `__migrations`.
 */
export async function listMigrationStatus(connectionUrl: string): Promise<MigrationStatus[]> {
  const files = await listMigrationFiles()
  const sql = postgres(connectionUrl, { max: 1, prepare: false, onnotice: () => {} })
  try {
    await ensureMigrationsTable(sql)
    const appliedRows = await sql<AppliedRow[]>`
      SELECT name, applied_at::text FROM __migrations
    `
    const appliedMap = new Map(appliedRows.map((row) => [row.name, row.applied_at]))
    return files.map((file) => ({
      file,
      applied: appliedMap.has(file),
      appliedAt: appliedMap.get(file) ?? null,
    }))
  } finally {
    await sql.end({ timeout: 5 })
  }
}

function splitStatements(content: string): string[] {
  return content
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean)
}

function previewStatement(stmt: string, max = 160): string {
  const collapsed = stmt.split(/\s+/).join(' ').trim()
  return collapsed.length > max ? `${collapsed.slice(0, max - 1)}…` : collapsed
}

/**
 * Run pending migrations against the given connection.
 *
 * - `dryRun: true` reports the plan without executing anything (no writes to
 *   `__migrations`).
 * - Each migration file runs in its own transaction. A failure rolls back
 *   that file and aborts the run; previously applied files are kept.
 */
export async function runMigrations(opts: {
  connectionUrl: string
  dryRun?: boolean
}): Promise<MigrationRunReport> {
  const startedAt = new Date().toISOString()
  const dryRun = Boolean(opts.dryRun)
  const fileReports: MigrationFileReport[] = []
  let appliedCount = 0
  let skippedCount = 0
  let runError: string | null = null

  const sql = postgres(opts.connectionUrl, { max: 1, prepare: false, onnotice: () => {} })

  try {
    const files = await listMigrationFiles()
    if (files.length === 0) {
      return {
        startedAt,
        finishedAt: new Date().toISOString(),
        dryRun,
        appliedCount: 0,
        skippedCount: 0,
        files: [],
        error: null,
      }
    }

    await ensureMigrationsTable(sql)
    const applied = new Set(
      (await sql<{ name: string }[]>`SELECT name FROM __migrations`).map((r) => r.name),
    )

    for (const file of files) {
      if (applied.has(file)) {
        skippedCount += 1
        continue
      }

      const content = await readFile(join(MIGRATIONS_DIR, file), 'utf8')
      const statements = splitStatements(content)

      if (dryRun) {
        fileReports.push({
          file,
          appliedNow: false,
          statements: statements.map((stmt, idx) => ({
            index: idx,
            total: statements.length,
            sqlPreview: previewStatement(stmt),
            ok: true,
            error: null,
            durationMs: 0,
          })),
          error: null,
        })
        continue
      }

      const fileReport: MigrationFileReport = {
        file,
        appliedNow: false,
        statements: [],
        error: null,
      }

      try {
        await sql.begin(async (tx) => {
          for (let idx = 0; idx < statements.length; idx += 1) {
            const stmt = statements[idx]
            const stmtStart = Date.now()
            try {
              await tx.unsafe(stmt)
              fileReport.statements.push({
                index: idx,
                total: statements.length,
                sqlPreview: previewStatement(stmt),
                ok: true,
                error: null,
                durationMs: Date.now() - stmtStart,
              })
            } catch (error) {
              fileReport.statements.push({
                index: idx,
                total: statements.length,
                sqlPreview: previewStatement(stmt),
                ok: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                durationMs: Date.now() - stmtStart,
              })
              throw error
            }
          }
          await tx`INSERT INTO __migrations (name) VALUES (${file})`
        })
        fileReport.appliedNow = true
        appliedCount += 1
      } catch (error) {
        fileReport.error = error instanceof Error ? error.message : 'Unknown error'
        fileReports.push(fileReport)
        runError = fileReport.error
        break
      }

      fileReports.push(fileReport)
    }
  } catch (error) {
    runError = error instanceof Error ? error.message : 'Unknown error'
  } finally {
    try {
      await sql.end({ timeout: 5 })
    } catch {
      // Best-effort cleanup.
    }
  }

  return {
    startedAt,
    finishedAt: new Date().toISOString(),
    dryRun,
    appliedCount,
    skippedCount,
    files: fileReports,
    error: runError,
  }
}
