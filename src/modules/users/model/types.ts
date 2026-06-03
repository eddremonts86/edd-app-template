/**
 * Template User type — extend with app-specific fields in your derived app.
 */
import type { AppRoleKey } from './permissions'

export interface User {
  id: string
  name: string
  email: string
  avatar: string | null
  authUserId?: string | null
  provider?: 'better-auth' | 'clerk' | 'local'
  roleKey?: AppRoleKey
  createdAt: string
  updatedAt?: string
}
