import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { requirePermission } from '@/shared/lib/auth/authorize'
import { requireAuthUser } from '@/shared/lib/auth/server'
import { loadDb } from '@/shared/lib/db/load'
import { siteSettings } from '@/shared/lib/db/schema'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const socialLinkSchema = z.object({
  platform: z.enum(['twitter', 'facebook', 'instagram', 'linkedin', 'github']),
  label: z.string().min(1).max(80),
  href: z.string().max(500),
  enabled: z.boolean(),
})

export type SocialLink = z.infer<typeof socialLinkSchema>

export const SOCIAL_LINKS_KEY = 'social_links'

export const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { platform: 'twitter', label: 'Twitter / X', href: '', enabled: true },
  { platform: 'facebook', label: 'Facebook', href: '', enabled: false },
  { platform: 'instagram', label: 'Instagram', href: '', enabled: false },
  { platform: 'linkedin', label: 'LinkedIn', href: '', enabled: false },
  { platform: 'github', label: 'GitHub', href: '', enabled: true },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isAdminUser(user: Awaited<ReturnType<typeof requireAuthUser>>): boolean {
  if (user.provider === 'bypass') return true
  return user.role === 'admin' || user.role === 'super_admin'
}

async function requireAdmin() {
  const user = await requireAuthUser()
  if (!isAdminUser(user)) throw new Error('Forbidden')
  return user
}

function parseSocialLinks(raw: unknown): SocialLink[] {
  const result = z.array(socialLinkSchema).safeParse(raw)
  return result.success ? result.data : DEFAULT_SOCIAL_LINKS
}

// ---------------------------------------------------------------------------
// Server functions
// ---------------------------------------------------------------------------

export const getSocialLinksFn = createServerFn({ method: 'GET' }).handler(async () => {
  const db = await loadDb()
  const row = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, SOCIAL_LINKS_KEY))
    .limit(1)

  if (row.length === 0) return DEFAULT_SOCIAL_LINKS
  return parseSocialLinks(row[0].value)
})

export const updateSocialLinksFn = createServerFn({ method: 'POST' })
  .inputValidator(z.array(socialLinkSchema))
  .handler(async ({ data, context }) => {
    await requirePermission(context, 'site_settings.update')
    const user = await requireAdmin()
    const db = await loadDb()

    await db
      .insert(siteSettings)
      .values({
        key: SOCIAL_LINKS_KEY,
        value: data,
        updatedAt: new Date(),
        updatedBy: user.email ?? user.userId,
      })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: {
          value: data,
          updatedAt: new Date(),
          updatedBy: user.email ?? user.userId,
        },
      })

    return { success: true }
  })
