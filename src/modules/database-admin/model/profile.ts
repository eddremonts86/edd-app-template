import { z } from 'zod'

export const DB_DRIVER = 'postgres' as const
export type DbDriver = typeof DB_DRIVER

export const dbSslModeSchema = z.enum(['disable', 'require', 'verify-full'])
export type DbSslMode = z.infer<typeof dbSslModeSchema>

/**
 * Profile as persisted on disk. Passwords / full URLs are stored encrypted.
 */
export const dbProfileSchema = z.object({
  id: z.string().min(1),
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9][a-z0-9-_]*$/i, 'Use letters, numbers, dash or underscore'),
  label: z.string().min(1).max(120),
  driver: z.literal(DB_DRIVER),
  connectionUrl: z.string().optional(),
  host: z.string().optional(),
  port: z.number().int().positive().max(65535).optional(),
  database: z.string().optional(),
  user: z.string().optional(),
  password: z.string().optional(),
  ssl: dbSslModeSchema.optional(),
  schema: z.string().optional(),
  poolMax: z.number().int().positive().max(100).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastTestedAt: z.string().nullable().optional(),
  lastTestResult: z.enum(['ok', 'error']).nullable().optional(),
  lastTestMessage: z.string().nullable().optional(),
})

export type DbProfile = z.infer<typeof dbProfileSchema>

/**
 * Input shape used by save/update — id, timestamps and test metadata are
 * managed server-side.
 */
export const dbProfileInputSchema = z
  .object({
    id: z.string().optional(),
    name: dbProfileSchema.shape.name,
    label: dbProfileSchema.shape.label,
    driver: z.literal(DB_DRIVER).default(DB_DRIVER),
    connectionUrl: z.string().optional(),
    host: z.string().optional(),
    port: z.number().int().positive().max(65535).optional(),
    database: z.string().optional(),
    user: z.string().optional(),
    password: z.string().optional(),
    ssl: dbSslModeSchema.optional(),
    schema: z.string().optional(),
    poolMax: z.number().int().positive().max(100).optional(),
  })
  .refine((value) => Boolean(value.connectionUrl) || (value.host && value.database), {
    message: 'Provide either connectionUrl or both host and database',
    path: ['connectionUrl'],
  })

export type DbProfileInput = z.infer<typeof dbProfileInputSchema>

export const dbConfigStoreSchema = z.object({
  version: z.literal(1),
  activeProfileId: z.string().nullable(),
  profiles: z.array(dbProfileSchema),
})

export type DbConfigStore = z.infer<typeof dbConfigStoreSchema>

export const EMPTY_DB_CONFIG_STORE: DbConfigStore = {
  version: 1,
  activeProfileId: null,
  profiles: [],
}

/**
 * Returns a profile clone with the password redacted. Used in API responses
 * and audit log diffs to avoid ever surfacing secrets to the client.
 */
export function redactProfile<T extends Pick<DbProfile, 'password' | 'connectionUrl'>>(
  profile: T,
): T {
  return {
    ...profile,
    password: profile.password ? '••••••••' : undefined,
    connectionUrl: profile.connectionUrl ? redactUrl(profile.connectionUrl) : undefined,
  }
}

export function redactUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.password) parsed.password = '••••'
    return parsed.toString()
  } catch {
    return '••••'
  }
}
