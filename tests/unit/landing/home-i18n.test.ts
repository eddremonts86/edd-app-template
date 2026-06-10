import { describe, expect, it } from 'vitest'
import dk from '@/shared/lib/i18n/locales/dk/common.json'
import en from '@/shared/lib/i18n/locales/en/common.json'
import es from '@/shared/lib/i18n/locales/es/common.json'

const locales = { en, es, dk } as const

const getPath = (obj: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part]
    }
    return undefined
  }, obj)

// One representative key per scene block, plus every dynamic prefix the scenes build.
const REQUIRED_KEYS = [
  'home.opening.badge',
  'home.opening.title',
  'home.opening.titleHighlight',
  'home.opening.description',
  'home.opening.arc.scaffold.value',
  'home.opening.arc.app.label',
  'home.opening.arc.production.label',
  'home.opening.scrollCue',
  'home.friction.title',
  'home.friction.withStarter',
  'home.friction.fromScratch',
  'home.friction.rows.auth.starter',
  'home.friction.rows.architecture.scratch',
  'home.friction.rows.tests.name',
  'home.friction.rows.ai.starter',
  'home.friction.rows.docker.scratch',
  'home.firstMinute.title',
  'home.firstMinute.boxes.appShell.description',
  'home.firstMinute.boxes.modules.tag',
  'home.firstMinute.boxes.integrations.title',
  'home.firstHour.title',
  'home.firstHour.tabs.auth',
  'home.firstHour.mock.signIn',
  'home.firstHour.mock.recentActivity',
  'home.firstHour.stack.title',
  'home.firstHour.stack.items.ai.description',
  'home.firstHour.stack.items.quality.title',
  'home.fiveDays.title',
  'home.fiveDays.progress.stats',
  'home.fiveDays.days.day1.tasks.0',
  'home.fiveDays.days.day3.subtitle',
  'home.fiveDays.days.day5.tasks.2',
  'home.fiveDays.commandLabel',
  'home.manifesto.items.structure.statement',
  'home.manifesto.items.security.proof',
  'home.manifesto.items.longevity.title',
  'home.contact.title',
  'home.contact.form.email.label',
  'home.contact.form.projectType.options.saas',
  'home.contact.form.messages.successTitle',
  'home.contact.aside.github.description',
  'home.contact.aside.updates.title',
  'home.footer.backToTop',
  'home.footer.description',
] as const

describe('landing home namespace', () => {
  for (const [name, locale] of Object.entries(locales)) {
    it(`has every scene key in "${name}"`, () => {
      const missing = REQUIRED_KEYS.filter((key) => {
        const value = getPath(locale, key)
        return typeof value !== 'string' || value.length === 0
      })
      expect(missing).toEqual([])
    })

    it(`has no leftover legacy landing keys in "${name}"`, () => {
      expect(getPath(locale, 'landing')).toBeUndefined()
      expect(getPath(locale, 'home.hero')).toBeUndefined()
      expect(getPath(locale, 'home.comparison')).toBeUndefined()
      expect(getPath(locale, 'home.plan')).toBeUndefined()
      expect(getPath(locale, 'home.services')).toBeUndefined()
      expect(getPath(locale, 'home.features')).toBeUndefined()
    })
  }
})
