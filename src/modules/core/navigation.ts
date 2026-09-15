import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import type { AppRoleKey } from '@/modules/users/model/permissions'
import { getEnabledModules } from './registry'
import type {
  AppModuleNavigationItem,
  SidebarRuntimeItem,
  SidebarRuntimeSection,
  ModuleActionId,
  ModuleBadgeId,
} from './types'

const ROLE_RANK: Record<AppRoleKey, number> = {
  user: 0,
  admin: 1,
  super_admin: 2,
}

function hasRequiredRole(requiredRole: AppRoleKey | undefined, userRole: AppRoleKey): boolean {
  if (!requiredRole) return true
  return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole]
}

interface SidebarNavigationOptions {
  t: TFunction
  roleKey?: AppRoleKey
  actions?: Partial<Record<ModuleActionId, () => void>>
  badges?: Partial<Record<ModuleBadgeId, ReactNode>>
}

function toSidebarItem(
  item: AppModuleNavigationItem,
  t: TFunction,
  actions?: Partial<Record<ModuleActionId, () => void>>,
  badges?: Partial<Record<ModuleBadgeId, ReactNode>>,
): SidebarRuntimeItem {
  return {
    title: t(item.titleKey, { defaultValue: item.fallbackTitle }),
    url: item.to,
    icon: item.icon,
    onClick: item.action ? actions?.[item.action] : undefined,
    badge: item.badgeId ? badges?.[item.badgeId] : undefined,
  }
}

export function getSidebarNavigation({
  t,
  roleKey = 'user',
  actions,
  badges,
}: SidebarNavigationOptions): {
  main: SidebarRuntimeSection[]
  secondary: SidebarRuntimeItem[]
} {
  const mainSections = new Map<string, SidebarRuntimeSection>()
  const secondaryItems: Array<SidebarRuntimeItem & { order: number }> = []

  for (const module of getEnabledModules()) {
    for (const section of module.navigation ?? []) {
      const sortedItems = [...section.items]
        .filter((item) => hasRequiredRole(item.requiredRole, roleKey))
        .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
      const runtimeItems = sortedItems.map((item) => toSidebarItem(item, t, actions, badges))

      // Settings sections are rendered by the settings page, not here.
      if (section.kind === 'settings') continue

      if (section.kind === 'secondary') {
        secondaryItems.push(
          ...runtimeItems.map((item, index) => ({ ...item, order: section.order * 100 + index })),
        )
        continue
      }

      const currentSection = mainSections.get(section.id)
      if (!currentSection) {
        mainSections.set(section.id, {
          title: section.title,
          order: section.order,
          items: runtimeItems,
        })
        continue
      }

      currentSection.items.push(...runtimeItems)
    }
  }

  return {
    main: [...mainSections.values()].sort((left, right) => left.order - right.order),
    secondary: secondaryItems.sort((left, right) => left.order - right.order),
  }
}

/**
 * The settings page's own navigation, contributed by modules.
 *
 * Sections are merged by id so a module can add an item to a group the settings
 * module already owns — the database tools belong under "Advanced", whose
 * description has always promised "DB, logs, tokens".
 *
 * How a section *looks* is not here: the settings page owns its labels and
 * icons, and a section whose items are all filtered out is not rendered at all.
 * That is what lets a clone disable a module and simply not see its group.
 */
/** A settings section keeps its id: the settings page merges by it. */
export interface SettingsRuntimeSection extends SidebarRuntimeSection {
  id: string
}

export function getSettingsNavigation({
  t,
  roleKey = 'user',
}: SidebarNavigationOptions): SettingsRuntimeSection[] {
  const sections = new Map<string, SettingsRuntimeSection>()

  for (const module of getEnabledModules()) {
    for (const section of module.navigation ?? []) {
      if (section.kind !== 'settings') continue

      const items = [...section.items]
        .filter((item) => hasRequiredRole(item.requiredRole, roleKey))
        .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
        .map((item) => toSidebarItem(item, t))

      const existing = sections.get(section.id)
      if (existing) {
        existing.items.push(...items)
        continue
      }
      sections.set(section.id, {
        id: section.id,
        title: section.titleKey
          ? t(section.titleKey, { defaultValue: section.title })
          : section.title,
        order: section.order,
        items,
      })
    }
  }

  return [...sections.values()].sort((left, right) => left.order - right.order)
}

export function getDashboardPageTitle(pathname: string, t: TFunction): string {
  const { main, secondary } = getSidebarNavigation({ t })
  const settings = getSettingsNavigation({ t, roleKey: 'super_admin' })
  const candidates = [
    ...main.flatMap((section) => section.items),
    ...secondary,
    // A settings page still needs a breadcrumb; the title lookup is read-only
    // and role-blind on purpose, since the route guard decides who gets there.
    ...settings.flatMap((section) => section.items),
  ].filter((item) => {
    if (!item.url) return false
    return item.url === '/dashboard'
      ? pathname === '/dashboard'
      : pathname === item.url || pathname.startsWith(`${item.url}/`)
  })

  const bestMatch = candidates.sort(
    (left, right) => (right.url?.length ?? 0) - (left.url?.length ?? 0),
  )[0]
  if (bestMatch) return bestMatch.title

  const lastSegment = pathname.split('/').filter(Boolean).pop() ?? 'dashboard'
  return t(`sidebar.main.${lastSegment}`, {
    defaultValue: lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1),
  })
}
