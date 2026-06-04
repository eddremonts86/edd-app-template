export type AppRole = 'super_admin' | 'admin' | 'user'

export const ROLE_PERMISSION_MAP: Record<AppRole, readonly string[]> = {
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

/**
 * Permissions that are reserved for super_admin only (never granted to admin
 * even through the dynamic rolePermissions table). The database-admin
 * module relies on this for its destructive operations.
 */
export const SUPER_ADMIN_ONLY_PERMISSIONS = ['database.admin'] as const
export type SuperAdminOnlyPermission = (typeof SUPER_ADMIN_ONLY_PERMISSIONS)[number]

export function normalizeAppRole(roleLike: string | null | undefined): AppRole {
  if (roleLike === 'super_admin') return 'super_admin'
  if (roleLike === 'admin') return 'admin'
  return 'user'
}

export function hasPermissionForRole(
  roleLike: string | null | undefined,
  permission: string,
): boolean {
  const role = normalizeAppRole(roleLike)
  const granted = ROLE_PERMISSION_MAP[role]
  return granted.includes('*') || granted.includes(permission)
}
