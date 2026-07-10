/**
 * Reader engagement store — comments, poll votes, bookmarks, reading history.
 *
 * Production contract:
 *   - DATABASE_URL present: writes go to Postgres tables created lazily with
 *     stable `nw_*` names. This is the required mode for a real launch.
 *   - DATABASE_URL absent: preview/dev uses process-local maps. Public launch
 *     readiness flags this as a blocker, so the fallback cannot be mistaken for
 *     production durability.
 *
 * The API surface is intentionally unchanged from v13 so reader components and
 * route handlers do not need to know which backing store is active.
 */
import 'server-only'
import type { Locale } from '@nagarikwatch/db'

export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'flagged'

export type Comment = {
  id: string
  articleSlug: string
  articleCategory: string
  authorName: string
  authorEmail?: string
  authorUserId?: string
  bodyNe: string
  bodyEn?: string
  status: CommentStatus
  parentId?: string
  createdAt: string
  locale: Locale
  upvotes: number
  downvotes: number
}

export type PollVote = {
  pollId: string
  optionId: string
  voterFingerprint: string
  voterUserId?: string
  createdAt: string
}

export type Bookmark = {
  userId?: string
  anonymousId: string
  articleSlug: string
  articleCategory: string
  articleTitleNe: string
  savedAt: string
}

export type ReadingHistoryEntry = {
  userId?: string
  anonymousId: string
  articleSlug: string
  articleCategory: string
  articleTitleNe: string
  readAt: string
  readPercent: number
}

type Queryable = {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: T[]; rowCount: number | null }>
}

type CommentRow = {
  id: string
  article_slug: string
  article_category: string
  author_name: string
  author_email: string | null
  author_user_id: string | null
  body_ne: string
  body_en: string | null
  status: CommentStatus
  parent_id: string | null
  created_at: Date | string
  locale: Locale
  upvotes: number
  downvotes: number
}

type BookmarkRow = {
  user_id: string | null
  anonymous_id: string
  article_slug: string
  article_category: string
  article_title_ne: string
  saved_at: Date | string
}

type ReadingRow = {
  user_id: string | null
  anonymous_id: string
  article_slug: string
  article_category: string
  article_title_ne: string
  read_at: Date | string
  read_percent: number
}

type PollResultRow = { option_id: string; count: string | number }

const comments = new Map<string, Comment>()
const pollVotes = new Map<string, PollVote[]>()
const bookmarks = new Map<string, Bookmark[]>()
const readingHistory = new Map<string, ReadingHistoryEntry[]>()

let poolPromise: Promise<Queryable | null> | null = null
let schemaReady: Promise<void> | null = null

export function engagementStorageMode(): 'postgres' | 'memory' {
  return process.env.DATABASE_URL?.startsWith('postgres') ? 'postgres' : 'memory'
}

async function getPool(): Promise<Queryable | null> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null
  if (engagementStorageMode() !== 'postgres') return null
  if (!poolPromise) {
    poolPromise = (async () => {
      const { Pool } = await import('pg')
      return new Pool({
        connectionString: process.env.DATABASE_URL,
        max: Number(process.env.ENGAGEMENT_DB_POOL_MAX ?? 5),
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
      }) as Queryable
    })()
  }
  return poolPromise
}

async function ensureSchema(): Promise<Queryable | null> {
  const pool = await getPool()
  if (!pool) return null
  if (!schemaReady) {
    schemaReady = (async () => {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS nw_comments (
          id text PRIMARY KEY,
          article_slug text NOT NULL,
          article_category text NOT NULL,
          author_name text NOT NULL,
          author_email text,
          author_user_id text,
          body_ne text NOT NULL,
          body_en text,
          status text NOT NULL DEFAULT 'pending',
          parent_id text,
          created_at timestamptz NOT NULL DEFAULT now(),
          locale text NOT NULL DEFAULT 'ne',
          upvotes integer NOT NULL DEFAULT 0,
          downvotes integer NOT NULL DEFAULT 0
        )
      `)
      await pool.query(
        `CREATE INDEX IF NOT EXISTS nw_comments_article_idx ON nw_comments(article_slug, status, created_at DESC)`,
      )
      await pool.query(
        `CREATE INDEX IF NOT EXISTS nw_comments_status_idx ON nw_comments(status, created_at DESC)`,
      )
      await pool.query(`
        CREATE TABLE IF NOT EXISTS nw_poll_votes (
          poll_id text NOT NULL,
          option_id text NOT NULL,
          voter_fingerprint text NOT NULL,
          voter_user_id text,
          created_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (poll_id, voter_fingerprint)
        )
      `)
      await pool.query(
        `CREATE INDEX IF NOT EXISTS nw_poll_votes_poll_idx ON nw_poll_votes(poll_id)`,
      )
      await pool.query(`
        CREATE TABLE IF NOT EXISTS nw_bookmarks (
          owner_key text NOT NULL,
          user_id text,
          anonymous_id text NOT NULL,
          article_slug text NOT NULL,
          article_category text NOT NULL,
          article_title_ne text NOT NULL,
          saved_at timestamptz NOT NULL DEFAULT now(),
          PRIMARY KEY (owner_key, article_slug)
        )
      `)
      await pool.query(
        `CREATE INDEX IF NOT EXISTS nw_bookmarks_owner_idx ON nw_bookmarks(owner_key, saved_at DESC)`,
      )
      await pool.query(`
        CREATE TABLE IF NOT EXISTS nw_reading_history (
          owner_key text NOT NULL,
          user_id text,
          anonymous_id text NOT NULL,
          article_slug text NOT NULL,
          article_category text NOT NULL,
          article_title_ne text NOT NULL,
          read_at timestamptz NOT NULL DEFAULT now(),
          read_percent integer NOT NULL DEFAULT 0,
          PRIMARY KEY (owner_key, article_slug)
        )
      `)
      await pool.query(
        `CREATE INDEX IF NOT EXISTS nw_reading_owner_idx ON nw_reading_history(owner_key, read_at DESC)`,
      )
    })()
  }
  await schemaReady
  return pool
}

function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function rowToComment(row: CommentRow): Comment {
  return {
    id: row.id,
    articleSlug: row.article_slug,
    articleCategory: row.article_category,
    authorName: row.author_name,
    authorEmail: row.author_email ?? undefined,
    authorUserId: row.author_user_id ?? undefined,
    bodyNe: row.body_ne,
    bodyEn: row.body_en ?? undefined,
    status: row.status,
    parentId: row.parent_id ?? undefined,
    createdAt: iso(row.created_at),
    locale: row.locale === 'en' ? 'en' : 'ne',
    upvotes: Number(row.upvotes ?? 0),
    downvotes: Number(row.downvotes ?? 0),
  }
}

function rowToBookmark(row: BookmarkRow): Bookmark {
  return {
    userId: row.user_id ?? undefined,
    anonymousId: row.anonymous_id,
    articleSlug: row.article_slug,
    articleCategory: row.article_category,
    articleTitleNe: row.article_title_ne,
    savedAt: iso(row.saved_at),
  }
}

function rowToReading(row: ReadingRow): ReadingHistoryEntry {
  return {
    userId: row.user_id ?? undefined,
    anonymousId: row.anonymous_id,
    articleSlug: row.article_slug,
    articleCategory: row.article_category,
    articleTitleNe: row.article_title_ne,
    readAt: iso(row.read_at),
    readPercent: Number(row.read_percent ?? 0),
  }
}

function ownerKey(anonymousId: string, userId?: string): string {
  return userId ? `user:${userId}` : `anon:${anonymousId}`
}

// --- Comments ---

export async function createComment(input: {
  articleSlug: string
  articleCategory: string
  authorName: string
  authorEmail?: string
  authorUserId?: string
  bodyNe: string
  parentId?: string
  locale: Locale
}): Promise<Comment> {
  const pool = await ensureSchema()
  const id = genId()
  if (pool) {
    const result = await pool.query<CommentRow>(
      `INSERT INTO nw_comments (
        id, article_slug, article_category, author_name, author_email,
        author_user_id, body_ne, status, parent_id, locale
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,$9)
      RETURNING *`,
      [
        id,
        input.articleSlug,
        input.articleCategory,
        input.authorName.slice(0, 80),
        input.authorEmail ?? null,
        input.authorUserId ?? null,
        input.bodyNe.slice(0, 2000),
        input.parentId ?? null,
        input.locale,
      ],
    )
    return rowToComment(result.rows[0]!)
  }

  const comment: Comment = {
    id,
    articleSlug: input.articleSlug,
    articleCategory: input.articleCategory,
    authorName: input.authorName.slice(0, 80),
    authorEmail: input.authorEmail,
    authorUserId: input.authorUserId,
    bodyNe: input.bodyNe.slice(0, 2000),
    status: 'pending',
    parentId: input.parentId,
    createdAt: new Date().toISOString(),
    locale: input.locale,
    upvotes: 0,
    downvotes: 0,
  }
  comments.set(comment.id, comment)
  return comment
}

export async function getCommentsForArticle(
  articleSlug: string,
  opts: { includePending?: boolean } = {},
): Promise<Comment[]> {
  const pool = await ensureSchema()
  if (pool) {
    const result = opts.includePending
      ? await pool.query<CommentRow>(
          `SELECT * FROM nw_comments WHERE article_slug = $1 ORDER BY created_at DESC LIMIT 500`,
          [articleSlug],
        )
      : await pool.query<CommentRow>(
          `SELECT * FROM nw_comments WHERE article_slug = $1 AND status = 'approved' ORDER BY created_at DESC LIMIT 500`,
          [articleSlug],
        )
    return result.rows.map(rowToComment)
  }

  const all = Array.from(comments.values()).filter((c) => c.articleSlug === articleSlug)
  return all
    .filter((c) => opts.includePending || c.status === 'approved')
    .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
}

export async function listAllComments(
  opts: { status?: CommentStatus; limit?: number } = {},
): Promise<Comment[]> {
  const pool = await ensureSchema()
  if (pool) {
    const limit = Math.max(1, Math.min(500, opts.limit ?? 100))
    const result = opts.status
      ? await pool.query<CommentRow>(
          `SELECT * FROM nw_comments WHERE status = $1 ORDER BY created_at DESC LIMIT $2`,
          [opts.status, limit],
        )
      : await pool.query<CommentRow>(
          `SELECT * FROM nw_comments ORDER BY created_at DESC LIMIT $1`,
          [limit],
        )
    return result.rows.map(rowToComment)
  }

  let all = Array.from(comments.values())
  if (opts.status) all = all.filter((c) => c.status === opts.status)
  all.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
  return all.slice(0, opts.limit ?? 100)
}

export async function updateCommentStatus(
  commentId: string,
  status: CommentStatus,
): Promise<boolean> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query(`UPDATE nw_comments SET status = $2 WHERE id = $1`, [
      commentId,
      status,
    ])
    return Number(result.rowCount ?? 0) > 0
  }

  const c = comments.get(commentId)
  if (!c) return false
  comments.set(commentId, { ...c, status })
  return true
}

// --- Polls ---

export async function recordPollVote(input: {
  pollId: string
  optionId: string
  voterFingerprint: string
  voterUserId?: string
}): Promise<{ recorded: boolean }> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query(
      `INSERT INTO nw_poll_votes (poll_id, option_id, voter_fingerprint, voter_user_id)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (poll_id, voter_fingerprint) DO NOTHING`,
      [input.pollId, input.optionId, input.voterFingerprint, input.voterUserId ?? null],
    )
    return { recorded: Number(result.rowCount ?? 0) > 0 }
  }

  const key = input.pollId
  const existing = pollVotes.get(key) ?? []
  const alreadyVoted = existing.some((v) => v.voterFingerprint === input.voterFingerprint)
  if (alreadyVoted) return { recorded: false }
  existing.push({
    pollId: input.pollId,
    optionId: input.optionId,
    voterFingerprint: input.voterFingerprint,
    voterUserId: input.voterUserId,
    createdAt: new Date().toISOString(),
  })
  pollVotes.set(key, existing)
  return { recorded: true }
}

export async function getPollResults(pollId: string): Promise<Record<string, number>> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<PollResultRow>(
      `SELECT option_id, count(*) AS count FROM nw_poll_votes WHERE poll_id = $1 GROUP BY option_id`,
      [pollId],
    )
    return Object.fromEntries(result.rows.map((r) => [r.option_id, Number(r.count)]))
  }

  const votes = pollVotes.get(pollId) ?? []
  const tally: Record<string, number> = {}
  for (const v of votes) tally[v.optionId] = (tally[v.optionId] ?? 0) + 1
  return tally
}

// --- Bookmarks ---

export async function addBookmark(input: {
  anonymousId: string
  userId?: string
  articleSlug: string
  articleCategory: string
  articleTitleNe: string
}): Promise<void> {
  const pool = await ensureSchema()
  const key = ownerKey(input.anonymousId, input.userId)
  if (pool) {
    await pool.query(
      `INSERT INTO nw_bookmarks (owner_key, user_id, anonymous_id, article_slug, article_category, article_title_ne)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (owner_key, article_slug) DO UPDATE SET saved_at = now(), article_category = EXCLUDED.article_category, article_title_ne = EXCLUDED.article_title_ne`,
      [
        key,
        input.userId ?? null,
        input.anonymousId,
        input.articleSlug,
        input.articleCategory,
        input.articleTitleNe,
      ],
    )
    return
  }

  const list = bookmarks.get(key) ?? []
  if (list.some((b) => b.articleSlug === input.articleSlug)) return
  list.unshift({ ...input, savedAt: new Date().toISOString() })
  bookmarks.set(key, list.slice(0, 200))
}

export async function removeBookmark(
  anonymousId: string,
  userId: string | undefined,
  articleSlug: string,
): Promise<void> {
  const pool = await ensureSchema()
  const key = ownerKey(anonymousId, userId)
  if (pool) {
    await pool.query(`DELETE FROM nw_bookmarks WHERE owner_key = $1 AND article_slug = $2`, [
      key,
      articleSlug,
    ])
    return
  }

  const list = bookmarks.get(key) ?? []
  bookmarks.set(
    key,
    list.filter((b) => b.articleSlug !== articleSlug),
  )
}

export async function getBookmarks(anonymousId: string, userId?: string): Promise<Bookmark[]> {
  const pool = await ensureSchema()
  const key = ownerKey(anonymousId, userId)
  if (pool) {
    const result = await pool.query<BookmarkRow>(
      `SELECT user_id, anonymous_id, article_slug, article_category, article_title_ne, saved_at
       FROM nw_bookmarks WHERE owner_key = $1 ORDER BY saved_at DESC LIMIT 200`,
      [key],
    )
    return result.rows.map(rowToBookmark)
  }
  return bookmarks.get(key) ?? []
}

// --- Reading history ---

export async function recordReading(input: {
  anonymousId: string
  userId?: string
  articleSlug: string
  articleCategory: string
  articleTitleNe: string
  readPercent: number
}): Promise<void> {
  const pool = await ensureSchema()
  const key = ownerKey(input.anonymousId, input.userId)
  const percent = Math.round(Math.min(100, Math.max(0, input.readPercent)))
  if (pool) {
    await pool.query(
      `INSERT INTO nw_reading_history (owner_key, user_id, anonymous_id, article_slug, article_category, article_title_ne, read_percent)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (owner_key, article_slug) DO UPDATE SET
         read_at = now(),
         read_percent = GREATEST(nw_reading_history.read_percent, EXCLUDED.read_percent),
         article_category = EXCLUDED.article_category,
         article_title_ne = EXCLUDED.article_title_ne`,
      [
        key,
        input.userId ?? null,
        input.anonymousId,
        input.articleSlug,
        input.articleCategory,
        input.articleTitleNe,
        percent,
      ],
    )
    return
  }

  const list = readingHistory.get(key) ?? []
  const filtered = list.filter((e) => e.articleSlug !== input.articleSlug)
  filtered.unshift({
    userId: input.userId,
    anonymousId: input.anonymousId,
    articleSlug: input.articleSlug,
    articleCategory: input.articleCategory,
    articleTitleNe: input.articleTitleNe,
    readAt: new Date().toISOString(),
    readPercent: percent,
  })
  readingHistory.set(key, filtered.slice(0, 50))
}

export async function getReadingHistory(
  anonymousId: string,
  userId?: string,
): Promise<ReadingHistoryEntry[]> {
  const pool = await ensureSchema()
  const key = ownerKey(anonymousId, userId)
  if (pool) {
    const result = await pool.query<ReadingRow>(
      `SELECT user_id, anonymous_id, article_slug, article_category, article_title_ne, read_at, read_percent
       FROM nw_reading_history WHERE owner_key = $1 ORDER BY read_at DESC LIMIT 50`,
      [key],
    )
    return result.rows.map(rowToReading)
  }
  return readingHistory.get(key) ?? []
}
