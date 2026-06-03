/**
 * seed-admin.ts
 *
 * Creates (or updates) the default local admin user so you can always log in
 * at /auth without registering manually.
 *
 * Reads credentials from environment variables — set them in .env:
 *   DEFAULT_ADMIN_EMAIL=edd_admin@local.com
 *   DEFAULT_ADMIN_PASSWORD=Passw0rd!234
 *
 * Usage: pnpm db:seed:admin
 * Safe to run multiple times (ON CONFLICT DO UPDATE).
 */

import { hashPassword } from 'better-auth/crypto'
import postgres from 'postgres'

const __NODE_ENV = process.env.NODE_ENV
const __adminEmailEnv = process.env.DEFAULT_ADMIN_EMAIL
const __adminPasswordEnv = process.env.DEFAULT_ADMIN_PASSWORD

// In production, refuse to fall back to hardcoded dev credentials.
// Prevents an unconfigured Coolify deploy from ending up with a
// well-known admin account on the public internet.
if (__NODE_ENV === 'production' && (!__adminEmailEnv || !__adminPasswordEnv)) {
  console.error(
    '❌  Refusing to seed admin in production: DEFAULT_ADMIN_EMAIL and ' +
      'DEFAULT_ADMIN_PASSWORD must be set explicitly in the Coolify env panel.',
  )
  process.exit(1)
}

const DATABASE_URL = process.env.DATABASE_URL
const email = process.env.DEFAULT_ADMIN_EMAIL ?? 'edd_admin@local.com'
const password = process.env.DEFAULT_ADMIN_PASSWORD ?? 'Passw0rd!234'
const name = 'Admin'

if (!DATABASE_URL) {
  console.error('❌  DATABASE_URL is not set. Check your .env file.')
  process.exit(1)
}

async function main() {
  const sql = postgres(DATABASE_URL!, { max: 1, prepare: false })

  try {
    const hashedPassword = await hashPassword(password)
    const userId = crypto.randomUUID()
    const accountId = crypto.randomUUID()
    const now = new Date()

    // Upsert the auth user row (with super_admin role for the bootstrap account)
    const [user] = await sql`
      INSERT INTO auth_users (id, name, email, email_verified, role, created_at, updated_at)
      VALUES (${userId}, ${name}, ${email}, true, 'super_admin', ${now}, ${now})
      ON CONFLICT (email) DO UPDATE
        SET name = EXCLUDED.name,
            role = 'super_admin',
            updated_at = now()
      RETURNING id
    `

    // Upsert the credential account row linked to the user
    await sql`
      INSERT INTO auth_accounts (
        id, user_id, account_id, provider_id, password, created_at, updated_at
      )
      VALUES (
        ${accountId},
        ${user.id},
        ${email},
        'credential',
        ${hashedPassword},
        ${now},
        ${now}
      )
      ON CONFLICT (account_id, provider_id) DO UPDATE
        SET password = EXCLUDED.password,
            updated_at = now()
    `

    // Keep the app users row (if already linked) in sync with super_admin role.
    await sql`
      UPDATE users
      SET role = 'super_admin', updated_at = now()
      WHERE auth_user_id = ${user.id} OR email = ${email}
    `

    console.log(`✅  Super admin user ready: ${email}`)
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((err) => {
  console.error('❌  seed-admin failed:', err)
  process.exit(1)
})
