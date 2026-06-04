/**
 * Translation fixer.
 *
 * For every key that exists in the English (source) locale but is missing in a
 * target locale, copies the English value as a placeholder so the app has a
 * functional fallback while translators fill in the real text.
 *
 * Usage:
 *   tsx scripts/i18n/fix-translations.ts
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const LOCALES_DIR = resolve('src/shared/lib/i18n/locales')
const SOURCE_LANG = 'en'
const TARGET_LANGS = ['es', 'dk']

type JsonValue = string | number | boolean | null | JsonObject | JsonArray
interface JsonObject {
  [key: string]: JsonValue
}
type JsonArray = JsonValue[]

function loadJson(filePath: string): JsonObject {
  return JSON.parse(readFileSync(filePath, 'utf-8')) as JsonObject
}

function saveJson(filePath: string, data: JsonObject) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8')
}

/**
 * Deep-merge `source` into `target`.
 * Only adds keys that are MISSING in target — never overwrites existing values.
 * Returns the number of keys that were added.
 */
function deepMerge(source: JsonObject, target: JsonObject, path = ''): number {
  let added = 0
  for (const key of Object.keys(source)) {
    const currentPath = path ? `${path}.${key}` : key
    const srcVal = source[key]
    const tgtVal = target[key]

    if (tgtVal === undefined) {
      // Key completely missing — copy whole subtree from source
      target[key] = structuredClone(srcVal)
      const leafCount = countLeaves(srcVal)
      added += leafCount
      console.log(`  + ${currentPath} (${leafCount} key${leafCount > 1 ? 's' : ''})`)
    } else if (
      typeof srcVal === 'object' &&
      srcVal !== null &&
      !Array.isArray(srcVal) &&
      typeof tgtVal === 'object' &&
      tgtVal !== null &&
      !Array.isArray(tgtVal)
    ) {
      // Both are objects — recurse
      added += deepMerge(srcVal as JsonObject, tgtVal as JsonObject, currentPath)
    }
    // If target has a value and source also has a scalar, keep target as-is
  }
  return added
}

function countLeaves(val: JsonValue): number {
  if (typeof val !== 'object' || val === null || Array.isArray(val)) return 1
  return Object.values(val as JsonObject).reduce((sum: number, v) => sum + countLeaves(v), 0)
}

function getNamespaces(): string[] {
  return readdirSync(join(LOCALES_DIR, SOURCE_LANG)).filter((f) => f.endsWith('.json'))
}

function main() {
  const namespaces = getNamespaces()
  let totalAdded = 0

  console.log(`\n🔧  Translation fixer — ${SOURCE_LANG} → ${TARGET_LANGS.join(', ')}\n`)

  for (const namespace of namespaces) {
    const sourcePath = join(LOCALES_DIR, SOURCE_LANG, namespace)
    const sourceData = loadJson(sourcePath)

    for (const lang of TARGET_LANGS) {
      const targetPath = join(LOCALES_DIR, lang, namespace)

      let targetData: JsonObject
      try {
        targetData = loadJson(targetPath)
      } catch {
        console.warn(`  ⚠️  ${lang}/${namespace} not found — skipping`)
        continue
      }

      console.log(`\n  📄  ${lang}/${namespace}`)
      const added = deepMerge(sourceData, targetData, '')

      if (added > 0) {
        saveJson(targetPath, targetData)
        console.log(`  ✅  Saved ${added} new key(s)`)
        totalAdded += added
      } else {
        console.log(`  ✅  Already complete`)
      }
    }
  }

  console.log(`\n${'─'.repeat(52)}`)
  console.log(`Added ${totalAdded} placeholder key(s) across all target locales.`)
  console.log(`Run pnpm i18n:check to verify.\n`)
}

main()
