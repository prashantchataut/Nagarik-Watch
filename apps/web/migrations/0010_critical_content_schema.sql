-- Critical newsroom ops tables that must exist before soft desk / cutover.
-- Lazy DDL remains as a safety net; migrate:ops is authoritative for production.

CREATE TABLE IF NOT EXISTS nw_taxonomy_terms (
  id text PRIMARY KEY,
  kind text NOT NULL,
  slug text NOT NULL,
  name_ne text NOT NULL,
  name_en text,
  description_ne text,
  description_en text,
  status text NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, slug)
);
CREATE INDEX IF NOT EXISTS nw_taxonomy_terms_kind_idx
  ON nw_taxonomy_terms(kind, status, sort_order);

CREATE TABLE IF NOT EXISTS nw_editor_preferences (
  user_id text PRIMARY KEY,
  default_category_slug text,
  autosave_seconds integer NOT NULL DEFAULT 30,
  density text NOT NULL DEFAULT 'comfortable',
  show_formatting_hints boolean NOT NULL DEFAULT true,
  preferred_locale text NOT NULL DEFAULT 'follow',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nw_articles (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  category_slug TEXT NOT NULL,
  workflow_stage TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL,
  document JSONB NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS nw_articles_slug_idx ON nw_articles(slug);
CREATE INDEX IF NOT EXISTS nw_articles_stage_idx ON nw_articles(workflow_stage, updated_at DESC);
