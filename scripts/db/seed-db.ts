/**
 * Seed script for edd-app-template.
 * Creates the initial admin user if one does not already exist.
 * Credentials are written to .admin-credentials (gitignored) and printed to stdout.
 *
 * Usage:  pnpm db:seed
 * Requires:  BETTER_AUTH_URL and BETTER_AUTH_SECRET env vars to be set.
 */

import * as fs from 'fs'
import * as crypto from 'crypto'
import * as path from 'path'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@app.local'
const ADMIN_NAME = 'Admin'
const BASE_URL = process.env.BETTER_AUTH_URL ?? process.env.VITE_APP_URL ?? 'http://localhost:3000'
const CREDENTIALS_FILE = path.join(process.cwd(), '.admin-credentials')

function generatePassword(length = 24): string {
  return crypto
    .randomBytes(Math.ceil(length * 0.75))
    .toString('base64')
    .replace(/[+/=]/g, '')
    .slice(0, length)
}

async function seedAdmin(): Promise<void> {
  if (fs.existsSync(CREDENTIALS_FILE)) {
    const existing = fs.readFileSync(CREDENTIALS_FILE, 'utf-8')
    console.log('Admin credentials already exist at .admin-credentials')
    console.log(existing)
    return
  }

  const password = generatePassword()

  const signUpRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password, name: ADMIN_NAME }),
  })

  if (!signUpRes.ok) {
    const body = await signUpRes.text()
    if (body.includes('already exists') || body.includes('UNIQUE')) {
      console.log(`Admin user ${ADMIN_EMAIL} already exists — skipping creation.`)
      return
    }
    throw new Error(`sign-up failed (${signUpRes.status}): ${body}`)
  }

  const data = (await signUpRes.json()) as { user?: { id?: string } }
  const userId = data?.user?.id

  if (!userId) {
    throw new Error('sign-up succeeded but no user.id in response')
  }

  // Promote to admin via the admin plugin endpoint (requires BETTER_AUTH_SECRET in Authorization header)
  const promoteRes = await fetch(`${BASE_URL}/api/auth/admin/set-role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.BETTER_AUTH_SECRET}`,
    },
    body: JSON.stringify({ userId, role: 'admin' }),
  })

  if (!promoteRes.ok) {
    const body = await promoteRes.text()
    throw new Error(`role promotion failed (${promoteRes.status}): ${body}`)
  }

  const credentials = [
    `ADMIN_EMAIL=${ADMIN_EMAIL}`,
    `ADMIN_PASSWORD=${password}`,
    `ADMIN_URL=${BASE_URL}`,
    `CREATED_AT=${new Date().toISOString()}`,
  ].join('\n')

  fs.writeFileSync(CREDENTIALS_FILE, credentials, { mode: 0o600 })

  console.log('=== Admin credentials created ===')
  console.log(`Email:    ${ADMIN_EMAIL}`)
  console.log(`Password: ${password}`)
  console.log(`URL:      ${BASE_URL}`)
  console.log('Saved to: .admin-credentials')
}

async function main() {
  await seedAdmin()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

