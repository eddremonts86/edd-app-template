import { IconMail } from '@tabler/icons-react'
import type { AppModuleManifest } from '@/modules/core/types'

export const contactMessagesModule: AppModuleManifest = {
  id: 'contact-messages',
  title: 'Contact Messages',
  description:
    'Capture landing contact briefs, notify admins, and manage follow-up from dashboard.',
  routes: [{ path: '/dashboard/contact-messages', kind: 'page' }],
  navigation: [
    {
      id: 'administration',
      title: 'Administration',
      kind: 'main',
      order: 40,
      items: [
        {
          id: 'contact-messages',
          titleKey: 'sidebar.main.contactMessages',
          fallbackTitle: 'Contact Messages',
          to: '/dashboard/contact-messages',
          icon: IconMail,
          order: 20,
          requiredRole: 'admin',
        },
      ],
    },
  ],
}
