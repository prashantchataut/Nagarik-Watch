-- Composite/partial indexes for public comment threads and rolling trending windows.
-- These match the predicates/order used by apps/web/lib/engagement/store.ts.

CREATE INDEX IF NOT EXISTS nw_comments_public_thread_idx
  ON nw_comments (article_slug, article_category, created_at ASC)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS nw_comments_trending_idx
  ON nw_comments (created_at DESC, article_slug, article_category)
  WHERE status = 'approved';

CREATE INDEX IF NOT EXISTS nw_bookmarks_trending_idx
  ON nw_bookmarks (created_at DESC, article_slug, article_category);

CREATE INDEX IF NOT EXISTS nw_reading_trending_idx
  ON nw_reading (read_at DESC, article_slug, article_category);

CREATE INDEX IF NOT EXISTS nw_ranking_events_trending_idx
  ON nw_ranking_events (created_at DESC, event_type, article_slug, article_category);
