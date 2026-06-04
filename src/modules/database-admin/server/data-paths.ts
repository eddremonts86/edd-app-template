/**
 * Filesystem paths owned by the database-admin module.
 * Stored under `src/modules/database-admin/data/` so they coexist with
 * the AI module's data folder pattern.
 */
export type DbAdminDataFileName = 'db-config-store.json' | 'db-audit-logs.json'

const DB_DATA_DIR_SEGMENTS = ['src', 'modules', 'database-admin', 'data'] as const

function joinPath(basePath: string, ...segments: readonly string[]): string {
  const separator = basePath.includes('\\') ? '\\' : '/'
  const normalizedBase = basePath.replace(/[\\/]+$/, '')
  const normalizedSegments = segments.map((segment) => segment.replace(/^[\\/]+|[\\/]+$/g, ''))
  return [normalizedBase, ...normalizedSegments].join(separator)
}

export function resolveDbAdminDataDir(): string {
  return joinPath(process.cwd(), ...DB_DATA_DIR_SEGMENTS)
}

export function resolveDbAdminDataFilePath(fileName: DbAdminDataFileName): string {
  return joinPath(resolveDbAdminDataDir(), fileName)
}
