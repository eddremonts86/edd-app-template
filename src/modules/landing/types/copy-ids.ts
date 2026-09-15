import enCommon from '@/shared/lib/i18n/locales/en/common.json'

/**
 * The ids the landing scenes render, taken from the copy itself.
 *
 * Each scene used to keep its own list beside the catalogue, and the two could
 * drift: add an entry to the array without the copy and the page renders the
 * raw key at a visitor. `pnpm i18n:check` cannot see that — it reads the
 * catalogue, not the arrays — and none of these calls has an inline default to
 * fall back to.
 *
 * Deriving the union here makes the drift a compile error instead. No runtime
 * cost: `i18n.ts` already imports this file, so it is the same module.
 *
 * The reverse direction — copy for an id no scene renders — stays legal. It is
 * dead text, not a broken page, and the checker reports the shape problems that
 * actually matter (docs/architecture/integration-conventions.md §7).
 */
type Home = (typeof enCommon)['home']

export type ManifestoItemId = keyof Home['manifesto']['items']
export type FrictionRowId = keyof Home['friction']['rows']
export type FiveDaysDayId = keyof Home['fiveDays']['days']
export type FirstHourStackItemId = keyof Home['firstHour']['stack']['items']
export type FirstMinuteBoxId = keyof Home['firstMinute']['boxes']
/** `arc` holds only stops now; its aria label moved out to `arcAriaLabel`. */
export type OpeningArcStopId = keyof Home['opening']['arc']

/**
 * Scenes whose only per-entry data is the id read it straight from the copy, so
 * there is one list rather than two that must agree. Order is the catalogue's,
 * which is also the order a translator sees.
 */
export const manifestoItemIds = Object.keys(
  enCommon.home.manifesto.items,
) as readonly ManifestoItemId[]

export const frictionRowIds = Object.keys(enCommon.home.friction.rows) as readonly FrictionRowId[]
