/**
 * migrate.ts — Apply Drizzle SQL migrations from ./drizzle/*.sql
 *
 * Bypasses drizzle-kit CLI (silent failures) and drizzle-orm's migrator
 * (requires drizzle/meta/_journal.json — not present in this template).
 * Applies *.sql files in lexical order, tracked in `__migrations`.
 *
 * Usage: pnpm db:migrate — idempotent, applied migrations are skipped.
 */
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌  DATABASE_URL is not set. Check your .env file.')
  process.exit(1)
}

const MIGRATIONS_DIR = join(process.cwd(), 'drizzle')

async function main() {
  const sql = postgres(DATABASE_URL!, { max: 1, prepare: false, onnotice: () => {} })

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS __migrations (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `

    const entries = await readdir(MIGRATIONS_DIR)
    const files = entries.filter((f) => f.endsWith('.sql')).sort()

    if (files.length === 0) {
      console.log('No migrations found in ./drizzle')
      return
    }

    const applied = new Set(
      (await sql<{ name: string }[]>`SELECT name FROM __migrations`).map((row) => row.name),
    )

    let appliedCount = 0
    for (const file of files) {
      if (applied.has(file)) continue
      const content = await readFile(join(MIGRATIONS_DIR, file), 'utf8')
      const statements = content
        .split('--> statement-breakpoint')
        .map((s) => s.trim())
        .filter(Boolean)

      await sql.begin(async (tx) => {
        for (const stmt of statements) {
          await tx.unsafe(stmt)
        }
        await tx`INSERT INTO __migrations (name) VALUES (${file})`
      })
      console.log(`  ↳ applied ${file}`)
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
