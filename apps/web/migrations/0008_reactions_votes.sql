-- Article emoji reactions and comment helpful votes.
CREATE TABLE IF NOT EXISTS nw_reactions (
  id bigserial PRIMARY KEY,
  article_slug text NOT NULL,
  article_category text NOT NULL DEFAULT '',
  emoji text NOT NULL,
  visitor_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (article_slug, visitor_hash, emoji)
);
CREATE INDEX IF NOT EXISTS nw_reactions_article_idx
  ON nw_reactions (article_slug, emoji);

ALTER TABLE nw_comments ADD COLUMN IF NOT EXISTS upvote_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS nw_comment_votes (
  id bigserial PRIMARY KEY,
  comment_id text NOT NULL,
  visitor_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, visitor_hash)
);
