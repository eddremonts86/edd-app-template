/**
 * AES-256-GCM encryption for sensitive profile fields (passwords, full URLs).
 *
 * Key is derived from process.env.DB_CONFIG_SECRET via scrypt. If the secret
 * is not set, encryption helpers throw an explicit error so the module fails
 * loudly instead of silently storing plaintext passwords.
 *
 * Format of an encrypted value:
 *   `enc:v1:<base64(iv)>:<base64(authTag)>:<base64(ciphertext)>`
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 12
const SALT = 'edd-app-template:db-admin:v1'
const PREFIX = 'enc:v1:'

let cachedKey: Buffer | null = null

function getKey(): Buffer {
  if (cachedKey) return cachedKey
  const secret = process.env.DB_CONFIG_SECRET
  if (!secret || secret.length < 16) {
    throw new Error(
      'DB_CONFIG_SECRET is not set or too short (min 16 chars). ' +
        'Required to encrypt database admin profiles.',
    )
  }
  cachedKey = scryptSync(secret, SALT, KEY_LENGTH)
  return cachedKey
}

export function isEncryptionAvailable(): boolean {
  try {
    getKey()
    return true
  } catch {
    return false
  }
}

export function encryptString(plaintext: string): string {
  if (plaintext === '') return ''
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return (
    PREFIX +
    [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join(':')
  )
}

export function decryptString(payload: string): string {
  if (payload === '') return ''
  if (!payload.startsWith(PREFIX)) {
    // Legacy / plaintext fallback — return as-is so we don't break older stores.
    return payload
  }
  const parts = payload.slice(PREFIX.length).split(':')
  if (parts.length !== 3) throw new Error('Malformed encrypted payload')
  const key = getKey()
  const [ivB64, tagB64, ctB64] = parts
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(tagB64, 'base64')
  const ciphertext = Buffer.from(ctB64, 'base64')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plaintext.toString('utf8')
}

/**
 * Test-only: reset the cached key so a new DB_CONFIG_SECRET takes effect.
 */
export function __resetCryptoForTests(): void {
  cachedKey = null
}
