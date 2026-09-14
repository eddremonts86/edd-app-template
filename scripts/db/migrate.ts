/**
 * migrate.ts — Apply SQL migrations from ./drizzle/*.sql and from each module.
 *
 * Bypasses drizzle-kit CLI (silent failures) and drizzle-orm's migrator
 * (requires drizzle/meta/_journal.json — not present in this template).
 * Applies *.sql files in lexical order, tracked in `__migrations`.
 *
 * Modules own their tables, so they own their migrations
 * (docs/architecture/integration-conventions.md §6): anything in
 * `src/modules/<id>/migrations/*.sql` is applied after the core chain and
 * recorded as `module:<id>/<file>`. That namespacing is what lets a module be
 * copied into another app and migrated there without colliding with a core
 * migration that happens to share a number.
 *
 * Usage: pnpm db:migrate — idempotent, applied migrations are skipped.
 */
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import postgres from 'postgres'

interface Migration {
  /** What goes in `__migrations`. Unique across core and every module. */
  name: string
  path: string
}

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌  DATABASE_URL is not set. Check your .env file.')
  process.exit(1)
}

const MIGRATIONS_DIR = join(process.cwd(), 'drizzle')
const MODULES_DIR = join(process.cwd(), 'src', 'modules')

async function sqlFilesIn(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir)
    return entries.filter((file) => file.endsWith('.sql')).sort()
  } catch {
    // No such directory — a module without migrations is the normal case.
    return []
  }
}

async function collectMigrations(): Promise<Migration[]> {
  const core = (await sqlFilesIn(MIGRATIONS_DIR)).map((file) => ({
    name: file,
    path: join(MIGRATIONS_DIR, file),
  }))

  const moduleIds = (await readdir(MODULES_DIR, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  const fromModules: Migration[] = []
  for (const moduleId of moduleIds) {
    const dir = join(MODULES_DIR, moduleId, 'migrations')
    for (const file of await sqlFilesIn(dir)) {
      fromModules.push({ name: `module:${moduleId}/${file}`, path: join(dir, file) })
    }
  }

  // Core first: a module may reference users.id, and nothing in core may
  // reference a module.
  return [...core, ...fromModules]
}

async function main() {
  const sql = postgres(DATABASE_URL!, { max: 1, prepare: false, onnotice: () => {} })

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS __migrations (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `

    const migrations = await collectMigrations()

    if (migrations.length === 0) {
      console.log('No migrations found')
      return
    }

    const applied = new Set(
      (await sql<{ name: string }[]>`SELECT name FROM __migrations`).map((row) => row.name),
    )

    let appliedCount = 0
    for (const migration of migrations) {
      if (applied.has(migration.name)) continue
      const content = await readFile(migration.path, 'utf8')
      const statements = content
        .split('--> statement-breakpoint')
        .map((s) => s.trim())
        .filter(Boolean)

      await sql.begin(async (tx) => {
        for (const stmt of statements) {
          await tx.unsafe(stmt)
        }
        await tx`INSERT INTO __migrations (name) VALUES (${migration.name})`
      })
      console.log(`  ↳ applied ${migration.name}`)
      appliedCount += 1
    }

    if (appliedCount === 0) {
      console.log('✅  Schema up to date')
    } else {
      console.log(`✅  Applied ${appliedCount} migration(s)`)
    }
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((err) => {
  console.error('❌  Migration failed:', err)
  process.exit(1)
})
