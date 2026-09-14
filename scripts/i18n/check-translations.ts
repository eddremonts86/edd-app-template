/**
 * Translation completeness checker.
 *
 * Validates that every key present in the English (source) locale files
 * also exists in Spanish (es) and Danish (dk), and that every literal
 * `t('some.key')` in src/ actually resolves to a string in the source
 * catalogue.
 *
 * Usage:
 *   tsx scripts/i18n/check-translations.ts
 *   pnpm i18n:check
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

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
function checkUsage(catalogues: JsonObject[]): number {
  const rawKeys: Array<[string, string]> = []
  const objectKeys: Array<[string, string]> = []
  const untranslated = new Set<string>()

  for (const file of collectSourceFiles(SRC_DIR)) {
    const source = readFileSync(file, 'utf-8')
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

  return rawKeys.length + objectKeys.length + untranslated.size
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

  const usageErrors = checkUsage(sourceCatalogues)

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

main()
