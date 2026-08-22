CREATE TABLE IF NOT EXISTS nw_public_content_snapshots (
  snapshot_key text PRIMARY KEY,
  source text NOT NULL,
  schema_version integer NOT NULL DEFAULT 1,
  payload jsonb NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nw_public_content_snapshots_captured_idx
  ON nw_public_content_snapshots(captured_at DESC);
