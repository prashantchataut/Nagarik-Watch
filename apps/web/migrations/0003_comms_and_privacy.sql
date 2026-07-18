-- Notifications, reader submissions, contact, and newsletter persistence.

CREATE TABLE IF NOT EXISTS nw_notification_events (
  id text PRIMARY KEY,
  article_id text NOT NULL,
  article_slug text NOT NULL,
  category_slug text NOT NULL,
  title_ne text NOT NULL,
  title_en text,
  author_slugs jsonb NOT NULL DEFAULT '[]'::jsonb,
  tag_slugs jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_breaking boolean NOT NULL DEFAULT false,
  notification_mode text NOT NULL DEFAULT 'none',
  notification_tag_slugs jsonb NOT NULL DEFAULT '[]'::jsonb,
  published_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(article_id, published_at)
);
ALTER TABLE nw_notification_events ADD COLUMN IF NOT EXISTS notification_mode text NOT NULL DEFAULT 'none';
ALTER TABLE nw_notification_events ADD COLUMN IF NOT EXISTS notification_tag_slugs jsonb NOT NULL DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS nw_notification_events_recent_idx
  ON nw_notification_events(published_at DESC);

CREATE TABLE IF NOT EXISTS nw_notification_receipts (
  owner_key text NOT NULL,
  event_id text NOT NULL REFERENCES nw_notification_events(id) ON DELETE CASCADE,
  seen_at timestamptz,
  read_at timestamptz,
  dismissed_at timestamptz,
  PRIMARY KEY(owner_key,event_id)
);
CREATE INDEX IF NOT EXISTS nw_notification_receipts_owner_seen_idx
  ON nw_notification_receipts(owner_key,seen_at DESC);

CREATE TABLE IF NOT EXISTS nw_push_subscriptions (
  id text PRIMARY KEY,
  endpoint_hash text NOT NULL UNIQUE,
  fingerprint text NOT NULL DEFAULT '',
  user_id text,
  locale text NOT NULL DEFAULT 'ne',
  endpoint text NOT NULL,
  expiration_time bigint,
  p256dh text NOT NULL,
  auth text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nw_push_subscriptions_active_idx
  ON nw_push_subscriptions(active,updated_at DESC);

CREATE TABLE IF NOT EXISTS nw_push_deliveries (
  event_id text NOT NULL,
  subscription_id text NOT NULL REFERENCES nw_push_subscriptions(id) ON DELETE CASCADE,
  status text NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  error text,
  PRIMARY KEY(event_id,subscription_id)
);
ALTER TABLE nw_push_deliveries ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS nw_submissions (
  id text PRIMARY KEY,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  headline text NOT NULL,
  description text NOT NULL,
  name text,
  email text,
  phone text,
  evidence_url text,
  anonymous boolean NOT NULL DEFAULT false,
  consent boolean NOT NULL DEFAULT false,
  locale text NOT NULL DEFAULT 'ne',
  ip_hash text NOT NULL,
  user_id text,
  editor_note text,
  handled_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nw_submissions_status_idx ON nw_submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS nw_submissions_type_idx ON nw_submissions(type, created_at DESC);

CREATE TABLE IF NOT EXISTS nw_contact_messages (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  locale text NOT NULL DEFAULT 'ne',
  status text NOT NULL DEFAULT 'unread',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nw_contact_messages_status_idx ON nw_contact_messages(status, created_at DESC);

CREATE TABLE IF NOT EXISTS nw_newsletter_subscribers (
  email text PRIMARY KEY,
  token text UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  source text NOT NULL DEFAULT 'site',
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE nw_newsletter_subscribers ADD COLUMN IF NOT EXISTS token text;
ALTER TABLE nw_newsletter_subscribers ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'site';
ALTER TABLE nw_newsletter_subscribers ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE nw_newsletter_subscribers ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS nw_newsletter_token_idx ON nw_newsletter_subscribers(token) WHERE token IS NOT NULL;
CREATE INDEX IF NOT EXISTS nw_newsletter_status_idx ON nw_newsletter_subscribers(status, created_at DESC);

CREATE TABLE IF NOT EXISTS nw_newsletter_issues (
  id text PRIMARY KEY,
  subject text NOT NULL,
  body text NOT NULL,
  segment text NOT NULL DEFAULT 'all',
  status text NOT NULL DEFAULT 'draft',
  provider_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nw_newsletter_issue_status_idx ON nw_newsletter_issues(status, created_at);
