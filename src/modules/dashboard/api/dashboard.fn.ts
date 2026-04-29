import { createServerFn } from '@tanstack/react-start'
import { count } from 'drizzle-orm'
import { z } from 'zod'
import { loadDb } from '@/shared/lib/db/load'
import { users } from '@/shared/lib/db/schema'
import { isE2E } from '@/shared/lib/env'

/**
 * Template dashboard metrics.
 * Replace these with your app-specific KPIs.
 */
export interface DashboardStats {
  totalUsers: number
  // Add your app-specific metrics here
}

export const getDashboardStatsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.void())
  .handler(async (): Promise<DashboardStats> => {
    if (isE2E) {
      return { totalUsers: 5 }
    }

    const db = await loadDb()
    const [{ total }] = await db.select({ total: count() }).from(users)

    return { totalUsers: Number(total) || 0 }
  })
