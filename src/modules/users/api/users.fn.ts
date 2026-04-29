import { createServerFn } from '@tanstack/react-start'
import { count, desc, eq, ilike, or } from 'drizzle-orm'
import { z } from 'zod'
import { loadDb } from '@/shared/lib/db/load'
import { users } from '@/shared/lib/db/schema'
import type { User as UserType } from '../model/types'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

export const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  avatar: z.string().url().nullable().optional(),
})

export type UserInput = z.infer<typeof userSchema>

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
        or(
          ilike(users.name, `%${search.trim()}%`),
          ilike(users.email, `%${search.trim()}%`),
        ),
      )
    }

    const where = conditions.length > 0 ? conditions[0] : undefined

    const [rows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(users).where(where),
    ])

    const totalCount = Number(total) || 0
    const nextPage = offset + rows.length < totalCount ? pageParam + 1 : null

    const mapped: UserType[] = rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      authUserId: u.authUserId,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
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
    const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1)
    if (!u) return null
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      authUserId: u.authUserId,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }
  })

// ---------------------------------------------------------------------------
// Create User
// ---------------------------------------------------------------------------

export const createUserFn = createServerFn({ method: 'POST' })
  .inputValidator(userSchema)
  .handler(async ({ data: input }): Promise<UserType> => {
    const db = await loadDb()
    const [u] = await db
      .insert(users)
      .values({ id: crypto.randomUUID(), name: input.name, email: input.email, avatar: input.avatar ?? null })
      .returning()
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      authUserId: u.authUserId,
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
    const db = await loadDb()
    const patch: Record<string, unknown> = {}
    if (updates.name !== undefined) patch.name = updates.name
    if (updates.email !== undefined) patch.email = updates.email
    if (updates.avatar !== undefined) patch.avatar = updates.avatar
    patch.updatedAt = new Date()

    const [u] = await db
      .update(users)
      .set(patch)
      .where(eq(users.id, id))
      .returning()

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      authUserId: u.authUserId,
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
    const db = await loadDb()
    await db.delete(users).where(eq(users.id, id))
    return { success: true }
  })

// ---------------------------------------------------------------------------
// Sync Authenticated User (find-or-create on login)
// ---------------------------------------------------------------------------

export const syncAuthenticatedUserFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      provider: z.string(),
      providerUserId: z.string(),
      name: z.string(),
      email: z.string().email(),
      avatar: z.string().nullable().optional(),
    }),
  )
  .handler(async ({ data }): Promise<UserType> => {
    const db = await loadDb()

    // Try to find existing user by authUserId or email
    const [byAuth] = await db
      .select()
      .from(users)
      .where(eq(users.authUserId, data.providerUserId))
      .limit(1)

    if (byAuth) {
      return {
        id: byAuth.id,
        name: byAuth.name,
        email: byAuth.email,
        avatar: byAuth.avatar,
        authUserId: byAuth.authUserId,
        createdAt: byAuth.createdAt.toISOString(),
        updatedAt: byAuth.updatedAt.toISOString(),
      }
    }

    if (data.email) {
      const [byEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1)

      if (byEmail) {
        // Link authUserId
        await db
          .update(users)
          .set({ authUserId: data.providerUserId })
          .where(eq(users.id, byEmail.id))
        return {
          id: byEmail.id,
          name: byEmail.name,
          email: byEmail.email,
          avatar: byEmail.avatar,
          authUserId: data.providerUserId,
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
      })
      .returning()

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      authUserId: u.authUserId,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }
  })
