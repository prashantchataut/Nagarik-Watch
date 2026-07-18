-- Core operational schema for engagement, journalist desk, experiments, and first-party analytics.
-- Idempotent: safe to re-run beside legacy request-time ensureSchema helpers.

CREATE TABLE IF NOT EXISTS nw_bookmarks(
  id text primary key,
  owner_key text not null,
  article_slug text not null,
  article_category text,
  article_title_ne text,
  created_at timestamptz default now(),
  unique(owner_key,article_slug)
);

CREATE TABLE IF NOT EXISTS nw_comments(
  id text primary key,
  article_slug text not null,
  article_category text,
  author_name text not null,
  author_email text,
  author_user_id text,
  body_ne text not null,
  parent_id text,
  locale text not null default 'ne',
  status text not null default 'pending',
  toxicity_score double precision not null default 0,
  spam_score double precision not null default 0,
  moderation_flags text[] not null default '{}',
  moderation_verdict text,
  reputation_used double precision not null default 0.5,
  created_at timestamptz default now()
);
ALTER TABLE nw_comments ADD COLUMN IF NOT EXISTS toxicity_score double precision NOT NULL DEFAULT 0;
ALTER TABLE nw_comments ADD COLUMN IF NOT EXISTS spam_score double precision NOT NULL DEFAULT 0;
ALTER TABLE nw_comments ADD COLUMN IF NOT EXISTS moderation_flags text[] NOT NULL DEFAULT '{}';
ALTER TABLE nw_comments ADD COLUMN IF NOT EXISTS moderation_verdict text;
ALTER TABLE nw_comments ADD COLUMN IF NOT EXISTS reputation_used double precision NOT NULL DEFAULT 0.5;

CREATE TABLE IF NOT EXISTS nw_poll_votes(
  id text primary key,
  poll_id text not null,
  option_id text not null,
  voter_key text not null,
  created_at timestamptz default now(),
  unique(poll_id,voter_key)
);

CREATE TABLE IF NOT EXISTS nw_reading(
  id text primary key,
  owner_key text not null,
  article_slug text not null,
  article_category text,
  article_title_ne text,
  article_tag_slugs text[] not null default '{}',
  article_author_slugs text[] not null default '{}',
  read_percent integer not null,
  dwell_seconds integer not null default 0,
  completed boolean not null default false,
  sessions integer not null default 1,
  first_read_at timestamptz default now(),
  last_session_id text,
  last_session_seconds integer not null default 0,
  read_at timestamptz default now(),
  unique(owner_key,article_slug)
);
ALTER TABLE nw_reading ADD COLUMN IF NOT EXISTS dwell_seconds integer NOT NULL DEFAULT 0;
ALTER TABLE nw_reading ADD COLUMN IF NOT EXISTS completed boolean NOT NULL DEFAULT false;
ALTER TABLE nw_reading ADD COLUMN IF NOT EXISTS sessions integer NOT NULL DEFAULT 1;
ALTER TABLE nw_reading ADD COLUMN IF NOT EXISTS first_read_at timestamptz DEFAULT now();
ALTER TABLE nw_reading ADD COLUMN IF NOT EXISTS last_session_id text;
ALTER TABLE nw_reading ADD COLUMN IF NOT EXISTS last_session_seconds integer NOT NULL DEFAULT 0;
ALTER TABLE nw_reading ADD COLUMN IF NOT EXISTS article_tag_slugs text[] NOT NULL DEFAULT '{}';
ALTER TABLE nw_reading ADD COLUMN IF NOT EXISTS article_author_slugs text[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS nw_reading_owner_recent_idx ON nw_reading(owner_key, read_at DESC);

CREATE TABLE IF NOT EXISTS nw_ranking_events (
  id bigserial primary key,
  article_slug text not null,
  article_category text not null default '',
  event_type text not null,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS nw_ranking_events_slug_at_idx
  ON nw_ranking_events (article_slug, created_at DESC);

CREATE TABLE IF NOT EXISTS nw_search_events (
  id bigserial primary key,
  query_text text not null,
  normalized_query text not null,
  result_count integer not null,
  locale text not null,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS nw_search_events_query_at_idx
  ON nw_search_events (normalized_query, created_at DESC);

CREATE TABLE IF NOT EXISTS nw_experiment_events (
  id bigserial primary key,
  experiment_id text not null,
  variant_id text not null,
  visitor_hash text not null,
  event_type text not null,
  created_at timestamptz not null default now(),
  unique (experiment_id, visitor_hash, event_type)
);
CREATE INDEX IF NOT EXISTS nw_experiment_events_experiment_at_idx
  ON nw_experiment_events (experiment_id, created_at DESC);

CREATE TABLE IF NOT EXISTS nw_admin_settings (
  key text primary key,
  value text not null,
  label text not null,
  group_name text not null,
  updated_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS nw_journalist_draft_meta (
  article_slug text primary key,
  article_id text,
  title_ne text,
  category_slug text,
  workflow_stage text not null default 'draft',
  reporter_id text not null,
  reporting_location text,
  source_note text,
  editor_pitch text,
  media_reference_url text,
  custom_homepage_text text,
  custom_social_text text,
  notification_mode text not null default 'none',
  notification_tags jsonb not null default '[]'::jsonb,
  editor_feedback text,
  revision_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
ALTER TABLE nw_journalist_draft_meta ADD COLUMN IF NOT EXISTS article_id text;
ALTER TABLE nw_journalist_draft_meta ADD COLUMN IF NOT EXISTS title_ne text;
ALTER TABLE nw_journalist_draft_meta ADD COLUMN IF NOT EXISTS category_slug text;
ALTER TABLE nw_journalist_draft_meta ADD COLUMN IF NOT EXISTS workflow_stage text NOT NULL DEFAULT 'draft';
ALTER TABLE nw_journalist_draft_meta ADD COLUMN IF NOT EXISTS media_reference_url text;
ALTER TABLE nw_journalist_draft_meta ADD COLUMN IF NOT EXISTS notification_mode text NOT NULL DEFAULT 'none';
ALTER TABLE nw_journalist_draft_meta ADD COLUMN IF NOT EXISTS notification_tags jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE nw_journalist_draft_meta ADD COLUMN IF NOT EXISTS editor_feedback text;
ALTER TABLE nw_journalist_draft_meta ADD COLUMN IF NOT EXISTS revision_requested_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS nw_journalist_draft_meta_article_id_idx
  ON nw_journalist_draft_meta(article_id) WHERE article_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS nw_journalist_draft_meta_reporter_idx
  ON nw_journalist_draft_meta(reporter_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS nw_journalist_draft_revisions (
  id text primary key,
  article_id text,
  article_slug text not null,
  reporter_id text not null,
  actor_id text not null,
  actor_role text not null,
  action text not null check (action in ('saved', 'submitted', 'returned')),
  stage text not null,
  created_at timestamptz not null,
  content_hash text not null,
  snapshot jsonb not null
);
CREATE INDEX IF NOT EXISTS nw_journalist_draft_revisions_timeline_idx
  ON nw_journalist_draft_revisions(reporter_id, article_slug, created_at DESC);
CREATE INDEX IF NOT EXISTS nw_journalist_draft_revisions_article_id_idx
  ON nw_journalist_draft_revisions(reporter_id, article_id, created_at DESC)
  WHERE article_id IS NOT NULL;
