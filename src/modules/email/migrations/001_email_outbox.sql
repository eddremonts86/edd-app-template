-- email module — outbox
-- Owned by src/modules/email. Applied by pnpm db:migrate as
-- `module:email/001_email_outbox.sql`; see docs/architecture/integration-conventions.md §6.

CREATE TABLE IF NOT EXISTS email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient text NOT NULL,
  subject text NOT NULL,
  kind text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  provider_id text,
  failure_code text,
  dev_link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  settled_at timestamptz
);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS email_outbox_status_created_idx
  ON email_outbox (status, created_at);
