import { and, eq } from 'drizzle-orm'
import { getCurrentAppUser, requireCurrentAppUser } from '@/modules/users/api/current-user.server'
import { loadDb } from '@/shared/lib/db/load'
import { resourceRoles, rolePermissions, users } from '@/shared/lib/db/schema'
import { requireAuthUser } from './server'

const LEGACY_ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'],
  admin: [
    'contact_messages.read',
    'contact_messages.update',
    'contact_messages.delete',
    'users.read',
    'users.create',
    'users.update',
    'site_settings.read',
    'site_settings.update',
  ],
  user: ['contact_messages.read'],
}

function hasLegacyPermission(role: string | null | undefined, permission: string): boolean {
  if (!role) return false
  const granted = LEGACY_ROLE_PERMISSIONS[role] ?? []
  return granted.includes('*') || granted.includes(permission)
}

async function hasAnyRolePermissionRows(): Promise<boolean> {
  const db = await loadDb()
  const [row] = await db.select({ role: rolePermissions.role }).from(rolePermissions).limit(1)
  return Boolean(row)
}

export async function can(userId: string, permission: string): Promise<boolean> {
  const db = await loadDb()

  const [userRow] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
  if (!userRow) return false
  if (userRow.role === 'super_admin') return true

  const [directGrant] = await db
    .select({ role: rolePermissions.role })
    .from(rolePermissions)
    .where(
      and(eq(rolePermissions.role, userRow.role), eq(rolePermissions.permissionId, permission)),
    )
    .limit(1)

  if (directGrant) return true

  const hasRows = await hasAnyRolePermissionRows()
  if (!hasRows) return hasLegacyPermission(userRow.role, permission)

  return false
}

export async function canOnResource(
  userId: string,
  permission: string,
  resourceType: string,
  resourceId: string,
): Promise<boolean> {
  if (await can(userId, permission)) return true

  const db = await loadDb()
  const [resourceGrant] = await db
    .select({ role: resourceRoles.role })
    .from(resourceRoles)
    .innerJoin(rolePermissions, eq(rolePermissions.role, resourceRoles.role))
    .where(
      and(
        eq(resourceRoles.userId, userId),
        eq(resourceRoles.resourceType, resourceType),
        eq(resourceRoles.resourceId, resourceId),
        eq(rolePermissions.permissionId, permission),
      ),
    )
    .limit(1)

  return Boolean(resourceGrant)
}

export async function requirePermission(context: unknown, permission: string): Promise<void> {
  const authUser = await requireAuthUser()
  if (authUser.provider === 'bypass') return

  const contextUserId =
    typeof context === 'object' && context !== null && 'user' in context
      ? (() => {
          const user = (context as { user?: { userId?: string | null } }).user
          return user?.userId ?? null
        })()
      : null

  const appUser = contextUserId ? await getCurrentAppUser() : await requireCurrentAppUser()
  const userId = contextUserId ?? appUser?.id ?? null
  if (!userId) throw new Error('Unauthorized')

  const allowed = await can(userId, permission)
  if (!allowed) throw new Error('Forbidden')
}
