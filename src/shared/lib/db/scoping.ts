import { eq } from 'drizzle-orm'
import type { AppRoleKey } from '@/modules/users/model/permissions'

interface OwnerScopedRow {
  ownerUserId: string | null
}

interface OwnerCheckContext {
  userId: string
  roleKey: AppRoleKey
}

type EqCompatibleColumn = Parameters<typeof eq>[0]

export function scopeByOwner(column: EqCompatibleColumn, userId: string) {
  return eq(column, userId)
}

export function requireOwnerOrAdmin(row: OwnerScopedRow, ctx: OwnerCheckContext): void {
  if (ctx.roleKey === 'admin' || ctx.roleKey === 'super_admin') return
  if (row.ownerUserId && row.ownerUserId === ctx.userId) return
  throw new Error('Forbidden')
}
