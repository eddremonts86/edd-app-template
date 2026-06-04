import { randomUUID } from 'node:crypto'
import fsp from 'node:fs/promises'
import {
  EMPTY_DB_AUDIT_STORE,
  MAX_AUDIT_ENTRIES,
  dbAuditStoreSchema,
  type DbAuditEntry,
  type DbAuditStore,
} from '../model/audit'
import { resolveDbAdminDataDir, resolveDbAdminDataFilePath } from './data-paths'

const AUDIT_FILE = 'db-audit-logs.json'

function getAuditPath(): string {
  return resolveDbAdminDataFilePath(AUDIT_FILE)
}

export async function readAuditStore(): Promise<DbAuditStore> {
  try {
    const content = await fsp.readFile(getAuditPath(), 'utf-8')
    const trimmed = content.trim()
    if (!trimmed) return EMPTY_DB_AUDIT_STORE
    const parsed = JSON.parse(trimmed)
    const result = dbAuditStoreSchema.safeParse(parsed)
    return result.success ? result.data : EMPTY_DB_AUDIT_STORE
  } catch {
    return EMPTY_DB_AUDIT_STORE
  }
}

async function writeAuditStore(store: DbAuditStore): Promise<void> {
  const dir = resolveDbAdminDataDir()
  const targetPath = getAuditPath()
  const uniqueSuffix = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const tempPath = `${targetPath}.${uniqueSuffix}.tmp`
  await fsp.mkdir(dir, { recursive: true })
  await fsp.writeFile(tempPath, JSON.stringify(store, null, 2))
  await fsp.rename(tempPath, targetPath)
}

export async function appendAuditEntry(
  entry: Omit<DbAuditEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: string },
): Promise<DbAuditEntry> {
  const store = await readAuditStore()
  const fullEntry: DbAuditEntry = {
    id: entry.id ?? randomUUID(),
    timestamp: entry.timestamp ?? new Date().toISOString(),
    actorUserId: entry.actorUserId,
    actorEmail: entry.actorEmail,
    action: entry.action,
    profileId: entry.profileId ?? null,
    result: entry.result,
    message: entry.message ?? null,
    diff: entry.diff ?? null,
  }
  const nextEntries = [fullEntry, ...store.entries].slice(0, MAX_AUDIT_ENTRIES)
  await writeAuditStore({ version: 1, entries: nextEntries })
  return fullEntry
}
