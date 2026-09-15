/**
 * check-env.ts — `.env.example` is the contract; this makes it true.
 *
 * Two apps in this workspace read `RESEND_API_KEY` in code and never list it in
 * `.env.example`, so a fresh clone boots with email silently off and nothing
 * says so. That is the class of bug this catches
 * (docs/architecture/integration-conventions.md §5.4).
 *
 * Three rules:
 *   1. Every key read as `process.env.X` in src/ is documented.
 *   2. Every `capability.requires` entry in a manifest is documented.
 *   3. No `VITE_`-prefixed twin exists for a documented server-only secret —
 *      that prefix compiles the value into the client bundle.
 *
 * Usage: pnpm env:check
 */
import { readFile, readdir } from 'node:fs/promises'
import { join, relative } from 'node:path'

const ROOT = process.cwd()
const SRC = join(ROOT, 'src')

/** Names that are never app configuration. */
const IGNORED = new Set(['NODE_ENV', 'PORT', 'TZ', 'CI', 'VITEST', 'npm_package_version'])

/** A documented key whose value is a secret: a VITE_ twin would leak it. */
const SECRET_PATTERN = /(_KEY|_SECRET|_TOKEN|_PASSWORD|DATABASE_URL)$/

async function walk(dir: string): Promise<string[]> {
  const out: string[] = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(full)))
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full)
  }
  return out
}

async function documentedKeys(): Promise<Set<string>> {
  const raw = await readFile(join(ROOT, '.env.example'), 'utf8')
  return new Set(
    raw.split('\n').flatMap((line) => line.match(/^([A-Z][A-Z0-9_]*)=/)?.slice(1, 2) ?? []),
  )
}

async function main() {
  const documented = await documentedKeys()
  const files = await walk(SRC)
  const problems: string[] = []

  // 1 — read in code, absent from .env.example
  const readInCode = new Map<string, string>()
  for (const file of files) {
    const source = await readFile(file, 'utf8')
    for (const match of source.matchAll(
      /process\.env(?:\.([A-Z][A-Z0-9_]*)|\[['"]([A-Z][A-Z0-9_]*)['"]\])/g,
    )) {
      const key = match[1] ?? match[2]
      if (key && !IGNORED.has(key) && !readInCode.has(key)) {
        readInCode.set(key, relative(ROOT, file))
      }
    }
  }
  for (const [key, file] of readInCode) {
    if (!documented.has(key)) {
      problems.push(`${key} is read in ${file} but missing from .env.example`)
    }
  }

  // 2 — declared by a manifest, absent from .env.example
  for (const file of files.filter((f) => f.endsWith('manifest.ts'))) {
    const source = await readFile(file, 'utf8')
    const block = source.match(/requires:\s*\[([^\]]*)\]/)?.[1]
    if (!block) continue
    for (const match of block.matchAll(/['"]([A-Z][A-Z0-9_]*)['"]/g)) {
      if (!documented.has(match[1]!)) {
        problems.push(
          `${match[1]} is required by ${relative(ROOT, file)} but missing from .env.example`,
        )
      }
    }
  }

  // 3 — a VITE_ twin of a secret compiles it into the client bundle
  for (const key of documented) {
    if (SECRET_PATTERN.test(key) && !key.startsWith('VITE_') && documented.has(`VITE_${key}`)) {
      problems.push(`VITE_${key} is documented — that prefix ships the secret to the browser`)
    }
  }

  console.log('\n🔑  Environment check — .env.example as the contract\n')

  if (problems.length > 0) {
    for (const problem of problems) console.log(`  ❌  ${problem}`)
    console.log(`\n💥  ${problems.length} problem(s). Fix .env.example before merging.\n`)
    process.exit(1)
  }

  console.log(`  ✅  ${readInCode.size} key(s) read in code, all documented`)
  console.log(`  ✅  no VITE_ twin of a server-only secret\n`)
}

main().catch((error) => {
  console.error('❌  env:check failed:', error)
  process.exit(1)
})
