import {
  IconAdjustmentsHorizontal,
  IconCode,
  IconLanguage,
  IconRobot,
  IconActivity,
  IconTool,
  IconPalette,
  IconShare,
} from '@tabler/icons-react'
import { Link, Outlet, useLocation } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/shared/lib/utils'
import { hasPermissionForRole } from '@/shared/lib/auth/permission-map'
import { useCurrentUser } from '@/modules/users'

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
}

interface NavSection {
  id: string
  label: string
  description: string
  icon: React.ElementType
  items: NavItem[]
  visible: boolean
  defaultOpen?: boolean
}

export function SettingsLayout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { roleKey } = useCurrentUser()

  const canAccessDeveloper = hasPermissionForRole(roleKey, 'site_settings.update')
  const canAccessSystem = hasPermissionForRole(roleKey, 'users.delete')

  const sections: NavSection[] = [
    {
      id: 'config',
      label: t('settings.nav.config'),
      description: t('settings.nav.configDesc'),
      icon: IconAdjustmentsHorizontal,
      visible: true,
      defaultOpen: !canAccessDeveloper || pathname.includes('/system'),
      items: [
        {
          label: t('settings.nav.languageTheme'),
          to: '/dashboard/settings/system',
          icon: IconLanguage,
        },
      ],
    },
    {
      id: 'developer',
      label: t('settings.nav.developer'),
      description: t('settings.nav.developerDesc'),
      icon: IconCode,
      visible: canAccessDeveloper,
      defaultOpen: pathname.includes('/ia_config') || pathname.includes('/dev_tools'),
      items: [
        {
          label: t('settings.nav.aiConfig'),
          to: '/dashboard/settings/ia_config',
          icon: IconRobot,
        },
        {
          label: t('settings.nav.devTools'),
          to: '/dashboard/settings/dev_tools',
          icon: IconTool,
        },
      ],
    },
    {
      id: 'system',
      label: t('settings.nav.system'),
      description: t('settings.nav.systemDesc'),
      icon: IconActivity,
      visible: canAccessSystem,
      defaultOpen: pathname.includes('/ai_logs'),
      items: [
        {
          label: t('settings.nav.aiLogs'),
          to: '/dashboard/settings/ai_logs',
          icon: IconActivity,
        },
      ],
    },
    {
      id: 'branding',
      label: t('settings.nav.branding'),
      description: t('settings.nav.brandingDesc'),
      icon: IconPalette,
      visible: canAccessDeveloper,
      defaultOpen: pathname.includes('/site_settings'),
      items: [
        {
          label: t('settings.nav.socialLinks'),
          to: '/dashboard/settings/site_settings',
          icon: IconShare,
        },
      ],
    },
  ]

  const visibleSections = sections.filter((s) => s.visible)

  return (
    <div className="w-full pb-6">
      <div className="flex flex-col gap-1 mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">{t('settings.title')}</h2>
        <p className="text-muted-foreground max-w-2xl">{t('settings.description')}</p>
      </div>

      <div className="flex gap-8 items-start">
        {/* Left nav */}
        <nav className="w-52 shrink-0 flex flex-col gap-1">
          {visibleSections.map((section) => (
            <SettingsNavSection key={section.id} section={section} currentPath={pathname} />
          ))}
        </nav>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

function SettingsNavSection({
  section,
  currentPath,
}: Readonly<{
  section: NavSection
  currentPath: string
}>) {
  const isAnyItemActive = section.items.some((item) => currentPath.startsWith(item.to))
  const [open, setOpen] = React.useState(section.defaultOpen ?? isAnyItemActive)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer group">
        <div className="flex items-center gap-2">
          <section.icon className="size-4 shrink-0" />
          <span>{section.label}</span>
        </div>
        <ChevronDown
          className={cn('size-3.5 transition-transform duration-200', open && 'rotate-180')}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-0.5 pl-3 pt-0.5">
          {section.items.map((item) => {
            const isActive = currentPath.startsWith(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'bg-accent text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <item.icon className="size-3.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
