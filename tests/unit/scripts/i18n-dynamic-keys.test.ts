import { describe, expect, it, vi } from 'vitest'
import {
  checkDynamicUsage,
  parseDynamicKey,
  type DynamicKey,
} from '../../../scripts/i18n/check-translations'

/**
 * The rules behind `pnpm i18n:check`'s dynamic-key pass.
 *
 * `t(`billing.error.${code}`)` was invisible to that gate: deleting the key
 * from en, es and dk left it printing "All translations are complete" while the
 * UI rendered the raw key. These are the cases that made the first version of
 * the rule wrong, pinned so a later simplification cannot quietly undo them.
 */

// The scan prints its findings; the tests read the return value.
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'error').mockImplementation(() => {})

function key(template: string, call = ''): DynamicKey {
  const parsed = parseDynamicKey(template, 'fixture.tsx', call)
  if (!parsed) throw new Error(`fixture template is not parseable: ${template}`)
  return parsed
}

describe('parseDynamicKey', () => {
  it('splits a prefix and a suffix around one hole', () => {
    expect(key('home.items.${id}.title')).toMatchObject({
      prefix: 'home.items',
      suffix: 'title',
      holes: 1,
    })
  })

  it('reads a key that ends at the hole', () => {
    expect(key('billing.error.${code}')).toMatchObject({ prefix: 'billing.error', suffix: '' })
  })

  it.each([
    ['no hole at all', 'billing.error.unconfigured'],
    // Nothing resolvable precedes the hole, so any verdict would be a guess.
    ['a hole that opens the key', '${namespace}.title'],
    // `status_` is not a path, so the group it would name does not exist.
    ['a hole that opens mid-segment', 'status_${code}'],
  ])('declines to judge %s', (_name, template) => {
    expect(parseDynamicKey(template, 'fixture.tsx', '')).toBeUndefined()
  })
})

describe('checkDynamicUsage', () => {
  const catalogue = {
    home: {
      items: {
        first: { title: 'First', body: 'a' },
        second: { title: 'Second', body: 'b' },
      },
      // A group that holds the hole's values *and* a sibling that is not one.
      arc: {
        ariaLabel: 'What you get, and when',
        scaffold: { value: '60 s', label: 'scaffold' },
        app: { value: '1 h', label: 'app' },
      },
    },
    billing: { error: { rejected: 'no', unavailable: 'later' } },
    empty: {},
  }

  const check = (k: DynamicKey) => checkDynamicUsage([catalogue], [k])

  it('passes a group whose entries are all complete', () => {
    expect(check(key('home.items.${id}.title'))).toBe(0)
  })

  it('ignores a sibling that cannot be one of the hole values', () => {
    // `arc.ariaLabel` is a string, so it is not a stop and owes no `.label`.
    // Demanding one reported a bug that did not exist.
    expect(check(key('home.arc.${stop}.label'))).toBe(0)
  })

  it('reports an entry missing the field every sibling has', () => {
    const partial = {
      home: { items: { first: { title: 'First' }, second: { body: 'b' } } },
    }
    expect(checkDynamicUsage([partial], [key('home.items.${id}.title')])).toBe(1)
  })

  it('reports a group that does not exist', () => {
    expect(check(key('home.missing.${id}.title'))).toBe(1)
  })

  it('reports a prefix that is a string rather than a group', () => {
    expect(check(key('home.arc.ariaLabel.${x}'))).toBe(1)
  })

  it('reports an empty group', () => {
    expect(check(key('empty.${id}'))).toBe(1)
  })

  it('reports a group where no entry has the suffix at all', () => {
    // Prefix or suffix is wrong, so every lookup renders a raw key.
    expect(check(key('billing.error.${code}.text'))).toBe(1)
  })

  it('reports a leaf lookup that lands on a group', () => {
    expect(check(key('home.items.${id}'))).toBe(2)
  })

  it('allows a group lookup when the call asks for one', () => {
    expect(check(key('home.items.${id}', 't(`home.items.${id}`, { returnObjects: true })'))).toBe(0)
  })

  it('checks only the group when the path between two holes is unknown', () => {
    // `home.${a}.${b}.title` cannot be walked, but the group still must exist.
    expect(check(key('home.${section}.${id}.title'))).toBe(0)
    expect(check(key('nope.${section}.${id}.title'))).toBe(1)
  })
})
