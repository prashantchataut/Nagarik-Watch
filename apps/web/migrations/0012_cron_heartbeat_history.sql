-- Cron last-run plus append-only history so /admin/launch can prove a 48-hour
-- green window. Production must apply this via `pnpm migrate:ops` (no live DDL).

CREATE TABLE IF NOT EXISTS nw_cron_heartbeats (
  job TEXT PRIMARY KEY,
  last_run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nw_cron_run_history (
  id BIGSERIAL PRIMARY KEY,
  job TEXT NOT NULL,
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nw_cron_run_history_job_run_idx
  ON nw_cron_run_history (job, run_at DESC);
