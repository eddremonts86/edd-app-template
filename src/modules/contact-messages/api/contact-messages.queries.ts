import { useTQMutation, useTQuery } from '@/shared/lib/query'
import type { ContactMessageInput } from './contact-messages.fn'
import {
  createContactMessageFn,
  getContactMessagesFn,
  getInboxNotificationsFn,
  markContactMessageReadFn,
  markNotificationsReadFn,
} from './contact-messages.fn'

const normalizeListParams = (
  limit: number,
  search?: string,
  status: 'new' | 'read' | 'all' = 'all',
) => ({
  limit,
  search: search?.trim() || undefined,
  status,
})

export const contactMessageKeys = {
  all: ['contact-messages'] as const,
  list: (params: ReturnType<typeof normalizeListParams>) =>
    [...contactMessageKeys.all, 'list', params] as const,
  notifications: (limit: number) => [...contactMessageKeys.all, 'notifications', limit] as const,
}

export const useCreateContactMessage = () =>
  useTQMutation(['contact-messages', 'create'], (data: ContactMessageInput) =>
    createContactMessageFn({ data }),
  )

export const useContactMessages = (
  limit = 50,
  search?: string,
  status: 'new' | 'read' | 'all' = 'all',
) => {
  const params = normalizeListParams(limit, search, status)
  return useTQuery(contactMessageKeys.list(params), () => getContactMessagesFn({ data: params }), {
    cache: 'standard' as const,
  })
}

export const useMarkContactMessageRead = () =>
  useTQMutation(
    ['contact-messages', 'mark-read'],
    ({ id, read }: { id: string; read: boolean }) =>
      markContactMessageReadFn({ data: { id, read } }),
    { invalidateKeys: [contactMessageKeys.all] },
  )

export const useInboxNotifications = (limit = 8) =>
  useTQuery(
    contactMessageKeys.notifications(limit),
    () => getInboxNotificationsFn({ data: { limit } }),
    { cache: 'realtime' as const },
  )

export const useMarkNotificationsRead = () =>
  useTQMutation(
    ['contact-messages', 'notifications-read'],
    (ids: string[]) => markNotificationsReadFn({ data: { ids } }),
    { invalidateKeys: [contactMessageKeys.all] },
  )
