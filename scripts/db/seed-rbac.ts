import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Check your .env file.')
  process.exit(1)
}

const databaseUrl = DATABASE_URL

const perms = [
  'contact_messages.read',
  'contact_messages.update',
  'contact_messages.delete',
  'users.read',
  'users.create',
  'users.update',
  'users.delete',
  'site_settings.read',
  'site_settings.update',
] as const

const rolePerms: Record<string, readonly string[]> = {
  super_admin: perms,
  admin: perms.filter((p) => !p.startsWith('users.delete')),
  user: ['contact_messages.read'],
}

function splitPermission(permission: string): { resource: string; action: string } {
  const [resource, action] = permission.split('.')
  if (!resource || !action) {
    throw new Error(`Invalid permission format: ${permission}`)
  }
  return { resource, action }
}

async function main() {
  const sql = postgres(databaseUrl, { max: 1, prepare: false, onnotice: () => {} })

  try {
    await sql.begin(async (tx) => {
      for (const permission of perms) {
        const { resource, action } = splitPermission(permission)
        await tx`
          INSERT INTO permissions (id, resource, action, description)
          VALUES (${permission}, ${resource}, ${action}, ${`Permission ${permission}`})
          ON CONFLICT (id) DO UPDATE
          SET resource = EXCLUDED.resource,
              action = EXCLUDED.action
        `
      }

      for (const [role, grantedPerms] of Object.entries(rolePerms)) {
        for (const permission of grantedPerms) {
          await tx`
            INSERT INTO role_permissions (role, permission_id)
            VALUES (${role}, ${permission})
            ON CONFLICT (role, permission_id) DO NOTHING
          `
        }
      }
    })

    console.log('✅ RBAC permissions seeded')
  } finally {
    await sql.end({ timeout: 5 })
  }
}

main().catch((error) => {
  console.error('❌ RBAC seed failed:', error)
  process.exit(1)
})
