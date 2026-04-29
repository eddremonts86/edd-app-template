import { useTQuery, useTQInfinite, useTQMutation } from '@/shared/lib/query'
import type { User } from '../model/types'
import {
  type UserInput,
  createUserFn,
  deleteUserFn,
  getUserByIdFn,
  getUsersFn,
  updateUserFn,
} from './users.fn'

function normalizeParams(limit: number, search?: string) {
  return {
    limit,
    search: search?.trim() || undefined,
  }
}

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  infinite: (params: ReturnType<typeof normalizeParams>) =>
    [...userKeys.lists(), 'infinite', params] as const,
  lookup: (params: { limit: number }) => [...userKeys.lists(), 'lookup', params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

export const useInfiniteUsers = (limit = 10, search?: string) => {
  const params = normalizeParams(limit, search)

  return useTQInfinite(
    userKeys.infinite(params),
    ({ pageParam }) => getUsersFn({ data: { pageParam, ...params } }),
    {
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
      placeholderData: (prev) => prev,
      maxPages: 50,
    },
  )
}

export const useUsers = (limit = 1000, options?: { enabled?: boolean }) =>
  useTQuery(
    userKeys.lookup({ limit }),
    () => getUsersFn({ data: { limit } }).then((res) => res?.data || []),
    { cache: 'stable' as const, enabled: options?.enabled !== false },
  )

export const useUserById = (id: string) =>
  useTQuery<User | null>(userKeys.detail(id), () => getUserByIdFn({ data: id }), {
    enabled: Boolean(id),
  })

export const useCreateUser = () =>
  useTQMutation(
    ['users', 'create'],
    (data: UserInput) => createUserFn({ data }),
    { invalidateKeys: [userKeys.all] },
  )

export const useUpdateUser = () =>
  useTQMutation(
    ['users', 'update'],
    ({ id, data }: { id: string; data: Partial<UserInput> }) =>
      updateUserFn({ data: { id, data } }),
    { invalidateKeys: [userKeys.all] },
  )

export const useDeleteUser = () =>
  useTQMutation(
    ['users', 'delete'],
    (id: string) => deleteUserFn({ data: id }),
    { invalidateKeys: [userKeys.all] },
  )
