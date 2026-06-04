import { describe, expect, it } from 'vitest'
import {
  migrationFileReportSchema,
  migrationRunReportSchema,
  migrationStatementResultSchema,
  migrationStatusSchema,
} from '@/modules/database-admin/model/migration'

describe('migrationStatusSchema', () => {
  it('accepts a pending migration', () => {
    const r = migrationStatusSchema.safeParse({
      file: '0001_init.sql',
      applied: false,
      appliedAt: null,
    })
    expect(r.success).toBe(true)
  })

  it('accepts an applied migration', () => {
    const r = migrationStatusSchema.safeParse({
      file: '0001_init.sql',
      applied: true,
      appliedAt: '2024-01-01T00:00:00Z',
    })
    expect(r.success).toBe(true)
  })

  it('rejects missing file', () => {
    expect(migrationStatusSchema.safeParse({ applied: false, appliedAt: null }).success).toBe(false)
  })
})

describe('migrationStatementResultSchema', () => {
  const base = {
    index: 0,
    total: 3,
    sqlPreview: 'CREATE TABLE foo',
    ok: true,
    error: null,
    durationMs: 42,
  }

  it('accepts a successful statement', () => {
    expect(migrationStatementResultSchema.safeParse(base).success).toBe(true)
  })

  it('accepts a failed statement with error', () => {
    expect(
      migrationStatementResultSchema.safeParse({ ...base, ok: false, error: 'syntax error' })
        .success,
    ).toBe(true)
  })
})

describe('migrationFileReportSchema', () => {
  const base = {
    file: '0001_init.sql',
    appliedNow: true,
    statements: [
      { index: 0, total: 1, sqlPreview: 'CREATE TABLE t', ok: true, error: null, durationMs: 5 },
    ],
    error: null,
  }

  it('accepts a successful file report', () => {
    expect(migrationFileReportSchema.safeParse(base).success).toBe(true)
  })

  it('accepts an errored file report', () => {
    expect(
      migrationFileReportSchema.safeParse({ ...base, appliedNow: false, error: 'failed' }).success,
    ).toBe(true)
  })
})

describe('migrationRunReportSchema', () => {
  const base = {
    startedAt: '2024-01-01T00:00:00Z',
    finishedAt: '2024-01-01T00:00:01Z',
    dryRun: false,
    appliedCount: 1,
    skippedCount: 2,
    files: [],
    error: null,
  }

  it('accepts a valid run report', () => {
    expect(migrationRunReportSchema.safeParse(base).success).toBe(true)
  })

  it('accepts a dry-run report', () => {
    expect(
      migrationRunReportSchema.safeParse({ ...base, dryRun: true, appliedCount: 0 }).success,
    ).toBe(true)
  })

  it('accepts an errored run report', () => {
    expect(
      migrationRunReportSchema.safeParse({ ...base, error: 'connection failed' }).success,
    ).toBe(true)
  })
})
