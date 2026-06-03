import { createServerFn } from '@tanstack/react-start'
import { and, count, desc, eq, gt, gte, lt } from 'drizzle-orm'
import { z } from 'zod'
import { loadDb } from '@/shared/lib/db/load'
import { authSessions, contactMessages, users } from '@/shared/lib/db/schema'
import { isE2E } from '@/shared/lib/env'

export interface RecentSignup {
  id: string
  name: string
  email: string
  avatar: string | null
  role: string
  provider: string
  createdAt: string
}

export interface DashboardStats {
  users: {
    total: number
    newThisWeek: number
    newLastWeek: number
    byRole: { super_admin: number; admin: number; user: number }
    byProvider: { 'better-auth': number; clerk: number; local: number }
  }
  contactMessages: {
    total: number
    unread: number
    newThisWeek: number
    byType: { saas: number; landing: number; webapp: number }
  }
  sessions: {
    active: number
  }
  recentSignups: RecentSignup[]
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

function sampleStats(): DashboardStats {
  return {
    users: {
      total: 5,
      newThisWeek: 2,
      newLastWeek: 1,
      byRole: { super_admin: 1, admin: 1, user: 3 },
      byProvider: { 'better-auth': 2, clerk: 1, local: 2 },
    },
    contactMessages: {
      total: 4,
      unread: 2,
      newThisWeek: 2,
      byType: { saas: 2, landing: 1, webapp: 1 },
    },
    sessions: { active: 1 },
    recentSignups: [],
  }
}

export const getDashboardStatsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.void())
  .handler(async (): Promise<DashboardStats> => {
    if (isE2E) return sampleStats()

    const db = await loadDb()
    const now = new Date()
    const weekAgo = new Date(now.getTime() - ONE_WEEK_MS)
    const twoWeeksAgo = new Date(now.getTime() - 2 * ONE_WEEK_MS)

    const [{ total: usersTotal }] = await db.select({ total: count() }).from(users)
    const [{ total: usersThisWeek }] = await db
      .select({ total: count() })
      .from(users)
      .where(gte(users.createdAt, weekAgo))
    const [{ total: usersLastWeek }] = await db
      .select({ total: count() })
      .from(users)
      .where(and(gte(users.createdAt, twoWeeksAgo), lt(users.createdAt, weekAgo)))
    const usersByRoleRows = await db
      .select({ role: users.role, total: count() })
      .from(users)
      .groupBy(users.role)
    const usersByProviderRows = await db
      .select({ provider: users.provider, total: count() })
      .from(users)
      .groupBy(users.provider)
    const [{ total: msgTotal }] = await db.select({ total: count() }).from(contactMessages)
    const [{ total: msgUnread }] = await db
      .select({ total: count() })
      .from(contactMessages)
      .where(eq(contactMessages.status, 'new'))
    const [{ total: msgThisWeek }] = await db
      .select({ total: count() })
      .from(contactMessages)
      .where(gte(contactMessages.createdAt, weekAgo))
    const msgByTypeRows = await db
      .select({ projectType: contactMessages.projectType, total: count() })
      .from(contactMessages)
      .groupBy(contactMessages.projectType)
    const [{ total: sessionsActive }] = await db
      .select({ total: count() })
      .from(authSessions)
      .where(gt(authSessions.expiresAt, now))
    const recentSignupsRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        role: users.role,
        provider: users.provider,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5)

    const byRole = { super_admin: 0, admin: 0, user: 0 }
    for (const row of usersByRoleRows) {
      const key = (row.role ?? 'user') as keyof typeof byRole
      if (key in byRole) byRole[key] = Number(row.total) || 0
    }

    const byProvider = { 'better-auth': 0, clerk: 0, local: 0 }
    for (const row of usersByProviderRows) {
      const key = (row.provider ?? 'local') as keyof typeof byProvider
      if (key in byProvider) byProvider[key] = Number(row.total) || 0
    }

    const byType = { saas: 0, landing: 0, webapp: 0 }
    for (const row of msgByTypeRows) {
      const key = (row.projectType ?? '') as keyof typeof byType
      if (key in byType) byType[key] = Number(row.total) || 0
    }

    return {
      users: {
        total: Number(usersTotal) || 0,
        newThisWeek: Number(usersThisWeek) || 0,
        newLastWeek: Number(usersLastWeek) || 0,
        byRole,
        byProvider,
      },
      contactMessages: {
        total: Number(msgTotal) || 0,
        unread: Number(msgUnread) || 0,
        newThisWeek: Number(msgThisWeek) || 0,
        byType,
      },
      sessions: {
        active: Number(sessionsActive) || 0,
      },
      recentSignups: recentSignupsRows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        avatar: row.avatar,
        role: row.role,
        provider: row.provider,
        createdAt: row.createdAt.toISOString(),
      })),
    }
  })
