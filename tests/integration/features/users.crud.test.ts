import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createUserFn, deleteUserFn, updateUserFn } from '@/modules/users'
import { getDb } from '@/shared/lib/db'

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => {
    const chain: {
      inputValidator: () => typeof chain
      handler: (fn: (args: unknown) => unknown) => (args: unknown) => Promise<unknown>
    } = {
      inputValidator: () => chain,
      handler: (fn) => async (args) => fn(args),
    }
    return chain
  },
}))

vi.mock('@/shared/lib/db', () => ({
  getDb: vi.fn(),
}))

// Auth mocks — server functions run outside TanStack Start runtime in unit tests
vi.mock('@/shared/lib/auth/authorize', () => ({
  requirePermission: vi.fn().mockResolvedValue(undefined),
  can: vi.fn().mockResolvedValue(true),
  canOnResource: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/shared/lib/auth/server', () => ({
  requireAuthUser: vi.fn().mockResolvedValue({
    authMode: 'local',
    provider: 'bypass',
    userId: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    role: 'super_admin',
  }),
  getAuthUser: vi.fn().mockResolvedValue({
    authMode: 'local',
    provider: 'bypass',
    userId: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    image: null,
    role: 'super_admin',
  }),
}))

vi.mock('@/modules/users/api/current-user.server', () => ({
  getCurrentAppUser: vi.fn().mockResolvedValue({
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    avatar: null,
    authUserId: 'test-user-id',
    roleKey: 'super_admin',
  }),
  requireCurrentAppUser: vi.fn().mockResolvedValue({
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    avatar: null,
    authUserId: 'test-user-id',
    roleKey: 'super_admin',
  }),
}))

describe('Users CRUD server functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a user', async () => {
    const createdAt = new Date('2026-03-03T10:00:00.000Z')
    const updatedAt = new Date('2026-03-03T10:00:00.000Z')

    const dbMock = {
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([
            {
              id: 'user-1',
              name: 'User One',
              email: 'user1@example.com',
              avatar: null,
              authUserId: null,
              createdAt,
              updatedAt,
            },
          ]),
        })),
      })),
      update: vi.fn(),
      delete: vi.fn(),
      select: vi.fn(),
    }

    vi.mocked(getDb).mockReturnValue(dbMock as never)

    const result = await createUserFn({
      data: {
        name: 'User One',
        email: 'user1@example.com',
        avatar: null,
      },
    })

    expect(dbMock.insert).toHaveBeenCalled()
    expect(result.email).toBe('user1@example.com')
  })

  it('updates a user', async () => {
    const createdAt = new Date('2026-03-03T10:00:00.000Z')
    const updatedAt = new Date('2026-03-03T11:00:00.000Z')

    const dbMock = {
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([
              {
                id: 'user-1',
                name: 'User One Updated',
                email: 'user1+updated@example.com',
                avatar: null,
                authUserId: null,
                createdAt,
                updatedAt,
              },
            ]),
          })),
        })),
      })),
      insert: vi.fn(),
      delete: vi.fn(),
      select: vi.fn(),
    }

    vi.mocked(getDb).mockReturnValue(dbMock as never)

    const result = await updateUserFn({
      data: {
        id: 'user-1',
        data: {
          name: 'User One Updated',
          email: 'user1+updated@example.com',
        },
      },
    })

    expect(dbMock.update).toHaveBeenCalled()
    expect(result.id).toBe('user-1')
    expect(result.name).toBe('User One Updated')
  })

  it('deletes a user', async () => {
    // deleteUserFn first looks up the target user, then deletes
    const selectChain = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    }

    const dbMock = {
      delete: vi.fn(() => ({
        where: vi.fn().mockResolvedValue(undefined),
      })),
      insert: vi.fn(),
      update: vi.fn(),
      select: vi.fn(() => selectChain),
    }

    vi.mocked(getDb).mockReturnValue(dbMock as never)

    const result = await deleteUserFn({ data: 'user-1' })

    expect(dbMock.delete).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ success: true })
  })
})
