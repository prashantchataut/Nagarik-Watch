-- Administrative operations, monetization, media, audit, and taxonomy persistence.

CREATE TABLE IF NOT EXISTS nw_rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL,
  reset_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS nw_rate_limits_reset_idx ON nw_rate_limits(reset_at);

CREATE TABLE IF NOT EXISTS nw_ad_events (
  id bigserial PRIMARY KEY,
  placement_key text NOT NULL,
  mode text NOT NULL,
  event text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nw_ad_events_placement_idx ON nw_ad_events(placement_key, created_at DESC);

CREATE TABLE IF NOT EXISTS nw_house_ads (
  placement_key text PRIMARY KEY,
  active boolean NOT NULL DEFAULT false,
  title text NOT NULL,
  body text NOT NULL,
  cta text NOT NULL,
  href text NOT NULL,
  image_url text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nw_polls (
  id text PRIMARY KEY,
  question text NOT NULL,
  options jsonb NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nw_media_items (
  id text PRIMARY KEY,
  url text NOT NULL,
  alt text NOT NULL,
  caption text,
  credit text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nw_manual_subscriptions (
  email text PRIMARY KEY,
  status text NOT NULL DEFAULT 'active',
  plan text NOT NULL DEFAULT 'manual',
  note text,
  expires_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nw_audit_events (
  id text PRIMARY KEY,
  actor_id text NOT NULL,
  actor_email text NOT NULL,
  actor_role text NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  summary text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nw_audit_events_created_idx ON nw_audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS nw_audit_events_target_idx ON nw_audit_events(target_type, target_id, created_at DESC);

CREATE TABLE IF NOT EXISTS nw_taxonomy_terms (
  id text PRIMARY KEY,
  kind text NOT NULL,
  slug text NOT NULL,
  name_ne text NOT NULL,
  name_en text NOT NULL,
  description_ne text,
  description_en text,
  status text NOT NULL DEFAULT 'active',
  sort_order integer NOT NULL DEFAULT 100,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(kind, slug)
);
CREATE INDEX IF NOT EXISTS nw_taxonomy_terms_kind_idx ON nw_taxonomy_terms(kind, status, sort_order);
