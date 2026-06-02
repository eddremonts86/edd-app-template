import type { TFunction } from 'i18next'
import type { NavItem } from './types'

export const getNavItems = (t: TFunction): NavItem[] => [
  { id: 'docs', label: t('nav.docs', 'Docs'), href: '#docs' },
  { id: 'github', label: 'GitHub', href: 'https://github.com/eddremonts86/edd-app-template' },
]

export const getDashboardItem = (): NavItem => ({
  id: 'dashboard',
  label: 'Dashboard',
  to: '/dashboard',
})
