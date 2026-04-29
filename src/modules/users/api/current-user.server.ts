import { eq } from 'drizzle-orm'
import { requireAuthUser } from '@/shared/lib/auth/server'
import { loadDb } from '@/shared/lib/db/load'
import { users } from '@/shared/lib/db/schema'
import { getAppRoleKey, type AppRoleKey } from '../model/permissions'

export interface CurrentAppUser {
  id: string
  name: string
  email: string
  avatar: string | null
  authUserId: string | null
  roleKey: AppRoleKey
}

export async function getCurrentAppUser(): Promise<CurrentAppUser | null> {
  const authUser = await requireAuthUser()

  if (authUser.provider === 'bypass') {
    return {
      id: authUser.userId,
      name: authUser.name ?? 'Local Test User',
      email: authUser.email ?? 'local-test@example.com',
      avatar: null,
      authUserId: authUser.userId,
      roleKey: 'admin',
    }
  }

  const db = await loadDb()

  const findByAuthUserId = async () => {
    const [record] = await db
      .select()
      .from(users)
      .where(eq(users.authUserId, authUser.userId))
      .limit(1)
    return record ?? null
  }

  const findByEmail = async () => {
    if (!authUser.email) return null
    const [record] = await db
      .select()
      .from(users)
      .where(eq(users.email, authUser.email))
      .limit(1)
    return record ?? null
  }

  const record = (await findByAuthUserId()) ?? (await findByEmail())

  if (!record) return null

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    avatar: record.avatar,
    authUserId: record.authUserId,
    roleKey: getAppRoleKey(null), // Extend with app-specific role logic
  }
}

export async function requireCurrentAppUser() {
  const appUser = await getCurrentAppUser()
  if (!appUser) throw new Error('Unauthorized')
  return appUser
}
