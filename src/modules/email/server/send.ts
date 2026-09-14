import { eq } from 'drizzle-orm'
import { getDb } from '@/shared/lib/db'
import { logger } from '@/shared/lib/observability'
import { emailOutbox } from '../model/schema'
import { resolveEmail, type EmailFailure } from './provider'

/**
 * Send an e-mail, and record that we tried.
 *
 * The row is written **before** the attempt, so a process that dies mid-send
 * leaves evidence rather than silence. With no provider configured the row is
 * still written, marked `captured`, and the link comes back to the caller — that
 * is the whole development and E2E transport, and it is why a verification flow
 * is testable without a Resend account.
 */

export type EmailKind = 'verification' | 'password-reset' | 'notification'

export interface SendRequest {
  to: string
  subject: string
  html: string
  text: string
  kind: EmailKind
  /**
   * The actionable URL in the message, if any. Returned to the caller when
   * unconfigured so a dev or a test can follow it. Never stored once a real
   * provider accepted the message — a live verification URL is a working
   * credential and has no business outliving the send.
   */
  link?: string
}

export type SendOutcome =
  { ok: true; id: string | null } | { ok: false; reason: EmailFailure; devLink?: string }

export async function sendEmail(request: SendRequest): Promise<SendOutcome> {
  const db = getDb()
  const provider = resolveEmail()

  const [row] = await db
    .insert(emailOutbox)
    .values({
      recipient: request.to,
      subject: request.subject,
      kind: request.kind,
      status: 'pending',
    })
    .returning({ id: emailOutbox.id })

  const outboxId = row!.id

  if (!provider) {
    await db
      .update(emailOutbox)
      .set({ status: 'captured', devLink: request.link ?? null, settledAt: new Date() })
      .where(eq(emailOutbox.id, outboxId))
    // No recipient in the log line; the row has it and the row is access-controlled.
    logger.info('email.captured', { kind: request.kind })
    return { ok: false, reason: 'unconfigured', devLink: request.link }
  }

  const result = await provider.send({
    to: request.to,
    subject: request.subject,
    html: request.html,
    text: request.text,
  })

  await db
    .update(emailOutbox)
    .set(
      result.ok
        ? { status: 'sent', providerId: result.id, settledAt: new Date() }
        : { status: 'failed', failureCode: result.reason, settledAt: new Date() },
    )
    .where(eq(emailOutbox.id, outboxId))

  return result.ok ? { ok: true, id: result.id } : { ok: false, reason: result.reason }
}
