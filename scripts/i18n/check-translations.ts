/**
 * Translation completeness checker.
 *
 * Validates that every key present in the English (source) locale files
 * also exists in Spanish (es) and Danish (dk).
 *
 * Usage:
 *   tsx scripts/i18n/check-translations.ts
 *   pnpm i18n:check
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

const LOCALES_DIR = resolve('src/shared/lib/i18n/locales')
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

function getNamespaces(): string[] {
  return readdirSync(join(LOCALES_DIR, SOURCE_LANG)).filter((f) => f.endsWith('.json'))
}

function main() {
  let totalMissing = 0
  const namespaces = getNamespaces()

  console.log(
    `\n🌐  Translation check — source: ${SOURCE_LANG} → targets: ${TARGET_LANGS.join(', ')}\n`,
  )

  for (const namespace of namespaces) {
    const sourcePath = join(LOCALES_DIR, SOURCE_LANG, namespace)
    const sourceData = loadJson(sourcePath)
    const sourceKeys = new Set(collectKeys(sourceData))

    for (const lang of TARGET_LANGS) {
      const targetPath = join(LOCALES_DIR, lang, namespace)

      let targetData: JsonObject
      try {
        targetData = loadJson(targetPath)
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

  console.log(`\n${'─'.repeat(52)}`)
  console.log(`Checked ${namespaces.length} namespace(s) × ${TARGET_LANGS.length} target lang(s)`)

  if (totalMissing > 0) {
    console.error(
      `\n💥  ${totalMissing} missing translation key(s) found — fix them before merging.\n`,
    )
    process.exit(1)
  } else {
    console.log(`\n✨  All translations are complete.\n`)
  }
}

main()
