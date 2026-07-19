-- Durable Stripe membership entitlements and idempotent webhook receipts.

CREATE TABLE IF NOT EXISTS nw_membership_entitlements (
  email text PRIMARY KEY,
  provider text NOT NULL,
  status text NOT NULL,
  plan text NOT NULL,
  customer_id text,
  subscription_id text UNIQUE,
  current_period_end timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nw_membership_entitlements_active_idx
  ON nw_membership_entitlements (status, current_period_end);

CREATE TABLE IF NOT EXISTS nw_payment_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);
