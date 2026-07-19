-- Product-functional algorithm support: consented interactions, RUM samples, run audit.

CREATE TABLE IF NOT EXISTS nw_interactions (
  owner_key text NOT NULL,
  article_slug text NOT NULL,
  weight double precision NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_key, article_slug)
);
CREATE INDEX IF NOT EXISTS nw_interactions_slug_idx ON nw_interactions(article_slug);
CREATE INDEX IF NOT EXISTS nw_interactions_updated_idx ON nw_interactions(updated_at DESC);

CREATE TABLE IF NOT EXISTS nw_rum_samples (
  id bigserial PRIMARY KEY,
  metric_name text NOT NULL,
  metric_value double precision NOT NULL,
  path text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nw_rum_samples_name_at_idx
  ON nw_rum_samples (metric_name, created_at DESC);

CREATE TABLE IF NOT EXISTS nw_algorithm_runs (
  id bigserial PRIMARY KEY,
  algorithm_id text NOT NULL,
  ok boolean NOT NULL,
  mode text NOT NULL,
  detail text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nw_algorithm_runs_id_at_idx
  ON nw_algorithm_runs (algorithm_id, created_at DESC);
