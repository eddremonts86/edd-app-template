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
