import { z } from 'zod'

export const migrationStatusSchema = z.object({
  file: z.string(),
  applied: z.boolean(),
  appliedAt: z.string().nullable(),
})

export type MigrationStatus = z.infer<typeof migrationStatusSchema>

export const migrationStatementResultSchema = z.object({
  index: z.number(),
  total: z.number(),
  sqlPreview: z.string(),
  ok: z.boolean(),
  error: z.string().nullable(),
  durationMs: z.number(),
})

export type MigrationStatementResult = z.infer<typeof migrationStatementResultSchema>

export const migrationFileReportSchema = z.object({
  file: z.string(),
  appliedNow: z.boolean(),
  statements: z.array(migrationStatementResultSchema),
  error: z.string().nullable(),
})

export type MigrationFileReport = z.infer<typeof migrationFileReportSchema>

export const migrationRunReportSchema = z.object({
  startedAt: z.string(),
  finishedAt: z.string(),
  dryRun: z.boolean(),
  appliedCount: z.number(),
  skippedCount: z.number(),
  files: z.array(migrationFileReportSchema),
  error: z.string().nullable(),
})

export type MigrationRunReport = z.infer<typeof migrationRunReportSchema>
