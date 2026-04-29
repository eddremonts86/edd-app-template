import * as React from 'react'
import type { AppRoleKey } from '../model/permissions'
import type { User } from '../model/types'

export interface UserContextValue {
  syncedUserId: string | null
  roleKey: AppRoleKey
  userRole: AppRoleKey
  user: User | null
  isReady: boolean
  isLoading: boolean
}

export const UserContext = React.createContext<UserContextValue | undefined>(undefined)
