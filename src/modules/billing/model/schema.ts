import { boolean, index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

/**
 * Billing state this app owns.
 *
 * Read from here, never from the provider on the request path
 * (docs/architecture/integration-conventions.md §9.2). A page that asks Stripe
 * whether the visitor is paying is a page that goes down when Stripe does, and
 * that pays a round-trip on every render. The webhook keeps these rows current.
 *
 * Prefixed `billing_`, owned by this module, and referencing nothing outside it
 * except a user id — which is the one cross-module reference the conventions
 * allow, and it is stored as text rather than a foreign key so the module can be
 * copied into an app whose users table is shaped differently.
 */

export const billingCustomers = pgTable(
  'billing_customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** The app's user id. Text, not an FK — see the note above. */
    userId: text('user_id').notNull().unique(),
    /** The provider's customer id. */
    providerCustomerId: text('provider_customer_id').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('billing_customers_provider_idx').on(table.providerCustomerId)],
)

export const billingSubscriptions = pgTable(
  'billing_subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().unique(),
    providerSubscriptionId: text('provider_subscription_id').notNull().unique(),
    /** Verbatim from the provider. `isPaying()` decides what it means. */
    status: text('status').notNull(),
    priceId: text('price_id'),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('billing_subscriptions_status_idx').on(table.status)],
)

/**
 * Every webhook event we have accepted, keyed by the provider's own event id.
 *
 * This is the idempotency guard, and it is not optional: providers retry, and a
 * retry that charges, provisions or cancels twice is the worst class of bug this
 * module can have. The insert is what makes an event "seen"; a duplicate insert
 * fails on the primary key and the handler stops.
 */
export const billingEvents = pgTable('billing_events', {
  /** The provider's event id, e.g. `evt_…`. Primary key on purpose. */
  eventId: text('event_id').primaryKey(),
  type: text('type').notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
})

export type BillingCustomerRow = typeof billingCustomers.$inferSelect
export type BillingSubscriptionRow = typeof billingSubscriptions.$inferSelect
