/**
 * Translation completeness checker.
 *
 * Validates that every key present in the English (source) locale files
 * also exists in Spanish (es) and Danish (dk), and that every literal
 * `t('some.key')` in src/ actually resolves to a string in the source
 * catalogue.
 *
 * Keys built from a template literal — `t(`billing.error.${code}`)` — are
 * checked too, as far as a static reader honestly can: see `checkDynamicUsage`.
 * They were invisible here until a deleted key passed this gate in all three
 * languages while the UI rendered the raw key.
 *
 * Usage:
 *   tsx scripts/i18n/check-translations.ts
 *   pnpm i18n:check
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const LOCALES_DIR = resolve('src/shared/lib/i18n/locales')
const SRC_DIR = resolve('src')
const SOURCE_LANG = 'en'
const TARGET_LANGS = ['es', 'dk']

type JsonNode = string | number | boolean | null | JsonObject | JsonArray
interface JsonObject {
  [key: string]: JsonNode
}
type JsonArray = JsonNode[]

/**
 * Recursively collect all dot-notation keys from a JSON object.
 */
function collectKeys(obj: JsonNode, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return [prefix]
  }
  return Object.entries(obj as JsonObject).flatMap(([key, value]) =>
    collectKeys(value, prefix ? `${prefix}.${key}` : key),
  )
}

function loadJson(filePath: string): JsonObject {
  const raw = readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as JsonObject
}

const MODULES_DIR = resolve('src/modules')

/**
 * Translations that ship inside a module rather than in the shared catalogue,
 * merged under the module id exactly as i18n.ts merges them at runtime
 * (docs/architecture/integration-conventions.md §7).
 *
 * Without this the checker reports every module key as missing, because the
 * catalogue it reads is only half the catalogue the app builds.
 */
function loadModuleCatalogue(lang: string): JsonObject {
  const merged: JsonObject = {}

  for (const moduleId of readdirSync(MODULES_DIR)) {
    const file = join(MODULES_DIR, moduleId, 'i18n', `${lang}.json`)
    try {
      merged[moduleId] = loadJson(file)
    } catch {
      // A module without its own translations is the normal case.
    }
  }

  return merged
}

/** The shared namespace plus every module's, the way the app sees it. */
function loadCatalogue(lang: string, namespace: string): JsonObject {
  const shared = loadJson(join(LOCALES_DIR, lang, namespace))
  return namespace === 'common.json' ? { ...shared, ...loadModuleCatalogue(lang) } : shared
}

function getNamespaces(): string[] {
  return readdirSync(join(LOCALES_DIR, SOURCE_LANG)).filter((f) => f.endsWith('.json'))
}

/**
 * Resolve a dot-notation key against a loaded namespace. Numeric segments index
 * into arrays, the way i18next itself resolves `some.list.0`.
 */
function resolveKey(data: JsonObject, key: string): JsonNode | undefined {
  return key.split('.').reduce<JsonNode | undefined>((node, segment) => {
    if (typeof node !== 'object' || node === null) return undefined
    if (Array.isArray(node)) {
      const index = Number(segment)
      return Number.isInteger(index) ? node[index] : undefined
    }
    return (node as JsonObject)[segment]
  }, data)
}

function collectSourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return full === LOCALES_DIR ? [] : collectSourceFiles(full)
    return /\.tsx?$/.test(entry.name) ? [full] : []
  })
}

/**
 * A `t()` call whose key is assembled at runtime.
 *
 * `home.manifesto.items.${id}.title` gives a prefix (`home.manifesto.items`),
 * one hole, and a suffix (`title`). What is knowable without running the app is
 * the *shape* around the hole, and that turns out to be most of the value: a
 * renamed group, or one entry in a group missing the field every sibling has.
 */
export interface DynamicKey {
  template: string
  /** Static path before the first hole, or '' when nothing useful precedes it. */
  prefix: string
  /** Static path after the last hole, or '' when the key ends at the hole. */
  suffix: string
  holes: number
  file: string
  /** The call text, to spot `returnObjects` the way the literal check does. */
  call: string
}

const HOLE = /\$\{[^{}]*\}/g

/**
 * Split a template into its static parts.
 *
 * Returns undefined when nothing can be said. A hole that opens mid-segment
 * (`status_${code}`) leaves no path to resolve, and neither does a key that
 * starts with one (`${namespace}.title`) — reporting on those would mean
 * guessing, and a checker that guesses gets switched off.
 */
export function parseDynamicKey(
  template: string,
  file: string,
  call: string,
): DynamicKey | undefined {
  const holes = template.match(HOLE)?.length ?? 0
  if (holes === 0) return undefined

  const parts = template.split(HOLE)
  const head = parts[0] ?? ''
  const tail = parts[parts.length - 1] ?? ''
  const prefix = head.endsWith('.') ? head.slice(0, -1) : ''
  if (!prefix) return undefined

  return {
    template,
    prefix,
    suffix: tail.startsWith('.') ? tail.slice(1) : '',
    holes,
    file,
    call,
  }
}

function isGroup(value: JsonNode | undefined): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * What a static reader can prove about a runtime-built key.
 *
 * 1. The group the hole indexes into exists, and has entries. A renamed or
 *    deleted group is the failure that reaches the screen as a raw key.
 * 2. With one hole and a suffix, every entry in the group carries that suffix.
 *    Four items with `.title` and a fifth without is a real bug and a common
 *    one, since entries are added by copying a sibling.
 * 3. With one hole and no suffix, every entry is a leaf. An entry that is a
 *    group renders i18next's error string where a sentence belongs.
 *
 * What it cannot prove: that the group covers every value the variable can
 * take. That needs the type the variable came from, which is not in these
 * files — so it stays a test next to the code that owns the union.
 */
export function checkDynamicUsage(catalogues: JsonObject[], keys: DynamicKey[]): number {
  const problems: string[] = []

  const resolve = (path: string): JsonNode | undefined =>
    catalogues.map((catalogue) => resolveKey(catalogue, path)).find((found) => found !== undefined)

  for (const key of keys) {
    const group = resolve(key.prefix)

    if (group === undefined) {
      problems.push(
        `  ❌  ${key.template}\n       ${key.prefix} — no such group\n       ${key.file}`,
      )
      continue
    }
    if (!isGroup(group)) {
      problems.push(
        `  ❌  ${key.template}\n       ${key.prefix} — not a group, so no key can be built from it\n       ${key.file}`,
      )
      continue
    }

    const entries = Object.keys(group)
    if (entries.length === 0) {
      problems.push(
        `  ❌  ${key.template}\n       ${key.prefix} — group is empty\n       ${key.file}`,
      )
      continue
    }

    // More than one hole and the path between them is unknown, so the entries
    // cannot be walked. The group check above still applied.
    if (key.holes > 1) continue

    const wantsObject = key.call.includes('returnObjects')
    let candidates = 0

    for (const entry of entries) {
      // A group can hold more than the hole's values. `home.opening.arc` keeps
      // three stops beside an `ariaLabel` string; demanding `.label` of that
      // string reported a bug that was not there. With a suffix, only a group
      // can be one of the hole's values, so only groups are judged.
      if (key.suffix && !isGroup(resolve(`${key.prefix}.${entry}`))) continue
      candidates += 1

      const path = key.suffix ? `${key.prefix}.${entry}.${key.suffix}` : `${key.prefix}.${entry}`
      const value = resolve(path)

      if (value === undefined) {
        problems.push(
          `  ❌  ${key.template}\n       ${path} — missing, but every sibling has it\n       ${key.file}`,
        )
      } else if (isGroup(value) && !wantsObject) {
        problems.push(
          `  ❌  ${key.template}\n       ${path} — resolves to a group, used as a string\n       ${key.file}`,
        )
      }
    }

    // Nothing in the group has the shape the call site reads, so either the
    // prefix or the suffix is wrong and every lookup renders a raw key.
    if (candidates === 0) {
      problems.push(
        `  ❌  ${key.template}\n       ${key.prefix} — no entry has \`${key.suffix}\`\n       ${key.file}`,
      )
    }
  }

  console.log(`\n🧩  Dynamic key check — ${keys.length} template key(s) in ${SOURCE_LANG}\n`)

  for (const problem of problems) console.error(problem)
  if (problems.length === 0) {
    console.log(`  ✅  every t(\`…\${…}\`) group exists and its entries are complete`)
  }

  return problems.length
}

/**
 * Check every literal `t('some.key')` in src/ against the source catalogue.
 *
 * Two failures reach the user as visible garbage and are errors:
 *   - the key is absent and the call has no inline default → i18next renders
 *     the raw key ("common.refresh")
 *   - the key resolves to an object and was not requested with
 *     `returnObjects` → i18next renders an error string
 *
 * A key that is absent but has an inline default does not break the UI, but it
 * silently ships English to es/dk readers — which is how 65 of them accumulated
 * unnoticed. It counts as an error too: add the key to all three locales.
 *
 * Returns the number of errors found.
 */
function checkUsage(catalogues: JsonObject[]): { errors: number; dynamic: DynamicKey[] } {
  const rawKeys: Array<[string, string]> = []
  const objectKeys: Array<[string, string]> = []
  const untranslated = new Set<string>()
  const dynamic: DynamicKey[] = []

  for (const file of collectSourceFiles(SRC_DIR)) {
    const source = readFileSync(file, 'utf-8')

    // Same pass, because src/ is already in hand here.
    for (const match of source.matchAll(/\bt\(\s*`([^`]*)`/g)) {
      const parsed = parseDynamicKey(match[1]!, file, source.slice(match.index, match.index + 200))
      if (parsed) dynamic.push(parsed)
    }

    for (const match of source.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'\s*(,?)/g)) {
      const [, key, comma] = match
      // Only dotted keys are catalogue lookups; bare identifiers are other t()s.
      if (!key.includes('.')) continue

      const value = catalogues
        .map((catalogue) => resolveKey(catalogue, key))
        .find((found) => found !== undefined)

      if (value === undefined) {
        if (comma) untranslated.add(key)
        else rawKeys.push([key, file])
        continue
      }

      if (typeof value === 'object' && value !== null) {
        const call = source.slice(match.index, match.index + 200)
        if (!call.includes('returnObjects')) objectKeys.push([key, file])
      }
    }
  }

  console.log(`\n🔑  Key usage check — ${SOURCE_LANG} catalogue\n`)

  for (const [key, file] of rawKeys) {
    console.error(`  ❌  ${key} — missing, no default: renders the raw key`)
    console.error(`       ${file}`)
  }
  for (const [key, file] of objectKeys) {
    console.error(`  ❌  ${key} — resolves to an object, used as a string`)
    console.error(`       ${file}`)
  }
  for (const key of untranslated) {
    console.error(`  ❌  ${key} — missing, inline default only: es/dk readers see English`)
  }
  if (rawKeys.length === 0 && objectKeys.length === 0 && untranslated.size === 0) {
    console.log(`  ✅  every t('…') key resolves to a translated string`)
  }

  return { errors: rawKeys.length + objectKeys.length + untranslated.size, dynamic }
}

function main() {
  let totalMissing = 0
  const namespaces = getNamespaces()
  const sourceCatalogues: JsonObject[] = []

  console.log(
    `\n🌐  Translation check — source: ${SOURCE_LANG} → targets: ${TARGET_LANGS.join(', ')}\n`,
  )

  for (const namespace of namespaces) {
    const sourceData = loadCatalogue(SOURCE_LANG, namespace)
    sourceCatalogues.push(sourceData)
    const sourceKeys = new Set(collectKeys(sourceData))

    for (const lang of TARGET_LANGS) {
      let targetData: JsonObject
      try {
        targetData = loadCatalogue(lang, namespace)
      } catch {
        console.error(`  ❌  ${lang}/${namespace} — FILE MISSING`)
        totalMissing += sourceKeys.size
        continue
      }

      const targetKeys = new Set(collectKeys(targetData))
      const missing = [...sourceKeys].filter((k) => !targetKeys.has(k))
      const extra = [...targetKeys].filter((k) => !sourceKeys.has(k))

      if (missing.length === 0 && extra.length === 0) {
        console.log(`  ✅  ${lang}/${namespace}`)
      } else {
        if (missing.length > 0) {
          console.error(`  ❌  ${lang}/${namespace} — ${missing.length} missing key(s):`)
          for (const key of missing) {
            console.error(`       • ${key}`)
          }
          totalMissing += missing.length
        }
        if (extra.length > 0) {
          console.warn(
            `  ⚠️   ${lang}/${namespace} — ${extra.length} extra key(s) (not in ${SOURCE_LANG}):`,
          )
          for (const key of extra) {
            console.warn(`       + ${key}`)
          }
        }
      }
    }
  }

  const usage = checkUsage(sourceCatalogues)
  const usageErrors = usage.errors + checkDynamicUsage(sourceCatalogues, usage.dynamic)

  console.log(`\n${'─'.repeat(52)}`)
  console.log(`Checked ${namespaces.length} namespace(s) × ${TARGET_LANGS.length} target lang(s)`)

  if (totalMissing > 0) {
    console.error(
      `\n💥  ${totalMissing} missing translation key(s) found — fix them before merging.\n`,
    )
  }
  if (usageErrors > 0) {
    console.error(`\n💥  ${usageErrors} broken t('…') key(s) found — fix them before merging.\n`)
  }
  if (totalMissing > 0 || usageErrors > 0) {
    process.exit(1)
  }

  console.log(`\n✨  All translations are complete.\n`)
}

/**
 * Exported above so the dynamic-key rules can be tested against fixtures; a
 * checker nobody has watched fail is not a checker. Only run the real scan when
 * this file is the entry point, not when a test imports it.
 */
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
