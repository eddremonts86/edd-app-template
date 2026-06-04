import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { dbProfileInputSchema, redactProfile, type DbProfile } from '../model/profile'
import { loadDbAdminServer } from './db-admin.server-deps'

const loadServer = loadDbAdminServer

// ---------------------------------------------------------------------------
// Status / readiness
// ---------------------------------------------------------------------------

export const getDbAdminStatusFn = createServerFn({ method: 'GET' }).handler(async () => {
  const s = await loadServer()
  await s.requireSuperAdmin()
  const store = await s.readDbConfigStore()
  return {
    encryptionAvailable: s.isEncryptionAvailable(),
    activeProfileId: store.activeProfileId,
    profileCount: store.profiles.length,
  }
})

// ---------------------------------------------------------------------------
// Profile listing (passwords redacted)
// ---------------------------------------------------------------------------

export const listDbProfilesFn = createServerFn({ method: 'GET' }).handler(async () => {
  const s = await loadServer()
  await s.requireSuperAdmin()
  const store = await s.readDbConfigStore()
  return store.profiles.map((p) => redactProfile(p))
})

// ---------------------------------------------------------------------------
// Save (create / update) profile
// ---------------------------------------------------------------------------

export const saveDbProfileFn = createServerFn({ method: 'POST' })
  .inputValidator(dbProfileInputSchema)
  .handler(async ({ data }) => {
    const s = await loadServer()
    await s.requireSuperAdmin()
    if (!s.isEncryptionAvailable()) {
      throw new Error('DB_CONFIG_SECRET is not configured on the server')
    }
    const actor = await s.requireAuthUser()
    const store = await s.readDbConfigStore()
    const now = new Date().toISOString()

    let nextProfile: DbProfile
    let isCreate = false
    let beforeSnapshot: ReturnType<typeof redactProfile> | undefined

    if (data.id) {
      const idx = store.profiles.findIndex((p) => p.id === data.id)
      if (idx === -1) throw new Error('Profile not found')
      const existing = store.profiles[idx]
      beforeSnapshot = redactProfile(existing)
      nextProfile = s.encryptProfileSensitiveFields({
        ...existing,
        ...data,
        id: existing.id,
        driver: 'postgres',
        updatedAt: now,
      })
      store.profiles[idx] = nextProfile
    } else {
      isCreate = true
      // Enforce unique name.
      if (store.profiles.some((p) => p.name === data.name)) {
        throw new Error(`A profile named "${data.name}" already exists`)
      }
      nextProfile = s.encryptProfileSensitiveFields({
        ...data,
        id: s.randomUUID(),
        driver: 'postgres',
        createdAt: now,
        updatedAt: now,
        lastTestedAt: null,
        lastTestResult: null,
        lastTestMessage: null,
      })
      store.profiles.push(nextProfile)
    }

    await s.writeDbConfigStore(store)

    await s.appendAuditEntry({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      action: isCreate ? 'profile.create' : 'profile.update',
      profileId: nextProfile.id,
      result: 'ok',
      diff: {
        before: beforeSnapshot,
        after: redactProfile(nextProfile),
      },
    })

    return { profile: redactProfile(nextProfile) }
  })

// ---------------------------------------------------------------------------
// Delete profile
// ---------------------------------------------------------------------------

export const deleteDbProfileFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const s = await loadServer()
    await s.requireSuperAdmin()
    const actor = await s.requireAuthUser()
    const store = await s.readDbConfigStore()

    if (store.activeProfileId === data.id) {
      throw new Error('Cannot delete the currently active profile. Deactivate it first.')
    }

    const idx = store.profiles.findIndex((p) => p.id === data.id)
    if (idx === -1) throw new Error('Profile not found')

    const removed = store.profiles[idx]
    store.profiles.splice(idx, 1)
    await s.writeDbConfigStore(store)

    await s.appendAuditEntry({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      action: 'profile.delete',
      profileId: removed.id,
      result: 'ok',
      diff: { before: redactProfile(removed) },
    })

    return { success: true }
  })

// ---------------------------------------------------------------------------
// Activate / deactivate
// ---------------------------------------------------------------------------

export const activateDbProfileFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ id: z.string().nullable() }))
  .handler(async ({ data }) => {
    const s = await loadServer()
    await s.requireSuperAdmin()
    const actor = await s.requireAuthUser()
    const store = await s.readDbConfigStore()

    if (data.id !== null) {
      const profile = store.profiles.find((p) => p.id === data.id)
      if (!profile) throw new Error('Profile not found')

      // Safety: run a connection test before activating.
      const url = s.composeConnectionUrl(profile)
      const test = await s.testDatabaseConnection(url)
      if (!test.ok) {
        await s.appendAuditEntry({
          actorUserId: actor.userId,
          actorEmail: actor.email,
          action: 'connection.test',
          profileId: profile.id,
          result: 'error',
          message: test.error ?? 'Connection failed',
        })
        throw new Error(`Activation blocked: connection test failed — ${test.error}`)
      }
    }

    store.activeProfileId = data.id
    await s.writeDbConfigStore(store)
    await s.invalidateDb()

    await s.appendAuditEntry({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      action: data.id ? 'profile.activate' : 'profile.deactivate',
      profileId: data.id,
      result: 'ok',
    })

    return { activeProfileId: data.id }
  })

// ---------------------------------------------------------------------------
// Test connection (inline or by profileId)
// ---------------------------------------------------------------------------

export const testDbConnectionFn = createServerFn({ method: 'POST' })
  .inputValidator(z.union([z.object({ profileId: z.string() }), dbProfileInputSchema]))
  .handler(async ({ data }) => {
    const s = await loadServer()
    await s.requireSuperAdmin()
    const actor = await s.requireAuthUser()

    let connectionUrl: string
    let profileId: string | null = null

    if ('profileId' in data) {
      const store = await s.readDbConfigStore()
      const profile = store.profiles.find((p) => p.id === data.profileId)
      if (!profile) throw new Error('Profile not found')
      profileId = profile.id
      connectionUrl = s.composeConnectionUrl(profile)
    } else {
      const ephemeral = s.encryptProfileSensitiveFields({
        ...data,
        id: 'ephemeral',
        driver: 'postgres',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      connectionUrl = s.composeConnectionUrl(ephemeral)
    }

    const result = await s.testDatabaseConnection(connectionUrl)

    await s.appendAuditEntry({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      action: 'connection.test',
      profileId,
      result: result.ok ? 'ok' : 'error',
      message: result.ok ? `${result.serverVersion ?? ''} (${result.latencyMs}ms)` : result.error,
    })

    if (profileId) {
      const store = await s.readDbConfigStore()
      const idx = store.profiles.findIndex((p) => p.id === profileId)
      if (idx !== -1) {
        store.profiles[idx] = {
          ...store.profiles[idx],
          lastTestedAt: new Date().toISOString(),
          lastTestResult: result.ok ? 'ok' : 'error',
          lastTestMessage: result.ok
            ? `${result.serverVersion ?? ''} (${result.latencyMs}ms)`
            : (result.error ?? null),
        }
        await s.writeDbConfigStore(store)
      }
    }

    return result
  })

// ---------------------------------------------------------------------------
// Migrations
// ---------------------------------------------------------------------------

const profileTargetSchema = z.object({ profileId: z.string().nullable() })

async function resolveTargetConnectionUrl(
  s: Awaited<ReturnType<typeof loadServer>>,
  profileId: string | null,
): Promise<string> {
  if (profileId) {
    const store = await s.readDbConfigStore()
    const profile = store.profiles.find((p) => p.id === profileId)
    if (!profile) throw new Error('Profile not found')
    return s.composeConnectionUrl(profile)
  }
  const envUrl = process.env.DATABASE_URL
  if (!envUrl) throw new Error('DATABASE_URL is not configured')
  return envUrl
}

export const listDbMigrationsFn = createServerFn({ method: 'POST' })
  .inputValidator(profileTargetSchema)
  .handler(async ({ data }) => {
    const s = await loadServer()
    await s.requireSuperAdmin()
    const url = await resolveTargetConnectionUrl(s, data.profileId)
    return await s.listMigrationStatus(url)
  })

export const dryRunDbMigrationsFn = createServerFn({ method: 'POST' })
  .inputValidator(profileTargetSchema)
  .handler(async ({ data }) => {
    const s = await loadServer()
    await s.requireSuperAdmin()
    const actor = await s.requireAuthUser()
    const url = await resolveTargetConnectionUrl(s, data.profileId)
    const report = await s.runMigrations({ connectionUrl: url, dryRun: true })
    await s.appendAuditEntry({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      action: 'migration.dryrun',
      profileId: data.profileId,
      result: report.error ? 'error' : 'ok',
      message: report.error ?? `${report.files.length} pending file(s)`,
    })
    return report
  })

export const runDbMigrationsFn = createServerFn({ method: 'POST' })
  .inputValidator(profileTargetSchema)
  .handler(async ({ data }) => {
    const s = await loadServer()
    await s.requireSuperAdmin()
    const actor = await s.requireAuthUser()
    const url = await resolveTargetConnectionUrl(s, data.profileId)
    const report = await s.runMigrations({ connectionUrl: url, dryRun: false })
    await s.appendAuditEntry({
      actorUserId: actor.userId,
      actorEmail: actor.email,
      action: 'migration.apply',
      profileId: data.profileId,
      result: report.error ? 'error' : 'ok',
      message: report.error ?? `Applied ${report.appliedCount}, skipped ${report.skippedCount}`,
    })
    return report
  })

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export const getDbAuditLogFn = createServerFn({ method: 'GET' }).handler(async () => {
  const s = await loadServer()
  await s.requireSuperAdmin()
  const store = await s.readAuditStore()
  return store.entries.map((entry) => ({
    id: entry.id,
    timestamp: entry.timestamp,
    actorUserId: entry.actorUserId,
    actorEmail: entry.actorEmail,
    action: entry.action,
    profileId: entry.profileId ?? null,
    result: entry.result,
    message: entry.message ?? null,
    diff: entry.diff ? JSON.stringify(entry.diff) : null,
  }))
})
