import { getEnabledModules } from './registry'

/**
 * Which enabled modules have the configuration they need.
 *
 * Server-only by construction: it reads `process.env`, and the keys it reads are
 * secrets. The result is a plain `Record<moduleId, boolean>` and nothing else —
 * a boolean cannot leak which of four credentials is missing, and that detail
 * belongs in the server log rather than in a page someone can load
 * (docs/architecture/integration-conventions.md §4.2).
 */
export function resolveCapabilities(): Record<string, boolean> {
  const env = process.env
  const result: Record<string, boolean> = {}

  for (const module of getEnabledModules()) {
    const required = module.capability?.requires
    // A module with no third-party dependency is always configured.
    result[module.id] = !required?.length || required.every((key) => isSet(env[key]))
  }

  return result
}

/**
 * Blank counts as absent. A `.env` line with nothing after the `=` is the most
 * common way a key goes missing, and it is indistinguishable from a typo to
 * everyone except a check that looks for it.
 */
export function isSet(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}
