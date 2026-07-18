-- Newsroom invitations, reader preferences, live coverage, and article persistence.

CREATE TABLE IF NOT EXISTS nw_user_invites (
  id text PRIMARY KEY,
  email text NOT NULL,
  role text NOT NULL,
  invited_by text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  token_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  revoked_at timestamptz
);
ALTER TABLE nw_user_invites ADD COLUMN IF NOT EXISTS token_hash text;
ALTER TABLE nw_user_invites ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days');
ALTER TABLE nw_user_invites ADD COLUMN IF NOT EXISTS accepted_at timestamptz;
ALTER TABLE nw_user_invites ADD COLUMN IF NOT EXISTS revoked_at timestamptz;
CREATE INDEX IF NOT EXISTS nw_user_invites_email_idx ON nw_user_invites(email, status);
CREATE UNIQUE INDEX IF NOT EXISTS nw_user_invites_token_hash_idx ON nw_user_invites(token_hash) WHERE token_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS nw_reader_preferences (
  owner_key text PRIMARY KEY,
  categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  authors jsonb NOT NULL DEFAULT '[]'::jsonb,
  provinces jsonb NOT NULL DEFAULT '[]'::jsonb,
  breaking boolean NOT NULL DEFAULT true,
  followed_topics boolean NOT NULL DEFAULT true,
  followed_authors boolean NOT NULL DEFAULT true,
  daily_digest boolean NOT NULL DEFAULT false,
  browser_alerts boolean NOT NULL DEFAULT false,
  quiet_start integer,
  quiet_end integer,
  time_zone text NOT NULL DEFAULT 'Asia/Kathmandu',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE nw_reader_preferences ADD COLUMN IF NOT EXISTS time_zone text NOT NULL DEFAULT 'Asia/Kathmandu';

CREATE TABLE IF NOT EXISTS nw_live_blogs (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title_ne text NOT NULL,
  title_en text,
  summary_ne text,
  summary_en text,
  status text NOT NULL DEFAULT 'scheduled',
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  ended_at timestamptz
);

CREATE TABLE IF NOT EXISTS nw_live_blog_updates (
  id text PRIMARY KEY,
  live_blog_id text NOT NULL REFERENCES nw_live_blogs(id) ON DELETE CASCADE,
  body_ne text NOT NULL,
  body_en text,
  author_email text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nw_live_blog_updates_blog_idx ON nw_live_blog_updates(live_blog_id, created_at DESC);

CREATE TABLE IF NOT EXISTS nw_live_manual (
  key text PRIMARY KEY,
  source text NOT NULL,
  data jsonb NOT NULL,
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
CREATE UNIQUE INDEX IF NOT EXISTS nw_articles_category_slug_uidx
  ON nw_articles (category_slug, slug);
