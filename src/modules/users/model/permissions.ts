export type AppRoleKey = 'super_admin' | 'admin' | 'user'

/**
 * Role hierarchy (higher rank = more privileges):
 *   user (0) < admin (1) < super_admin (2)
 *
 * - `user`: regular member, cannot manage other users
 * - `admin`: can manage users and change roles between admin/user
 * - `super_admin`: full system access, can also assign/revoke super_admin
 *
 * Only super_admin can assign super_admin to others. Admins cannot
 * elevate themselves or others to super_admin.
 */
const ROLE_RANK: Record<AppRoleKey, number> = {
  user: 0,
  admin: 1,
  super_admin: 2,
}

export function normalizeRoleKey(roleLike?: string | null): AppRoleKey {
  if (roleLike === 'super_admin') return 'super_admin'
  if (roleLike === 'admin') return 'admin'
  return 'user'
}

/**
 * Accepts either a raw string role or an object with `role` / `isAdmin` shape
 * (kept for compatibility with the existing UserProvider).
 */
export function getAppRoleKey(roleLike?: unknown): AppRoleKey {
  if (typeof roleLike === 'string') return normalizeRoleKey(roleLike)
  if (!roleLike || typeof roleLike !== 'object') return 'user'
  const obj = roleLike as {
    roleKey?: string | null
    role?: string | null
    isAdmin?: boolean | null
  }
  if (typeof obj.roleKey === 'string') return normalizeRoleKey(obj.roleKey)
  if (typeof obj.role === 'string') return normalizeRoleKey(obj.role)
  return obj.isAdmin ? 'admin' : 'user'
}

export function isAdminRole(roleKey: AppRoleKey): boolean {
  return roleKey === 'admin' || roleKey === 'super_admin'
}

export function isSuperAdminRole(roleKey: AppRoleKey): boolean {
  return roleKey === 'super_admin'
}

/** Can the actor manage (create/edit/delete) other users? */
export function canManageUsers(actor: AppRoleKey): boolean {
  return isAdminRole(actor)
}

/** Can the actor change `target`'s role to `nextRole`? */
export function canAssignRole(
  actor: AppRoleKey,
  target: AppRoleKey,
  nextRole: AppRoleKey,
): boolean {
  if (!isAdminRole(actor)) return false
  // Only super_admin can grant/revoke super_admin (on self or others)
  if (nextRole === 'super_admin' || target === 'super_admin') {
    return actor === 'super_admin'
  }
  return true
}

/** Can the actor delete this target user? */
export function canDeleteUser(actor: AppRoleKey, target: AppRoleKey): boolean {
  if (!isAdminRole(actor)) return false
  if (target === 'super_admin') return actor === 'super_admin'
  return true
}

export function roleRank(roleKey: AppRoleKey): number {
  return ROLE_RANK[roleKey]
}
