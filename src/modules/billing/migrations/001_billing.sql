-- billing module — customers, subscriptions, and the webhook idempotency ledger
-- Owned by src/modules/billing. Applied as `module:billing/001_billing.sql`;
-- see docs/architecture/integration-conventions.md §6.

CREATE TABLE IF NOT EXISTS billing_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  provider_customer_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS billing_customers_provider_idx
  ON billing_customers (provider_customer_id);

--> statement-breakpoint

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  provider_subscription_id text NOT NULL UNIQUE,
  status text NOT NULL,
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS billing_subscriptions_status_idx
  ON billing_subscriptions (status);

--> statement-breakpoint

-- The idempotency guard. The primary key is the provider's own event id, so a
-- retried delivery collides instead of being processed twice.
CREATE TABLE IF NOT EXISTS billing_events (
  event_id text PRIMARY KEY,
  type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);
