export type ContactProjectType = 'saas' | 'landing' | 'webapp'

export interface ContactMessage {
  id: string
  email: string
  projectType: ContactProjectType | string
  message: string | null
  status: 'new' | 'read'
  createdAt: string
  updatedAt: string
}

export interface ContactNotification {
  id: string
  title: string
  body: string
  link: string | null
  entityId: string | null
  isRead: boolean
  createdAt: string
}

export interface ContactMessagesListResponse {
  data: ContactMessage[]
  totalCount: number
  unreadCount: number
}
