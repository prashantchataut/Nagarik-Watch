-- Migrate nw_rate_limits from legacy fixed-window (count/reset_at) to token bucket.
-- Safe to run repeatedly. Runtime ensureSchema in rate-limit.ts mirrors this.

ALTER TABLE nw_rate_limits ADD COLUMN IF NOT EXISTS tokens double precision;
ALTER TABLE nw_rate_limits ADD COLUMN IF NOT EXISTS capacity double precision;
ALTER TABLE nw_rate_limits ADD COLUMN IF NOT EXISTS refill_per_ms double precision;
ALTER TABLE nw_rate_limits ADD COLUMN IF NOT EXISTS last_refill_at timestamptz DEFAULT now();

UPDATE nw_rate_limits SET
  tokens = COALESCE(tokens, 0),
  capacity = COALESCE(capacity, 60),
  refill_per_ms = COALESCE(refill_per_ms, 0.001),
  last_refill_at = COALESCE(last_refill_at, now())
WHERE tokens IS NULL
   OR capacity IS NULL
   OR refill_per_ms IS NULL
   OR last_refill_at IS NULL;

DROP INDEX IF EXISTS nw_rate_limits_reset_idx;
ALTER TABLE nw_rate_limits DROP COLUMN IF EXISTS count;
ALTER TABLE nw_rate_limits DROP COLUMN IF EXISTS reset_at;

CREATE INDEX IF NOT EXISTS nw_rate_limits_refill_idx ON nw_rate_limits(last_refill_at);
