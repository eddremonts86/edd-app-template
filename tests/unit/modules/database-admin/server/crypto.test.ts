import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  __resetCryptoForTests,
  decryptString,
  encryptString,
  isEncryptionAvailable,
} from '@/modules/database-admin/server/crypto'

const withSecret = (value: string | undefined) => {
  const prev = process.env.DB_CONFIG_SECRET
  if (typeof value === 'undefined') {
    delete process.env.DB_CONFIG_SECRET
  } else {
    process.env.DB_CONFIG_SECRET = value
  }
  return () => {
    if (typeof prev === 'undefined') {
      delete process.env.DB_CONFIG_SECRET
    } else {
      process.env.DB_CONFIG_SECRET = prev
    }
  }
}

describe('isEncryptionAvailable', () => {
  let restore: () => void

  beforeEach(() => {
    __resetCryptoForTests()
  })

  afterEach(() => {
    restore?.()
    __resetCryptoForTests()
  })

  it('returns false when DB_CONFIG_SECRET is not set', () => {
    restore = withSecret(undefined)
    expect(isEncryptionAvailable()).toBe(false)
  })

  it('returns false when DB_CONFIG_SECRET is too short (<16 chars)', () => {
    restore = withSecret('tooshort')
    expect(isEncryptionAvailable()).toBe(false)
  })

  it('returns true when DB_CONFIG_SECRET is valid', () => {
    restore = withSecret('this-is-a-valid-secret-32-chars!!')
    expect(isEncryptionAvailable()).toBe(true)
  })
})

describe('encryptString / decryptString', () => {
  let restore: () => void

  beforeEach(() => {
    restore = withSecret('test-secret-that-is-long-enough!!')
    __resetCryptoForTests()
  })

  afterEach(() => {
    restore()
    __resetCryptoForTests()
  })

  it('encrypts a string to the enc:v1: prefix format', () => {
    const result = encryptString('my-password')
    expect(result).toMatch(/^enc:v1:/)
    expect(result).not.toBe('my-password')
  })

  it('round-trips: encrypt then decrypt returns original value', () => {
    const original = 'super-secret-db-password'
    const encrypted = encryptString(original)
    const decrypted = decryptString(encrypted)
    expect(decrypted).toBe(original)
  })

  it('each encryption produces a different ciphertext (random IV)', () => {
    const a = encryptString('same-value')
    const b = encryptString('same-value')
    expect(a).not.toBe(b)
    expect(decryptString(a)).toBe('same-value')
    expect(decryptString(b)).toBe('same-value')
  })

  it('returns empty string for empty input (no-op)', () => {
    expect(encryptString('')).toBe('')
    expect(decryptString('')).toBe('')
  })

  it('returns plaintext as-is if not enc:v1: prefixed (legacy fallback)', () => {
    const plain = 'some-plain-value'
    expect(decryptString(plain)).toBe(plain)
  })

  it('throws on malformed enc:v1: payload', () => {
    expect(() => decryptString('enc:v1:onlyone')).toThrow('Malformed encrypted payload')
  })

  it('throws on tampered ciphertext (auth tag mismatch)', () => {
    const encrypted = encryptString('tamper-me')
    // flip last character of the ciphertext part
    const tampered = encrypted.slice(0, -1) + (encrypted.endsWith('A') ? 'B' : 'A')
    expect(() => decryptString(tampered)).toThrow()
  })
})
