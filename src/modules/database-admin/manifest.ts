import { IconDatabase } from '@tabler/icons-react'
import type { AppModuleManifest } from '@/modules/core/types'

export const databaseAdminModule: AppModuleManifest = {
  id: 'database-admin',
  title: 'Database Administration',
  description:
    'Super-admin tools for managing database connection profiles, running migrations, and inspecting an audit trail.',
  enabledByDefault: true,
  routes: [{ path: '/dashboard/admin/database', kind: 'page' }],
  navigation: [
    {
      id: 'admin',
      title: 'Administration',
      kind: 'secondary',
      order: 90,
      items: [
        {
          id: 'database-admin',
          titleKey: 'databaseAdmin.nav.title',
          fallbackTitle: 'Database',
          to: '/dashboard/admin/database',
          icon: IconDatabase,
          requiredRole: 'super_admin',
          order: 10,
        },
      ],
    },
  ],
}
