import { z } from 'zod'

export const dbAuditActionSchema = z.enum([
  'profile.create',
  'profile.update',
  'profile.delete',
  'profile.activate',
  'profile.deactivate',
  'connection.test',
  'migration.dryrun',
  'migration.apply',
])
export type DbAuditAction = z.infer<typeof dbAuditActionSchema>

export const dbAuditEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  actorUserId: z.string().nullable(),
  actorEmail: z.string().nullable(),
  action: dbAuditActionSchema,
  profileId: z.string().nullable().optional(),
  result: z.enum(['ok', 'error']),
  message: z.string().nullable().optional(),
  // Redacted snapshots; passwords removed before reaching here.
  diff: z
    .object({
      before: z.record(z.string(), z.unknown()).optional(),
      after: z.record(z.string(), z.unknown()).optional(),
    })
    .nullable()
    .optional(),
})

export type DbAuditEntry = z.infer<typeof dbAuditEntrySchema>

export const dbAuditStoreSchema = z.object({
  version: z.literal(1),
  entries: z.array(dbAuditEntrySchema),
})

export type DbAuditStore = z.infer<typeof dbAuditStoreSchema>

export const EMPTY_DB_AUDIT_STORE: DbAuditStore = { version: 1, entries: [] }

export const MAX_AUDIT_ENTRIES = 500
