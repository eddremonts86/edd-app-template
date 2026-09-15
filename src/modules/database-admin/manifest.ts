import { IconDatabase } from '@tabler/icons-react'
import type { AppModuleManifest } from '@/modules/core/types'

export const databaseAdminModule: AppModuleManifest = {
  id: 'database-admin',
  title: 'Database Administration',
  description:
    'Super-admin tools for managing database connection profiles, running migrations, and inspecting an audit trail.',
  enabledByDefault: true,
  routes: [{ path: '/dashboard/settings/database', kind: 'page' }],
  navigation: [
    {
      // Merges into the settings page's "Advanced" group, whose description
      // has always read "DB, logs, tokens" while the database tools lived in
      // the sidebar footer instead.
      id: 'system',
      title: 'Advanced',
      kind: 'settings',
      order: 30,
      items: [
        {
          id: 'database-admin',
          titleKey: 'databaseAdmin.nav.title',
          fallbackTitle: 'Database',
          to: '/dashboard/settings/database',
          icon: IconDatabase,
          requiredRole: 'super_admin',
          order: 10,
        },
      ],
    },
  ],
}
