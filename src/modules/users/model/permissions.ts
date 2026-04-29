export type AppRoleKey = 'admin' | 'user'

/**
 * Template permission model — simplified to admin/user only.
 * Extend with app-specific roles in your derived app.
 */
export function getAppRoleKey(roleLike?: unknown): AppRoleKey {
  if (!roleLike || typeof roleLike !== 'object') return 'user'
  return (roleLike as { isAdmin?: boolean | null }).isAdmin ? 'admin' : 'user'
}

export function isAdminRole(roleKey: AppRoleKey): boolean {
  return roleKey === 'admin'
}
