import { describe, expect, it } from 'vitest'
import {
  resolveDbAdminDataDir,
  resolveDbAdminDataFilePath,
} from '@/modules/database-admin/server/data-paths'

describe('resolveDbAdminDataDir', () => {
  it('returns a path that ends with src/modules/database-admin/data', () => {
    const dir = resolveDbAdminDataDir()
    expect(dir).toMatch(/src[/\\]modules[/\\]database-admin[/\\]data$/)
  })

  it('is rooted at process.cwd()', () => {
    const dir = resolveDbAdminDataDir()
    expect(dir.startsWith(process.cwd())).toBe(true)
  })
})

describe('resolveDbAdminDataFilePath', () => {
  it('resolves db-config-store.json correctly', () => {
    const p = resolveDbAdminDataFilePath('db-config-store.json')
    expect(p).toMatch(/db-config-store\.json$/)
    expect(p).toMatch(/database-admin[/\\]data[/\\]db-config-store\.json$/)
  })

  it('resolves db-audit-logs.json correctly', () => {
    const p = resolveDbAdminDataFilePath('db-audit-logs.json')
    expect(p).toMatch(/db-audit-logs\.json$/)
  })

  it('does not produce double slashes', () => {
    const p = resolveDbAdminDataFilePath('db-config-store.json')
    expect(p).not.toMatch(/\/\//)
    expect(p).not.toMatch(/\\\\/)
  })
})
