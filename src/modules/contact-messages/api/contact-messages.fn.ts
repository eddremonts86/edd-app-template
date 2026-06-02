import { createServerFn } from '@tanstack/react-start'
import { and, count, desc, eq, ilike, inArray, isNull, or } from 'drizzle-orm'
import { z } from 'zod'
import { requireCurrentAppUser } from '@/modules/users/api/current-user.server'
import { requireAuthUser } from '@/shared/lib/auth/server'
import { loadDb } from '@/shared/lib/db/load'
import { authUsers, contactMessages, notifications, users } from '@/shared/lib/db/schema'
import type { ContactMessagesListResponse, ContactNotification } from '../model/types'

const ADMIN_FALLBACK_IDENTIFIERS = ['edd_remonts', 'edd_admin']
const NOTIFICATION_PREVIEW_MAX_LENGTH = 180

const buildIdentifierFilters = (value: string) =>
  ADMIN_FALLBACK_IDENTIFIERS.map((identifier) => ilike(value, `%${identifier}%`))

const buildNotificationBody = (
  email: string,
  projectType: string,
  message: string | null,
): string => {
  const preview = message?.replaceAll(/\s+/g, ' ').trim() ?? ''
  if (preview.length > 0) {
    const trimmed =
      preview.length > NOTIFICATION_PREVIEW_MAX_LENGTH
        ? `${preview.slice(0, NOTIFICATION_PREVIEW_MAX_LENGTH)}...`
        : preview
    return `${trimmed} · ${email}`
  }

  return `${email} · ${projectType}`
}

export const contactMessageInputSchema = z.object({
  email: z.email(),
  projectType: z.enum(['saas', 'landing', 'webapp']),
  message: z.string().trim().max(3000).optional(),
})

export type ContactMessageInput = z.infer<typeof contactMessageInputSchema>

function isAdminUser(user: Awaited<ReturnType<typeof requireAuthUser>>): boolean {
  if (user.provider === 'bypass') return true
  if (user.role === 'admin') return true

  const identifier = `${user.email ?? ''} ${user.name ?? ''}`.toLowerCase()
  return ADMIN_FALLBACK_IDENTIFIERS.some((candidate) => identifier.includes(candidate))
}

async function requireAdminUser() {
  const authUser = await requireAuthUser()

  if (!isAdminUser(authUser)) {
    throw new Error('Forbidden')
  }

  return authUser
}

async function resolveAdminRecipientUserIds() {
  const db = await loadDb()

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .leftJoin(authUsers, eq(users.authUserId, authUsers.id))
    .where(
      or(
        eq(authUsers.role, 'admin'),
        ...buildIdentifierFilters(users.email),
        ...buildIdentifierFilters(users.name),
        ...buildIdentifierFilters(authUsers.email),
        ...buildIdentifierFilters(authUsers.name),
      ),
    )

  return [...new Set(rows.map((row) => row.id))]
}

export const createContactMessageFn = createServerFn({ method: 'POST' })
  .inputValidator(contactMessageInputSchema)
  .handler(async ({ data }) => {
    const db = await loadDb()
    const now = new Date()

    const [created] = await db
      .insert(contactMessages)
      .values({
        id: crypto.randomUUID(),
        email: data.email,
        projectType: data.projectType,
        message: data.message?.trim() || null,
        status: 'new',
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    const adminRecipientIds = await resolveAdminRecipientUserIds()

    if (adminRecipientIds.length > 0) {
      await db.insert(notifications).values(
        adminRecipientIds.map((recipientUserId) => ({
          id: crypto.randomUUID(),
          recipientUserId,
          kind: 'contact-message',
          title: 'New contact brief',
          body: buildNotificationBody(created.email, created.projectType, created.message),
          entityType: 'contact-message',
          entityId: created.id,
          link: '/dashboard/contact-messages',
          isRead: false,
          createdAt: now,
          readAt: null,
        })),
      )
    } else {
      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        recipientUserId: null,
        kind: 'contact-message',
        title: 'New contact brief',
        body: buildNotificationBody(created.email, created.projectType, created.message),
        entityType: 'contact-message',
        entityId: created.id,
        link: '/dashboard/contact-messages',
        isRead: false,
        createdAt: now,
        readAt: null,
      })
    }

    return {
      id: created.id,
      email: created.email,
      projectType: created.projectType,
      message: created.message,
      status: created.status,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    }
  })

export const getContactMessagesFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      limit: z.number().default(50),
      search: z.string().optional(),
      status: z.enum(['new', 'read', 'all']).default('all'),
    }),
  )
  .handler(async ({ data }): Promise<ContactMessagesListResponse> => {
    await requireAdminUser()
    const db = await loadDb()

    const filters = []
    if (data.search?.trim()) {
      const query = `%${data.search.trim()}%`
      filters.push(or(ilike(contactMessages.email, query), ilike(contactMessages.message, query)))
    }
    if (data.status !== 'all') {
      filters.push(eq(contactMessages.status, data.status))
    }

    let where = undefined
    if (filters.length === 1) {
      where = filters[0]
    } else if (filters.length > 1) {
      where = and(...filters)
    }

    const [rows, [{ total }], [{ unreadTotal }]] = await Promise.all([
      db
        .select()
        .from(contactMessages)
        .where(where)
        .orderBy(desc(contactMessages.createdAt))
        .limit(Math.max(1, Math.min(data.limit, 200))),
      db.select({ total: count() }).from(contactMessages).where(where),
      db
        .select({ unreadTotal: count() })
        .from(contactMessages)
        .where(eq(contactMessages.status, 'new')),
    ])

    return {
      data: rows.map((row) => ({
        id: row.id,
        email: row.email,
        projectType: row.projectType,
        message: row.message,
        status: row.status as 'new' | 'read',
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      totalCount: Number(total) || 0,
      unreadCount: Number(unreadTotal) || 0,
    }
  })

export const markContactMessageReadFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string(), read: z.boolean().default(true) }))
  .handler(async ({ data }) => {
    await requireAdminUser()
    const db = await loadDb()

    const [updated] = await db
      .update(contactMessages)
      .set({
        status: data.read ? 'read' : 'new',
        updatedAt: new Date(),
      })
      .where(eq(contactMessages.id, data.id))
      .returning()

    return {
      id: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    }
  })

export const getInboxNotificationsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ limit: z.number().default(8) }))
  .handler(async ({ data }): Promise<{ items: ContactNotification[]; unreadCount: number }> => {
    const authUser = await requireAuthUser()
    const canSeeGlobalNotifications = isAdminUser(authUser)
    const db = await loadDb()
    const limit = Math.max(1, Math.min(data.limit, 25))

    if (canSeeGlobalNotifications) {
      const [rows, [{ unreadTotal }]] = await Promise.all([
        db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(limit),
        db
          .select({ unreadTotal: count() })
          .from(contactMessages)
          .where(eq(contactMessages.status, 'new')),
      ])

      return {
        items: rows.map((row) => ({
          id: `contact:${row.id}`,
          title: 'New contact brief',
          body: buildNotificationBody(row.email, row.projectType, row.message),
          link: '/dashboard/contact-messages',
          entityId: row.id,
          isRead: row.status === 'read',
          createdAt: row.createdAt.toISOString(),
        })),
        unreadCount: Number(unreadTotal) || 0,
      }
    }

    const appUser = await requireCurrentAppUser()

    const visibilityWhere = canSeeGlobalNotifications
      ? or(eq(notifications.recipientUserId, appUser.id), isNull(notifications.recipientUserId))
      : eq(notifications.recipientUserId, appUser.id)

    const unreadWhere = canSeeGlobalNotifications
      ? and(
          or(eq(notifications.recipientUserId, appUser.id), isNull(notifications.recipientUserId)),
          eq(notifications.isRead, false),
        )
      : and(eq(notifications.recipientUserId, appUser.id), eq(notifications.isRead, false))

    const [rows, [{ unreadTotal }]] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(visibilityWhere)
        .orderBy(desc(notifications.createdAt))
        .limit(limit),
      db.select({ unreadTotal: count() }).from(notifications).where(unreadWhere),
    ])

    return {
      items: rows.map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        link: row.link,
        entityId: row.entityId,
        isRead: row.isRead,
        createdAt: row.createdAt.toISOString(),
      })),
      unreadCount: Number(unreadTotal) || 0,
    }
  })

export const markNotificationsReadFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ ids: z.array(z.string()).min(1) }))
  .handler(async ({ data }) => {
    const appUser = await requireCurrentAppUser()
    const authUser = await requireAuthUser()
    const canSeeGlobalNotifications = isAdminUser(authUser)
    const db = await loadDb()

    const updateWhere = canSeeGlobalNotifications
      ? and(
          inArray(notifications.id, data.ids),
          or(eq(notifications.recipientUserId, appUser.id), isNull(notifications.recipientUserId)),
          eq(notifications.isRead, false),
        )
      : and(
          eq(notifications.recipientUserId, appUser.id),
          inArray(notifications.id, data.ids),
          eq(notifications.isRead, false),
        )

    await db.update(notifications).set({ isRead: true, readAt: new Date() }).where(updateWhere)

    return { success: true }
  })
