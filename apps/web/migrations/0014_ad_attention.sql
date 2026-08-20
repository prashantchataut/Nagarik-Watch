-- Attention measurement used by the 30-day ad operations report.
-- Production applies this with pnpm migrate:ops; request paths do not alter schema.

ALTER TABLE nw_ad_events ADD COLUMN IF NOT EXISTS attention double precision;
