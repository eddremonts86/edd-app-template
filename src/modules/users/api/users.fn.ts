import { createServerFn } from '@tanstack/react-start'
import { hashPassword } from 'better-auth/crypto'
import { and, count, desc, eq, ilike, or } from 'drizzle-orm'
import { z } from 'zod'
import { requireAuthUser } from '@/shared/lib/auth/server'
import { loadDb } from '@/shared/lib/db/load'
import { authAccounts, authUsers, users } from '@/shared/lib/db/schema'
import {
  canAssignRole,
  canDeleteUser,
  canManageUsers,
  normalizeRoleKey,
  type AppRoleKey,
} from '../model/permissions'
import type { User as UserType } from '../model/types'
import { getCurrentAppUser } from './current-user.server'

const ADMIN_FALLBACK_IDENTIFIERS = ['edd_admin', 'edd_remonts']

type UserProvider = NonNullable<UserType['provider']>
const toProvider = (value: string | null | undefined): UserProvider =>
  (value as UserProvider) ?? 'local'

function hasAdminFallbackIdentifier(values: Array<string | null | undefined>): boolean {
  const normalized = values
    .filter((value): value is string => Boolean(value))
    .join(' ')
    .toLowerCase()

  return ADMIN_FALLBACK_IDENTIFIERS.some((identifier) => normalized.includes(identifier))
}

function resolveRoleKey(
  appRole: string | null | undefined,
  authRole: string | null | undefined,
  fallbackValues: Array<string | null | undefined> = [],
): AppRoleKey {
  // 1) Explicit value in users table is the source of truth
  if (appRole === 'super_admin') return 'super_admin'
  if (appRole === 'admin') return 'admin'
  if (appRole === 'user') return 'user'
  // 2) Fall back to auth_users.role if app table not set
  if (authRole === 'super_admin') return 'super_admin'
  if (authRole === 'admin') return 'admin'
  if (authRole === 'user') return 'user'
  // 3) Last-resort identifier heuristic (legacy seed accounts)
  if (hasAdminFallbackIdentifier(fallbackValues)) return 'admin'
  return 'user'
}

/** Resolve current actor's role (used for authorization in mutations). */
async function getActorRole(): Promise<AppRoleKey> {
  const actor = await requireAuthUser()
  if (actor.provider === 'bypass') return 'super_admin'
  // Prefer the source-of-truth role from the app users table over the
  // (possibly stale) session token role.
  const appUser = await getCurrentAppUser()
  if (appUser) return appUser.roleKey
  return normalizeRoleKey(actor.role)
}

function forbidden(message = 'Forbidden'): never {
  throw new Error(message)
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  avatar: z.string().url().nullable().optional(),
  roleKey: z.enum(['super_admin', 'admin', 'user']).optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .optional()
    .or(z.literal('').transform(() => undefined)),
})

export type UserInput = z.infer<typeof userSchema>

async function setUserRole(
  appUserId: string,
  authUserId: string | null,
  provider: string | null | undefined,
  roleKey: AppRoleKey | undefined,
) {
  if (!roleKey) return

  const db = await loadDb()
  const role = roleKey
  const now = new Date()

  // Always persist on the app users table — this is the source of truth.
  await db.update(users).set({ role, updatedAt: now }).where(eq(users.id, appUserId))

  // Mirror to auth_users.role only when the user is owned by Better Auth.
  // Clerk users live exclusively in Clerk + the app `users` table.
  if (authUserId && provider === 'better-auth') {
    await db.update(authUsers).set({ role, updatedAt: now }).where(eq(authUsers.id, authUserId))
  }
}

export interface UserListResponse {
  data: UserType[]
  totalCount: number
  nextPage: number | null
}

// ---------------------------------------------------------------------------
// Get Users (paginated)
// ---------------------------------------------------------------------------

export const getUsersFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      limit: z.number().default(10),
      search: z.string().optional(),
      pageParam: z.number().optional(),
    }),
  )
  .handler(async ({ data }): Promise<UserListResponse> => {
    const db = await loadDb()
    const { limit, search, pageParam = 1 } = data
    const offset = (pageParam - 1) * limit

    const conditions = []
    if (search?.trim()) {
      conditions.push(
        or(ilike(users.name, `%${search.trim()}%`), ilike(users.email, `%${search.trim()}%`)),
      )
    }

    const where = conditions.length > 0 ? conditions[0] : undefined

    const [rows, [{ total }]] = await Promise.all([
      db
        .select({
          user: users,
          authRole: authUsers.role,
        })
        .from(users)
        .leftJoin(authUsers, eq(users.authUserId, authUsers.id))
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(users).where(where),
    ])

    const totalCount = Number(total) || 0
    const nextPage = offset + rows.length < totalCount ? pageParam + 1 : null

    const mapped: UserType[] = rows.map(({ user, authRole }) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      authUserId: user.authUserId,
      provider: toProvider(user.provider),
      roleKey: resolveRoleKey(user.role, authRole, [user.name, user.email, user.authUserId]),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }))

    return { data: mapped, totalCount, nextPage }
  })

// ---------------------------------------------------------------------------
// Get User By ID
// ---------------------------------------------------------------------------

export const getUserByIdFn = createServerFn({ method: 'GET' })
  .inputValidator(z.string())
  .handler(async ({ data: id }): Promise<UserType | null> => {
    const db = await loadDb()
    const [result] = await db
      .select({
        user: users,
        authRole: authUsers.role,
      })
      .from(users)
      .leftJoin(authUsers, eq(users.authUserId, authUsers.id))
      .where(eq(users.id, id))
      .limit(1)
    if (!result) return null
    return {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      avatar: result.user.avatar,
      authUserId: result.user.authUserId,
      provider: toProvider(result.user.provider),
      roleKey: resolveRoleKey(result.user.role, result.authRole, [
        result.user.name,
        result.user.email,
        result.user.authUserId,
      ]),
      createdAt: result.user.createdAt.toISOString(),
      updatedAt: result.user.updatedAt.toISOString(),
    }
  })

// ---------------------------------------------------------------------------
// Create User
// ---------------------------------------------------------------------------

export const createUserFn = createServerFn({ method: 'POST' })
  .inputValidator(userSchema)
  .handler(async ({ data: input }): Promise<UserType> => {
    const actorRole = await getActorRole()
    if (!canManageUsers(actorRole)) forbidden('Only admins can create users')
    if (input.roleKey && !canAssignRole(actorRole, 'user', input.roleKey)) {
      forbidden('Insufficient privileges to assign this role')
    }

    const db = await loadDb()
    const now = new Date()
    const role = input.roleKey ?? 'user'

    // Provision a Better Auth identity when a password is supplied so the
    // user can actually log in. Otherwise create a profile-only ("local") row.
    let authUserId: string | null = null
    let provider: UserProvider = 'local'

    if (input.password) {
      // Ensure no Better Auth account already exists with this email.
      const [existingAuth] = await db
        .select({ id: authUsers.id })
        .from(authUsers)
        .where(eq(authUsers.email, input.email))
        .limit(1)
      if (existingAuth) {
        throw new Error('An account with this email already exists')
      }

      authUserId = crypto.randomUUID()
      provider = 'better-auth'
      const hashed = await hashPassword(input.password)

      await db.insert(authUsers).values({
        id: authUserId,
        name: input.name,
        email: input.email,
        emailVerified: true,
        image: input.avatar ?? null,
        role,
        createdAt: now,
        updatedAt: now,
      })

      await db.insert(authAccounts).values({
        id: crypto.randomUUID(),
        userId: authUserId,
        accountId: input.email,
        providerId: 'credential',
        password: hashed,
        createdAt: now,
        updatedAt: now,
      })
    }

    const [u] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        name: input.name,
        email: input.email,
        avatar: input.avatar ?? null,
        role,
        provider,
        authUserId,
      })
      .returning()

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      authUserId: u.authUserId,
      provider: toProvider(u.provider),
      roleKey: resolveRoleKey(u.role, null, [u.name, u.email, u.authUserId]),
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }
  })

// ---------------------------------------------------------------------------
// Update User
// ---------------------------------------------------------------------------

export const updateUserFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string(), data: userSchema.partial() }))
  .handler(async ({ data: { id, data: updates } }): Promise<UserType> => {
    const actorRole = await getActorRole()
    if (!canManageUsers(actorRole)) forbidden('Only admins can update users')

    const db = await loadDb()

    // If a role change is requested, validate it against the target's current role
    if (updates.roleKey !== undefined) {
      const [targetRow] = await db
        .select({ user: users, authRole: authUsers.role })
        .from(users)
        .leftJoin(authUsers, eq(users.authUserId, authUsers.id))
        .where(eq(users.id, id))
        .limit(1)
      if (!targetRow) forbidden('Target user not found')
      const targetRole = resolveRoleKey(targetRow.user.role, targetRow.authRole, [
        targetRow.user.name,
        targetRow.user.email,
        targetRow.user.authUserId,
      ])
      if (!canAssignRole(actorRole, targetRole, updates.roleKey)) {
        forbidden('Insufficient privileges to change this role')
      }
    }

    const patch: Record<string, unknown> = {}
    if (updates.name !== undefined) patch.name = updates.name
    if (updates.email !== undefined) patch.email = updates.email
    if (updates.avatar !== undefined) patch.avatar = updates.avatar
    if (updates.roleKey !== undefined) patch.role = updates.roleKey
    patch.updatedAt = new Date()

    const [u] = await db.update(users).set(patch).where(eq(users.id, id)).returning()

    await setUserRole(u.id, u.authUserId, u.provider, updates.roleKey)

    // Mirror name/email/avatar to Better Auth so login + identity stay consistent.
    if (u.authUserId && u.provider === 'better-auth') {
      const authPatch: Record<string, unknown> = { updatedAt: new Date() }
      if (updates.name !== undefined) authPatch.name = updates.name
      if (updates.email !== undefined) authPatch.email = updates.email
      if (updates.avatar !== undefined) authPatch.image = updates.avatar
      if (Object.keys(authPatch).length > 1) {
        await db.update(authUsers).set(authPatch).where(eq(authUsers.id, u.authUserId))
      }

      // Rotate the credential account id when email changes (Better Auth uses
      // `account_id = email` for the 'credential' provider).
      if (updates.email !== undefined) {
        await db
          .update(authAccounts)
          .set({ accountId: updates.email, updatedAt: new Date() })
          .where(
            and(eq(authAccounts.userId, u.authUserId), eq(authAccounts.providerId, 'credential')),
          )
      }

      // Update password if requested.
      if (updates.password) {
        const hashed = await hashPassword(updates.password)
        await db
          .update(authAccounts)
          .set({ password: hashed, updatedAt: new Date() })
          .where(
            and(eq(authAccounts.userId, u.authUserId), eq(authAccounts.providerId, 'credential')),
          )
      }
    } else if (updates.password) {
      // Editing a local/Clerk user but a password was supplied — surface clearly.
      throw new Error('Cannot set a password on a user that has no Better Auth account')
    }

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      authUserId: u.authUserId,
      provider: toProvider(u.provider),
      roleKey: resolveRoleKey(u.role, null, [u.name, u.email, u.authUserId]),
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }
  })

// ---------------------------------------------------------------------------
// Delete User
// ---------------------------------------------------------------------------

export const deleteUserFn = createServerFn({ method: 'POST' })
  .inputValidator(z.string())
  .handler(async ({ data: id }): Promise<{ success: true }> => {
    const actorRole = await getActorRole()
    if (!canManageUsers(actorRole)) forbidden('Only admins can delete users')

    const db = await loadDb()

    const [targetRow] = await db
      .select({ user: users, authRole: authUsers.role })
      .from(users)
      .leftJoin(authUsers, eq(users.authUserId, authUsers.id))
      .where(eq(users.id, id))
      .limit(1)
    if (targetRow) {
      const targetRole = resolveRoleKey(targetRow.user.role, targetRow.authRole, [
        targetRow.user.name,
        targetRow.user.email,
        targetRow.user.authUserId,
      ])
      if (!canDeleteUser(actorRole, targetRole)) {
        forbidden('Insufficient privileges to delete this user')
      }
    }

    await db.delete(users).where(eq(users.id, id))
    return { success: true }
  })

// ---------------------------------------------------------------------------
// Sync Authenticated User (find-or-create on login)
// ---------------------------------------------------------------------------

export const syncAuthenticatedUserFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      provider: z.enum(['better-auth', 'clerk']),
      providerUserId: z.string(),
      name: z.string(),
      email: z.string().email(),
      avatar: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }): Promise<UserType> => {
    const db = await loadDb()

    // Try to find existing user by authUserId
    const [byAuth] = await db
      .select()
      .from(users)
      .where(eq(users.authUserId, data.providerUserId))
      .limit(1)

    if (byAuth) {
      // Ensure provider is in sync (e.g. existing seed row)
      if (byAuth.provider !== data.provider) {
        await db.update(users).set({ provider: data.provider }).where(eq(users.id, byAuth.id))
      }
      return {
        id: byAuth.id,
        name: byAuth.name,
        email: byAuth.email,
        avatar: byAuth.avatar,
        authUserId: byAuth.authUserId,
        provider: toProvider(byAuth.provider),
        roleKey: resolveRoleKey(byAuth.role, null, [byAuth.name, byAuth.email, byAuth.authUserId]),
        createdAt: byAuth.createdAt.toISOString(),
        updatedAt: byAuth.updatedAt.toISOString(),
      }
    }

    if (data.email) {
      const [byEmail] = await db.select().from(users).where(eq(users.email, data.email)).limit(1)

      if (byEmail) {
        // Link this auth identity (provider + providerUserId) to the existing profile.
        await db
          .update(users)
          .set({ authUserId: data.providerUserId, provider: data.provider })
          .where(eq(users.id, byEmail.id))
        return {
          id: byEmail.id,
          name: byEmail.name,
          email: byEmail.email,
          avatar: byEmail.avatar,
          authUserId: data.providerUserId,
          provider: data.provider,
          roleKey: resolveRoleKey(byEmail.role, null, [
            byEmail.name,
            byEmail.email,
            data.providerUserId,
          ]),
          createdAt: byEmail.createdAt.toISOString(),
          updatedAt: byEmail.updatedAt.toISOString(),
        }
      }
    }

    // Create new user profile
    const [u] = await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        avatar: data.avatar ?? null,
        authUserId: data.providerUserId,
        provider: data.provider,
      })
      .returning()

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      authUserId: u.authUserId,
      provider: toProvider(u.provider),
      roleKey: resolveRoleKey(u.role, null, [u.name, u.email, u.authUserId]),
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }
  })
