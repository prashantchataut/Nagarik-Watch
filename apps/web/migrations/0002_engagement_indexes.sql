-- Supporting indexes for engagement, analytics, and journalist workflow queries.

CREATE INDEX IF NOT EXISTS nw_comments_article_idx
  ON nw_comments(article_slug);
CREATE INDEX IF NOT EXISTS nw_comments_status_idx
  ON nw_comments(status);
CREATE INDEX IF NOT EXISTS nw_comments_author_idx
  ON nw_comments(author_user_id);
CREATE INDEX IF NOT EXISTS nw_comments_parent_idx
  ON nw_comments(parent_id);

CREATE INDEX IF NOT EXISTS nw_bookmarks_created_at_idx
  ON nw_bookmarks(created_at);
CREATE INDEX IF NOT EXISTS nw_bookmarks_article_idx
  ON nw_bookmarks(article_slug);

CREATE INDEX IF NOT EXISTS nw_reading_read_at_idx
  ON nw_reading(read_at);

CREATE INDEX IF NOT EXISTS nw_ranking_events_created_at_idx
  ON nw_ranking_events(created_at);

CREATE INDEX IF NOT EXISTS nw_search_events_created_at_idx
  ON nw_search_events(created_at);

CREATE INDEX IF NOT EXISTS nw_journalist_draft_meta_workflow_stage_idx
  ON nw_journalist_draft_meta(workflow_stage);
