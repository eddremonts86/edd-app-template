import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

/**
 * Every send, recorded before it is attempted.
 *
 * A failed send is retryable rather than lost, and in development it is the
 * whole transport: the dev sender writes the row and returns the link instead of
 * delivering, which is what makes a verification flow testable without a
 * third-party account (docs/architecture/integration-conventions.md §9.1).
 *
 * Owned by this module. Prefixed `email_` so copying the directory into another
 * app cannot collide, and it references nothing outside itself — not even
 * users.id, because a message may be addressed to somebody with no account yet.
 */
export const emailOutbox = pgTable(
  'email_outbox',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Recipient. Personal data: never copied into a log line. */
    recipient: text('recipient').notNull(),
    subject: text('subject').notNull(),
    /** 'verification' | 'password-reset' | 'notification' — free-form so an app can add its own. */
    kind: text('kind').notNull(),
    /** 'pending' | 'sent' | 'failed' | 'captured' */
    status: text('status').notNull().default('pending'),
    /** The provider's id when it accepted, null otherwise. */
    providerId: text('provider_id'),
    /** A stable failure code, never a provider message that might carry the payload back. */
    failureCode: text('failure_code'),
    /**
     * The dev transport keeps the rendered link here so a test can follow it.
     * Null in production: a live verification URL is a working credential and
     * has no business outliving the send.
     */
    devLink: text('dev_link'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    settledAt: timestamp('settled_at', { withTimezone: true }),
  },
  (table) => [index('email_outbox_status_created_idx').on(table.status, table.createdAt)],
)

export type EmailOutboxRow = typeof emailOutbox.$inferSelect
