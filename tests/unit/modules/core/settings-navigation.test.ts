import { describe, expect, it } from 'vitest'
import { getSettingsNavigation, getSidebarNavigation } from '@/modules/core/navigation'

/**
 * Where a module's navigation entry comes out.
 *
 * Billing and the database tools used to sit in the sidebar footer beside Help,
 * which reads as "utilities" when both are settings — and one of them is a
 * `/dashboard/settings/*` route. They declare `kind: 'settings'` now, and the
 * two readers must not both claim them.
 */

const t = ((key: string, options?: { defaultValue?: string }) =>
  options?.defaultValue ?? key) as never

describe('getSettingsNavigation', () => {
  it('returns the sections modules contribute to the settings page', () => {
    const sections = getSettingsNavigation({ t, roleKey: 'super_admin' })
    expect(sections.map((section) => section.id)).toContain('billing')
  })

  it('merges into a section id the settings page already owns', () => {
    // The database tools join "Advanced" rather than opening a group of their
    // own; its description has always read "DB, logs, tokens".
    const advanced = getSettingsNavigation({ t, roleKey: 'super_admin' }).find(
      (section) => section.id === 'system',
    )
    expect(advanced?.items.map((item) => item.url)).toContain('/dashboard/settings/database')
  })

  it('is ordered, so a module lands where its manifest says', () => {
    const orders = getSettingsNavigation({ t, roleKey: 'super_admin' }).map(
      (section) => section.order,
    )
    expect([...orders]).toEqual([...orders].sort((left, right) => left - right))
  })

  it('hides an item the role cannot reach', () => {
    const asUser = getSettingsNavigation({ t, roleKey: 'user' })
    const urls = asUser.flatMap((section) => section.items.map((item) => item.url))
    expect(urls).not.toContain('/dashboard/settings/database')
    // A section left with no items is dropped, not rendered empty.
    expect(asUser.find((section) => section.id === 'system')?.items ?? []).toEqual([])
  })
})

describe('getSidebarNavigation', () => {
  it('no longer claims the settings entries', () => {
    const { main, secondary } = getSidebarNavigation({ t, roleKey: 'super_admin' })
    const urls = [...main.flatMap((section) => section.items), ...secondary].map((item) => item.url)
    expect(urls).not.toContain('/dashboard/settings/billing')
    expect(urls).not.toContain('/dashboard/settings/database')
  })

  it('still carries the entries that are not settings', () => {
    const { secondary } = getSidebarNavigation({ t, roleKey: 'super_admin' })
    expect(secondary.map((item) => item.url)).toContain('/dashboard/help')
  })
})
