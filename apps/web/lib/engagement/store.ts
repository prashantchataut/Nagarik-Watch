import 'server-only'
import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Pool } from 'pg'
import {
  moderateComment,
  rankComment,
  reputationScore,
  type EngagementSample,
} from '@nagarikwatch/db'
import { getSharedPool } from '@/lib/pg-pool'
import { getRankingShareSamples, getRankingAttentionSamples } from '@/lib/engagement/ranking-events'

type BookmarkInput = {
  anonymousId: string
  userId?: string
  articleSlug: string
  articleCategory: string
  articleTitleNe: string
}
type CommentInput = {
  articleSlug: string
  articleCategory: string
  authorName: string
  authorEmail?: string
  authorUserId?: string
  bodyNe: string
  parentId?: string
  locale: 'ne' | 'en'
}
type PollVoteInput = {
  pollId: string
  optionId: string
  voterFingerprint: string
  voterUserId?: string
}
type ReadingInput = {
  anonymousId: string
  userId?: string
  articleSlug: string
  articleCategory: string
  articleTitleNe: string
  articleTagSlugs: string[]
  articleAuthorSlugs: string[]
  readPercent: number
  dwellSeconds: number
  completed: boolean
  sessionId: string
}

export type ReadingHistoryItem = {
  articleSlug: string
  articleCategory: string
  articleTitleNe: string
  articleTagSlugs: string[]
  articleAuthorSlugs: string[]
  readPercent: number
  dwellSeconds: number
  completed: boolean
  sessions: number
  firstReadAt: string
  readAt: string
}

export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'flagged'
export type ModerationComment = CommentInput & {
  id: string
  status: CommentStatus
  createdAt: string
  toxicityScore?: number
  spamScore?: number
  moderationFlags?: string[]
  moderationVerdict?: string
  reputationUsed?: number
}

async function bannedWordList(): Promise<readonly string[]> {
  try {
    const { getModerationBannedWords } = await import('@/lib/admin-settings')
    return await getModerationBannedWords()
  } catch {
    return (process.env.COMMENT_BANNED_WORDS ?? '')
      .split(/[\n,]+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 2)
  }
}

function statusFromModeration(verdict: string): CommentStatus {
  if (verdict === 'auto_reject') return 'rejected'
  if (verdict === 'auto_hide') return 'flagged'
  return 'pending'
}

type StoredBookmark = BookmarkInput & { createdAt: string }
type StoredVote = PollVoteInput & { id: string; createdAt: string }
type StoredReading = ReadingInput & {
  readAt: string
  firstReadAt: string
  sessions: number
  lastSessionSeconds: number
}
type LocalEngagementStore = {
  version: 1
  bookmarks: Record<string, StoredBookmark>
  comments: ModerationComment[]
  votes: Record<string, StoredVote>
  readings: Record<string, StoredReading>
}

const LOCAL_FILE = path.resolve(process.cwd(), '.data', 'engagement.json')
let localCache: LocalEngagementStore | null = null
let localWrite: Promise<void> = Promise.resolve()
let schemaReady: Promise<void> | null = null

async function getPool(): Promise<Pool | null> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null
  const database = await getSharedPool()
  if (!database && process.env.NODE_ENV === 'production' && process.env.E2E_TEST !== 'true') {
    throw new Error('DATABASE_URL is required for persistent reader engagement in production.')
  }
  return database
}

async function ensureSchema() {
  const database = await getPool()
  if (!database) return
  schemaReady ??= database
    .query(
      `
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
CREATE INDEX IF NOT EXISTS nw_reading_owner_recent_idx ON nw_reading(owner_key, read_at DESC);`,
    )
    .then(() => undefined)
    .catch((error) => {
      schemaReady = null
      throw error
    })
  await schemaReady
}

function emptyLocalStore(): LocalEngagementStore {
  return { version: 1, bookmarks: {}, comments: [], votes: {}, readings: {} }
}

async function readLocal(): Promise<LocalEngagementStore> {
  if (localCache) return localCache
  try {
    localCache = JSON.parse(await fs.readFile(LOCAL_FILE, 'utf8')) as LocalEngagementStore
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    localCache = emptyLocalStore()
  }
  return localCache
}

async function writeLocal(next: LocalEngagementStore): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local engagement storage is disabled in production.')
  }
  localWrite = localWrite.then(async () => {
    await fs.mkdir(path.dirname(LOCAL_FILE), { recursive: true })
    const temp = `${LOCAL_FILE}.${process.pid}.tmp`
    await fs.writeFile(temp, JSON.stringify(next, null, 2), 'utf8')
    await fs.rename(temp, LOCAL_FILE)
    localCache = next
  })
  await localWrite
}

function owner(anonymousId: string, userId?: string) {
  return userId ? `user:${userId}` : `anon:${anonymousId}`
}

/** Merge anonymous bookmarks into the signed-in account on the first authenticated request. */
export async function mergeAnonymousBookmarks(anonymousId: string, userId: string): Promise<void> {
  if (!anonymousId.trim()) return
  const anonymousOwner = owner(anonymousId)
  const userOwner = owner('', userId)
  const database = await getPool()
  if (database) {
    await ensureSchema()
    const client = await database.connect()
    try {
      await client.query('begin')
      const anonymous = await client.query<{
        article_slug: string
        article_category: string | null
        article_title_ne: string | null
        created_at: Date | string
      }>(
        `select article_slug, article_category, article_title_ne, created_at
         from nw_bookmarks where owner_key=$1`,
        [anonymousOwner],
      )
      for (const bookmark of anonymous.rows) {
        await client.query(
          `insert into nw_bookmarks(id,owner_key,article_slug,article_category,article_title_ne,created_at)
           values($1,$2,$3,$4,$5,$6)
           on conflict(owner_key,article_slug) do update set
             article_category=excluded.article_category,
             article_title_ne=excluded.article_title_ne`,
          [
            randomUUID(),
            userOwner,
            bookmark.article_slug,
            bookmark.article_category,
            bookmark.article_title_ne,
            bookmark.created_at,
          ],
        )
      }
      await client.query('delete from nw_bookmarks where owner_key=$1', [anonymousOwner])
      await client.query('commit')
    } catch (error) {
      await client.query('rollback')
      throw error
    } finally {
      client.release()
    }
    return
  }

  const store = await readLocal()
  const bookmarks = { ...store.bookmarks }
  for (const [key, bookmark] of Object.entries(store.bookmarks)) {
    if (!key.startsWith(`${anonymousOwner}:`)) continue
    bookmarks[`${userOwner}:${bookmark.articleSlug}`] = {
      ...bookmark,
      anonymousId: '',
      userId,
    }
    delete bookmarks[key]
  }
  await writeLocal({ ...store, bookmarks })
}

/** A reply may reference only an approved parent on the same public article. */
export async function isValidCommentParent(
  articleSlug: string,
  articleCategory: string,
  parentId: string,
): Promise<boolean> {
  const database = await getPool()
  if (database) {
    await ensureSchema()
    const result = await database.query(
      `select 1 from nw_comments where id=$1 and article_slug=$2 and article_category=$3 and status='approved' limit 1`,
      [parentId, articleSlug, articleCategory],
    )
    return Number(result.rowCount ?? 0) > 0
  }
  return (await readLocal()).comments.some(
    (comment) =>
      comment.id === parentId &&
      comment.articleSlug === articleSlug &&
      comment.articleCategory === articleCategory &&
      comment.status === 'approved',
  )
}

export async function addBookmark(input: BookmarkInput) {
  const database = await getPool()
  if (database) {
    await ensureSchema()
    await database.query(
      `insert into nw_bookmarks(id,owner_key,article_slug,article_category,article_title_ne)
       values($1,$2,$3,$4,$5)
       on conflict(owner_key,article_slug) do update set
       article_category=excluded.article_category,article_title_ne=excluded.article_title_ne`,
      [
        randomUUID(),
        owner(input.anonymousId, input.userId),
        input.articleSlug,
        input.articleCategory,
        input.articleTitleNe,
      ],
    )
    return
  }
  const store = await readLocal()
  const key = `${owner(input.anonymousId, input.userId)}:${input.articleSlug}`
  await writeLocal({
    ...store,
    bookmarks: { ...store.bookmarks, [key]: { ...input, createdAt: new Date().toISOString() } },
  })
}

export async function removeBookmark(
  anonymousId: string,
  userId: string | undefined,
  articleSlug: string,
) {
  const database = await getPool()
  if (database) {
    await ensureSchema()
    await database.query('delete from nw_bookmarks where owner_key=$1 and article_slug=$2', [
      owner(anonymousId, userId),
      articleSlug,
    ])
    return
  }
  const store = await readLocal()
  const bookmarks = { ...store.bookmarks }
  delete bookmarks[`${owner(anonymousId, userId)}:${articleSlug}`]
  await writeLocal({ ...store, bookmarks })
}

export async function getBookmarks(anonymousId: string, userId?: string) {
  const database = await getPool()
  if (database) {
    await ensureSchema()
    const result = await database.query(
      `select article_slug as "articleSlug", article_category as "articleCategory",
              article_title_ne as "articleTitleNe", created_at as "createdAt"
       from nw_bookmarks where owner_key=$1 order by created_at desc`,
      [owner(anonymousId, userId)],
    )
    return result.rows as Array<{
      articleSlug: string
      articleCategory: string
      articleTitleNe: string
      createdAt: string
    }>
  }
  const keyPrefix = `${owner(anonymousId, userId)}:`
  return Object.entries((await readLocal()).bookmarks)
    .filter(([key]) => key.startsWith(keyPrefix))
    .map(([, value]) => value)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

async function commentAuthorReputation(
  input: Pick<CommentInput, 'authorUserId' | 'authorEmail'>,
  database: Pool | null,
): Promise<number> {
  const userId = input.authorUserId?.trim() ?? ''
  const email = input.authorEmail?.trim().toLowerCase() ?? ''
  if (!userId && !email) return 0.5

  if (database) {
    const result = await database.query<{
      approved: number | string
      rejected: number | string
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE status='approved')::int AS approved,
         COUNT(*) FILTER (WHERE status IN ('rejected','flagged'))::int AS rejected
       FROM nw_comments
       WHERE ($1 <> '' AND author_user_id=$1)
          OR ($1 = '' AND $2 <> '' AND LOWER(author_email)=LOWER($2))`,
      [userId, email],
    )
    const row = result.rows[0]
    return reputationScore(Number(row?.approved ?? 0), Number(row?.rejected ?? 0))
  }

  const comments = (await readLocal()).comments.filter((comment) =>
    userId
      ? comment.authorUserId === userId
      : Boolean(email && comment.authorEmail?.toLowerCase() === email),
  )
  const approved = comments.filter((comment) => comment.status === 'approved').length
  const rejected = comments.filter(
    (comment) => comment.status === 'rejected' || comment.status === 'flagged',
  ).length
  return reputationScore(approved, rejected)
}

export async function createComment(input: CommentInput): Promise<ModerationComment> {
  const id = randomUUID()
  const database = await getPool()
  if (database) await ensureSchema()
  const reputation = await commentAuthorReputation(input, database)
  const moderation = moderateComment({ id, body: input.bodyNe }, reputation, await bannedWordList())
  const status = statusFromModeration(moderation.verdict)
  const item: ModerationComment = {
    id,
    ...input,
    status,
    createdAt: new Date().toISOString(),
    toxicityScore: moderation.toxicityScore,
    spamScore: moderation.spamScore,
    moderationFlags: moderation.flags,
    moderationVerdict: moderation.verdict,
    reputationUsed: moderation.reputationUsed,
  }
  if (database) {
    await database.query(
      `insert into nw_comments(
         id,article_slug,article_category,author_name,author_email,author_user_id,body_ne,parent_id,locale,status,
         toxicity_score,spam_score,moderation_flags,moderation_verdict,reputation_used
       )
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        item.id,
        input.articleSlug,
        input.articleCategory,
        input.authorName,
        input.authorEmail ?? null,
        input.authorUserId ?? null,
        input.bodyNe,
        input.parentId ?? null,
        input.locale,
        status,
        moderation.toxicityScore,
        moderation.spamScore,
        moderation.flags,
        moderation.verdict,
        moderation.reputationUsed,
      ],
    )
    return item
  }
  const store = await readLocal()
  await writeLocal({ ...store, comments: [...store.comments, item] })
  return item
}

export async function getCommentsForArticle(articleSlug: string, articleCategory: string) {
  const database = await getPool()
  let comments: Array<
    Pick<
      ModerationComment,
      | 'id'
      | 'authorName'
      | 'authorUserId'
      | 'bodyNe'
      | 'parentId'
      | 'locale'
      | 'status'
      | 'createdAt'
    > & { upvotes?: number; downvotes?: number; upvoteCount?: number }
  >
  if (database) {
    await ensureSchema()
    const result = await database.query(
      `select id, author_name as "authorName", author_user_id as "authorUserId", body_ne as "bodyNe", parent_id as "parentId",
              locale, status, created_at as "createdAt",
              coalesce(upvote_count, 0)::int as "upvoteCount"
       from nw_comments where article_slug=$1 and article_category=$2 and status='approved' order by created_at asc`,
      [articleSlug, articleCategory],
    )
    comments = result.rows as typeof comments
  } else {
    comments = (await readLocal()).comments
      .filter(
        (comment) =>
          comment.articleSlug === articleSlug &&
          comment.articleCategory === articleCategory &&
          comment.status === 'approved',
      )
      .map((comment) => ({
        ...comment,
        upvoteCount: Number((comment as { upvoteCount?: number }).upvoteCount ?? 0),
      }))
  }

  const now = new Date()
  return [...comments]
    .map((comment) => {
      const upvoteCount = Number(comment.upvoteCount ?? comment.upvotes ?? 0)
      const ranked = rankComment(
        {
          id: comment.id,
          body: comment.bodyNe,
          createdAt: comment.createdAt,
          upvotes: Math.max(1, upvoteCount),
          downvotes: comment.downvotes ?? 0,
        },
        now,
      )
      return { ...comment, upvoteCount, rankScore: ranked.rankScore }
    })
    .sort((a, b) => b.rankScore - a.rankScore || a.createdAt.localeCompare(b.createdAt))
}

export async function listCommentsForModeration(
  status: CommentStatus | 'all' = 'pending',
  limit = 200,
): Promise<ModerationComment[]> {
  const database = await getPool()
  if (database) {
    await ensureSchema()
    const values: unknown[] = []
    const where = status === 'all' ? '' : `where status=$${values.push(status)}`
    values.push(limit)
    const result = await database.query(
      `select id, article_slug as "articleSlug", article_category as "articleCategory",
              author_name as "authorName", author_email as "authorEmail",
              author_user_id as "authorUserId", body_ne as "bodyNe", parent_id as "parentId",
              locale, status, created_at as "createdAt",
              toxicity_score as "toxicityScore", spam_score as "spamScore",
              moderation_flags as "moderationFlags", moderation_verdict as "moderationVerdict",
              reputation_used as "reputationUsed"
       from nw_comments ${where} order by created_at desc limit $${values.length}`,
      values,
    )
    return result.rows as ModerationComment[]
  }
  return (await readLocal()).comments
    .filter((comment) => status === 'all' || comment.status === status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

export async function updateCommentStatus(commentId: string, status: CommentStatus) {
  const database = await getPool()
  if (database) {
    await ensureSchema()
    const client = await database.connect()
    try {
      await client.query('begin')
      const result = await client.query<{ parent_id: string | null }>(
        `update nw_comments as comment set status=$2
         where comment.id=$1
           and ($2 <> 'approved' or comment.parent_id is null or exists(
             select 1 from nw_comments as parent
             where parent.id=comment.parent_id and parent.status='approved'
           ))
         returning parent_id`,
        [commentId, status],
      )
      if (!result.rowCount) {
        await client.query('rollback')
        return false
      }
      if (status === 'rejected' || status === 'flagged') {
        await client.query(
          `update nw_comments set status=$2 where parent_id=$1 and status <> 'rejected'`,
          [commentId, status],
        )
      }
      await client.query('commit')
      return true
    } catch (error) {
      await client.query('rollback')
      throw error
    } finally {
      client.release()
    }
  }
  const store = await readLocal()
  const index = store.comments.findIndex((comment) => comment.id === commentId)
  if (index === -1) return false
  const current = store.comments[index]!
  if (status === 'approved' && current.parentId) {
    const parent = store.comments.find((comment) => comment.id === current.parentId)
    if (!parent || parent.status !== 'approved') return false
  }
  const comments = store.comments.map((comment) => {
    if (comment.id === commentId) return { ...comment, status }
    if ((status === 'rejected' || status === 'flagged') && comment.parentId === commentId) {
      return { ...comment, status }
    }
    return comment
  })
  await writeLocal({ ...store, comments })
  return true
}

export type DeleteOwnCommentResult = 'deleted' | 'has_replies' | 'not_found'

export async function deleteOwnComment(
  commentId: string,
  userId: string,
): Promise<DeleteOwnCommentResult> {
  const database = await getPool()
  if (database) {
    await ensureSchema()
    const owned = await database.query<{ id: string }>(
      `select id from nw_comments where id=$1 and author_user_id=$2 limit 1`,
      [commentId, userId],
    )
    if (!owned.rowCount) return 'not_found'
    const replies = await database.query(
      `select 1 from nw_comments where parent_id=$1 and status='approved' limit 1`,
      [commentId],
    )
    if (replies.rowCount) return 'has_replies'
    await database.query(`delete from nw_comments where id=$1 and author_user_id=$2`, [
      commentId,
      userId,
    ])
    return 'deleted'
  }
  const store = await readLocal()
  const target = store.comments.find(
    (comment) => comment.id === commentId && comment.authorUserId === userId,
  )
  if (!target) return 'not_found'
  if (
    store.comments.some(
      (comment) => comment.parentId === commentId && comment.status === 'approved',
    )
  ) {
    return 'has_replies'
  }
  await writeLocal({
    ...store,
    comments: store.comments.filter((comment) => comment.id !== commentId),
  })
  return 'deleted'
}

export async function getPollVoteCounts(pollId: string): Promise<Record<string, number>> {
  const database = await getPool()
  if (database) {
    await ensureSchema()
    const result = await database.query<{ option_id: string; count: string }>(
      `select option_id, count(*)::text as count from nw_poll_votes where poll_id=$1 group by option_id`,
      [pollId],
    )
    return Object.fromEntries(result.rows.map((row) => [row.option_id, Number(row.count)]))
  }
  const store = await readLocal()
  const counts: Record<string, number> = {}
  for (const vote of Object.values(store.votes)) {
    if (vote.pollId !== pollId) continue
    counts[vote.optionId] = (counts[vote.optionId] ?? 0) + 1
  }
  return counts
}

export async function recordPollVote(input: PollVoteInput) {
  const voterKey = input.voterUserId ?? input.voterFingerprint
  const key = `${input.pollId}:${voterKey}`
  const database = await getPool()
  if (database) {
    await ensureSchema()
    const result = await database.query(
      `insert into nw_poll_votes(id,poll_id,option_id,voter_key) values($1,$2,$3,$4)
       on conflict(poll_id,voter_key) do nothing returning id`,
      [randomUUID(), input.pollId, input.optionId, voterKey],
    )
    return { recorded: result.rowCount === 1, results: await getPollVoteCounts(input.pollId) }
  }
  const store = await readLocal()
  if (store.votes[key]) return { recorded: false, results: await getPollVoteCounts(input.pollId) }
  await writeLocal({
    ...store,
    votes: {
      ...store.votes,
      [key]: { ...input, id: randomUUID(), createdAt: new Date().toISOString() },
    },
  })
  return { recorded: true, results: await getPollVoteCounts(input.pollId) }
}

export async function recordReading(input: ReadingInput) {
  const safePercent = Math.max(0, Math.min(100, Math.round(input.readPercent)))
  const safeSeconds = Math.max(0, Math.min(86_400, Math.round(input.dwellSeconds)))
  const database = await getPool()
  if (database) {
    await ensureSchema()
    await database.query(
      `insert into nw_reading(
         id,owner_key,article_slug,article_category,article_title_ne,article_tag_slugs,
         article_author_slugs,read_percent,dwell_seconds,completed,sessions,first_read_at,
         last_session_id,last_session_seconds
       ) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1,now(),$11,$9)
       on conflict(owner_key,article_slug) do update set
         article_category=excluded.article_category,
         article_title_ne=excluded.article_title_ne,
         article_tag_slugs=excluded.article_tag_slugs,
         article_author_slugs=excluded.article_author_slugs,
         read_percent=greatest(nw_reading.read_percent, excluded.read_percent),
         completed=nw_reading.completed or excluded.completed,
         dwell_seconds=case
           when nw_reading.last_session_id=excluded.last_session_id
             then greatest(0, nw_reading.dwell_seconds - nw_reading.last_session_seconds)
                  + greatest(nw_reading.last_session_seconds, excluded.last_session_seconds)
           else nw_reading.dwell_seconds + excluded.last_session_seconds
         end,
         sessions=case when nw_reading.last_session_id=excluded.last_session_id then nw_reading.sessions else nw_reading.sessions + 1 end,
         last_session_id=excluded.last_session_id,
         last_session_seconds=case
           when nw_reading.last_session_id=excluded.last_session_id
             then greatest(nw_reading.last_session_seconds, excluded.last_session_seconds)
           else excluded.last_session_seconds
         end,
         read_at=now()`,
      [
        randomUUID(),
        owner(input.anonymousId, input.userId),
        input.articleSlug,
        input.articleCategory,
        input.articleTitleNe,
        input.articleTagSlugs,
        input.articleAuthorSlugs,
        safePercent,
        safeSeconds,
        input.completed,
        input.sessionId,
      ],
    )
    return
  }
  const store = await readLocal()
  const key = `${owner(input.anonymousId, input.userId)}:${input.articleSlug}`
  const previous = store.readings[key]
  const sameSession = previous?.sessionId === input.sessionId
  const previousLastSessionSeconds = previous?.lastSessionSeconds ?? previous?.dwellSeconds ?? 0
  const previousTotal = previous?.dwellSeconds ?? 0
  const sessionSeconds = sameSession
    ? Math.max(previousLastSessionSeconds, safeSeconds)
    : safeSeconds
  const dwellSeconds = sameSession
    ? Math.max(0, previousTotal - previousLastSessionSeconds) + sessionSeconds
    : previousTotal + sessionSeconds
  const now = new Date().toISOString()
  await writeLocal({
    ...store,
    readings: {
      ...store.readings,
      [key]: {
        ...input,
        readPercent: Math.max(previous?.readPercent ?? 0, safePercent),
        dwellSeconds,
        completed: Boolean(previous?.completed || input.completed),
        sessions: sameSession ? (previous?.sessions ?? 1) : (previous?.sessions ?? 0) + 1,
        firstReadAt: previous?.firstReadAt ?? previous?.readAt ?? now,
        lastSessionSeconds: sessionSeconds,
        readAt: now,
      },
    },
  })
}

export async function mergeAnonymousReading(anonymousId: string, userId: string): Promise<void> {
  if (!anonymousId.trim()) return
  const anonymousOwner = owner(anonymousId)
  const userOwner = owner('', userId)
  const database = await getPool()
  if (database) {
    await ensureSchema()
    const client = await database.connect()
    try {
      await client.query('begin')
      await client.query(
        `insert into nw_reading(
           id,owner_key,article_slug,article_category,article_title_ne,article_tag_slugs,
           article_author_slugs,read_percent,dwell_seconds,completed,sessions,first_read_at,
           last_session_id,last_session_seconds,read_at
         )
         select $2 || ':' || article_slug,$2,article_slug,article_category,article_title_ne,
                article_tag_slugs,article_author_slugs,read_percent,dwell_seconds,completed,
                sessions,first_read_at,last_session_id,last_session_seconds,read_at
         from nw_reading where owner_key=$1
         on conflict(owner_key,article_slug) do update set
           article_category=excluded.article_category,
           article_title_ne=excluded.article_title_ne,
           article_tag_slugs=excluded.article_tag_slugs,
           article_author_slugs=excluded.article_author_slugs,
           read_percent=greatest(nw_reading.read_percent, excluded.read_percent),
           dwell_seconds=case
             when nw_reading.last_session_id is not null and nw_reading.last_session_id=excluded.last_session_id
               then greatest(nw_reading.dwell_seconds, excluded.dwell_seconds)
             else nw_reading.dwell_seconds + excluded.dwell_seconds
           end,
           completed=nw_reading.completed or excluded.completed,
           sessions=case
             when nw_reading.last_session_id is not null and nw_reading.last_session_id=excluded.last_session_id
               then greatest(nw_reading.sessions, excluded.sessions)
             else nw_reading.sessions + excluded.sessions
           end,
           first_read_at=least(nw_reading.first_read_at, excluded.first_read_at),
           last_session_id=case
             when nw_reading.last_session_id is not null and nw_reading.last_session_id=excluded.last_session_id
               then nw_reading.last_session_id
             when excluded.read_at >= nw_reading.read_at then excluded.last_session_id
             else nw_reading.last_session_id
           end,
           last_session_seconds=case
             when nw_reading.last_session_id is not null and nw_reading.last_session_id=excluded.last_session_id
               then greatest(nw_reading.last_session_seconds, excluded.last_session_seconds)
             when excluded.read_at >= nw_reading.read_at then excluded.last_session_seconds
             else nw_reading.last_session_seconds
           end,
           read_at=greatest(nw_reading.read_at, excluded.read_at)`,
        [anonymousOwner, userOwner],
      )
      await client.query('delete from nw_reading where owner_key=$1', [anonymousOwner])
      await client.query('commit')
    } catch (error) {
      await client.query('rollback')
      throw error
    } finally {
      client.release()
    }
    return
  }
  const store = await readLocal()
  const readings = { ...store.readings }
  for (const [key, item] of Object.entries(store.readings)) {
    if (!key.startsWith(`${anonymousOwner}:`)) continue
    const targetKey = `${userOwner}:${item.articleSlug}`
    const existing = readings[targetKey]
    const sameSession = Boolean(existing?.sessionId && existing.sessionId === item.sessionId)
    const itemIsNewer = !existing || item.readAt >= existing.readAt
    const winner = itemIsNewer ? item : existing
    readings[targetKey] = {
      ...winner,
      anonymousId: '',
      userId,
      readPercent: Math.max(existing?.readPercent ?? 0, item.readPercent),
      dwellSeconds: sameSession
        ? Math.max(existing?.dwellSeconds ?? 0, item.dwellSeconds ?? 0)
        : (existing?.dwellSeconds ?? 0) + (item.dwellSeconds ?? 0),
      completed: Boolean(existing?.completed || item.completed),
      sessions: sameSession
        ? Math.max(existing?.sessions ?? 0, item.sessions ?? 1)
        : (existing?.sessions ?? 0) + (item.sessions ?? 1),
      sessionId: sameSession
        ? (existing?.sessionId ?? item.sessionId)
        : (winner?.sessionId ?? item.sessionId),
      lastSessionSeconds: sameSession
        ? Math.max(existing?.lastSessionSeconds ?? 0, item.lastSessionSeconds ?? 0)
        : (winner?.lastSessionSeconds ?? winner?.dwellSeconds ?? 0),
      firstReadAt:
        [existing?.firstReadAt, item.firstReadAt, item.readAt].filter(Boolean).sort()[0] ??
        item.readAt,
      readAt: [existing?.readAt, item.readAt].filter(Boolean).sort().at(-1) ?? item.readAt,
    }
    delete readings[key]
  }
  await writeLocal({ ...store, readings })
}

export async function getReadingHistory(
  anonymousId: string,
  userId?: string,
  limit = 100,
): Promise<ReadingHistoryItem[]> {
  const safeLimit = Math.max(1, Math.min(limit, 200))
  const database = await getPool()
  if (database) {
    await ensureSchema()
    const result = await database.query(
      `select article_slug as "articleSlug", article_category as "articleCategory",
              article_title_ne as "articleTitleNe", article_tag_slugs as "articleTagSlugs",
              article_author_slugs as "articleAuthorSlugs", read_percent as "readPercent",
              dwell_seconds as "dwellSeconds", completed, sessions,
              first_read_at as "firstReadAt", read_at as "readAt"
       from nw_reading where owner_key=$1 order by read_at desc limit $2`,
      [owner(anonymousId, userId), safeLimit],
    )
    return result.rows.map((row) => ({
      articleSlug: String(row.articleSlug),
      articleCategory: String(row.articleCategory ?? ''),
      articleTitleNe: String(row.articleTitleNe ?? ''),
      articleTagSlugs: Array.isArray(row.articleTagSlugs) ? row.articleTagSlugs.map(String) : [],
      articleAuthorSlugs: Array.isArray(row.articleAuthorSlugs)
        ? row.articleAuthorSlugs.map(String)
        : [],
      readPercent: Number(row.readPercent ?? 0),
      dwellSeconds: Number(row.dwellSeconds ?? 0),
      completed: Boolean(row.completed),
      sessions: Number(row.sessions ?? 1),
      firstReadAt: new Date(row.firstReadAt as Date | string).toISOString(),
      readAt: new Date(row.readAt as Date | string).toISOString(),
    }))
  }
  const prefix = `${owner(anonymousId, userId)}:`
  return Object.entries((await readLocal()).readings)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, item]) => ({
      articleSlug: item.articleSlug,
      articleCategory: item.articleCategory,
      articleTitleNe: item.articleTitleNe,
      articleTagSlugs: item.articleTagSlugs ?? [],
      articleAuthorSlugs: item.articleAuthorSlugs ?? [],
      readPercent: item.readPercent,
      dwellSeconds: item.dwellSeconds ?? 0,
      completed: Boolean(item.completed),
      sessions: item.sessions ?? 1,
      firstReadAt: item.firstReadAt ?? item.readAt,
      readAt: item.readAt,
    }))
    .sort((a, b) => b.readAt.localeCompare(a.readAt))
    .slice(0, safeLimit)
}

export async function clearReadingHistory(anonymousId: string, userId?: string): Promise<void> {
  const database = await getPool()
  if (database) {
    await ensureSchema()
    await database.query('delete from nw_reading where owner_key=$1', [owner(anonymousId, userId)])
    return
  }
  const store = await readLocal()
  const prefix = `${owner(anonymousId, userId)}:`
  const readings = Object.fromEntries(
    Object.entries(store.readings).filter(([key]) => !key.startsWith(prefix)),
  )
  await writeLocal({ ...store, readings })
}

export type MostReadStat = {
  articleSlug: string
  articleCategory: string
  articleTitleNe: string
  uniqueReaders: number
  averageReadPercent: number
  averageDwellSeconds: number
  completionRate: number
  totalSessions: number
  lastReadAt: string
}

export type BookmarkVelocityStat = {
  articleSlug: string
  articleCategory: string
  bookmarks: number
  bookmarksLastHour: number
}

/** Aggregate privacy-preserving first-party reading activity. Owner keys never leave storage. */
export function compareMostReadStats(a: MostReadStat, b: MostReadStat): number {
  return (
    b.uniqueReaders - a.uniqueReaders ||
    b.averageDwellSeconds - a.averageDwellSeconds ||
    b.averageReadPercent - a.averageReadPercent ||
    b.lastReadAt.localeCompare(a.lastReadAt)
  )
}

export async function getMostReadStats(windowDays = 7, limit = 50): Promise<MostReadStat[]> {
  const safeDays = Math.max(1, Math.min(windowDays, 30))
  const safeLimit = Math.max(1, Math.min(limit, 200))
  const cutoff = new Date(Date.now() - safeDays * 86_400_000)
  const database = await getPool()
  if (database) {
    await ensureSchema()
    const result = await database.query(
      `select article_slug as "articleSlug",
              max(article_category) as "articleCategory",
              max(article_title_ne) as "articleTitleNe",
              count(distinct owner_key)::int as "uniqueReaders",
              round(avg(read_percent))::int as "averageReadPercent",
              round(avg(dwell_seconds))::int as "averageDwellSeconds",
              avg(case when completed then 1 else 0 end)::float as "completionRate",
              sum(sessions)::int as "totalSessions",
              max(read_at) as "lastReadAt"
       from nw_reading
       where read_at >= $1 and read_percent >= 10
       group by article_slug
       order by count(distinct owner_key) desc,
                avg(dwell_seconds) desc,
                avg(read_percent) desc,
                max(read_at) desc
       limit $2`,
      [cutoff.toISOString(), safeLimit],
    )
    return result.rows.map((row) => ({
      articleSlug: String(row.articleSlug),
      articleCategory: String(row.articleCategory ?? ''),
      articleTitleNe: String(row.articleTitleNe ?? ''),
      uniqueReaders: Number(row.uniqueReaders ?? 0),
      averageReadPercent: Number(row.averageReadPercent ?? 0),
      averageDwellSeconds: Number(row.averageDwellSeconds ?? 0),
      completionRate: Number(row.completionRate ?? 0),
      totalSessions: Number(row.totalSessions ?? 0),
      lastReadAt: new Date(row.lastReadAt as string | Date).toISOString(),
    }))
  }

  const rows = Object.values((await readLocal()).readings).filter(
    (item) => Date.parse(item.readAt) >= cutoff.getTime() && item.readPercent >= 10,
  )
  const grouped = new Map<string, MostReadStat & { dwellSum: number }>()
  for (const item of rows) {
    const current = grouped.get(item.articleSlug)
    if (!current) {
      grouped.set(item.articleSlug, {
        articleSlug: item.articleSlug,
        articleCategory: item.articleCategory,
        articleTitleNe: item.articleTitleNe,
        uniqueReaders: 1,
        averageReadPercent: Math.round(item.readPercent),
        averageDwellSeconds: Math.round(item.dwellSeconds ?? 0),
        completionRate: item.completed ? 1 : 0,
        totalSessions: item.sessions ?? 1,
        lastReadAt: item.readAt,
        dwellSum: item.dwellSeconds ?? 0,
      })
      continue
    }
    const nextCount = current.uniqueReaders + 1
    current.averageReadPercent = Math.round(
      (current.averageReadPercent * current.uniqueReaders + item.readPercent) / nextCount,
    )
    current.dwellSum += item.dwellSeconds ?? 0
    current.averageDwellSeconds = Math.round(current.dwellSum / nextCount)
    current.completionRate =
      (current.completionRate * current.uniqueReaders + (item.completed ? 1 : 0)) / nextCount
    current.totalSessions += item.sessions ?? 1
    current.uniqueReaders = nextCount
    if (item.readAt > current.lastReadAt) current.lastReadAt = item.readAt
  }
  return Array.from(grouped.values())
    .map(({ dwellSum: _dwellSum, ...stat }) => stat)
    .sort(compareMostReadStats)
    .slice(0, safeLimit)
}

/** Bookmark velocity for ranking — count saves in the recent window, no owner keys returned. */
export async function getBookmarkVelocityStats(
  windowMinutes = 120,
  limit = 80,
): Promise<BookmarkVelocityStat[]> {
  const safeMinutes = Math.max(15, Math.min(windowMinutes, 24 * 60))
  const safeLimit = Math.max(1, Math.min(limit, 200))
  const cutoff = new Date(Date.now() - safeMinutes * 60_000)
  const hourCutoff = new Date(Date.now() - 60_000)
  const database = await getPool()
  if (database) {
    await ensureSchema()
    const result = await database.query(
      `select article_slug as "articleSlug",
              max(article_category) as "articleCategory",
              count(*)::int as bookmarks,
              count(*) filter (where created_at >= $2)::int as "bookmarksLastHour"
       from nw_bookmarks
       where created_at >= $1
       group by article_slug
       order by count(*) desc, max(created_at) desc
       limit $3`,
      [cutoff.toISOString(), hourCutoff.toISOString(), safeLimit],
    )
    return result.rows.map((row) => ({
      articleSlug: String(row.articleSlug),
      articleCategory: String(row.articleCategory ?? ''),
      bookmarks: Number(row.bookmarks ?? 0),
      bookmarksLastHour: Number(row.bookmarksLastHour ?? 0),
    }))
  }

  const rows = Object.values((await readLocal()).bookmarks).filter(
    (item) => Date.parse(item.createdAt) >= cutoff.getTime(),
  )
  const grouped = new Map<string, BookmarkVelocityStat>()
  for (const item of rows) {
    const current = grouped.get(item.articleSlug) ?? {
      articleSlug: item.articleSlug,
      articleCategory: item.articleCategory,
      bookmarks: 0,
      bookmarksLastHour: 0,
    }
    current.bookmarks += 1
    if (Date.parse(item.createdAt) >= hourCutoff.getTime()) current.bookmarksLastHour += 1
    grouped.set(item.articleSlug, current)
  }
  return Array.from(grouped.values())
    .sort((a, b) => b.bookmarks - a.bookmarks || b.bookmarksLastHour - a.bookmarksLastHour)
    .slice(0, safeLimit)
}

/** Recent reader activity shaped for the shared trending detector. No identity leaves the store. */
export async function getTrendingSamples(windowMinutes = 120): Promise<EngagementSample[]> {
  const cutoff = new Date(Date.now() - Math.max(15, windowMinutes) * 60_000)
  const cutoffIso = cutoff.toISOString()
  const database = await getPool()
  if (database) {
    await ensureSchema()
    const samples: EngagementSample[] = []

    const pushRows = async (
      sql: string,
      map: (row: Record<string, unknown>) => EngagementSample | null,
    ) => {
      try {
        const result = await database.query(sql, [cutoffIso])
        for (const row of result.rows) {
          const sample = map(row)
          if (sample) samples.push(sample)
        }
      } catch (error) {
        console.error(
          '[trending] sample query failed',
          error instanceof Error ? error.message : error,
        )
      }
    }

    await pushRows(
      `select article_slug as "articleId", article_category as "categorySlug",
              read_at as "at", last_session_seconds as "dwellSeconds", read_percent as "readPercent"
       from nw_reading where read_at >= $1`,
      (row) => {
        // Windowed: last session seconds only — lifetime dwell_seconds would inflate velocity.
        const dwell = Number(row.dwellSeconds ?? 0)
        const readPercent = Number(row.readPercent ?? 0)
        // Base open + deep-scroll bonus; measured dwellSeconds also weights trending.
        const views = 1 + (readPercent >= 50 ? 1 : 0)
        return {
          articleId: String(row.articleId ?? ''),
          categorySlug: row.categorySlug ? String(row.categorySlug) : undefined,
          at: new Date(row.at as string | Date).toISOString(),
          views: Math.max(1, views),
          shares: 0,
          comments: 0,
          bookmarks: 0,
          dwellSeconds: Math.max(0, dwell),
        }
      },
    )

    await pushRows(
      `select article_slug as "articleId", article_category as "categorySlug", created_at as "at"
       from nw_comments where status='approved' and created_at >= $1`,
      (row) => ({
        articleId: String(row.articleId ?? ''),
        categorySlug: row.categorySlug ? String(row.categorySlug) : undefined,
        at: new Date(row.at as string | Date).toISOString(),
        views: 0,
        shares: 0,
        comments: 1,
        bookmarks: 0,
      }),
    )

    await pushRows(
      `select article_slug as "articleId", article_category as "categorySlug", created_at as "at"
       from nw_bookmarks where created_at >= $1`,
      (row) => ({
        articleId: String(row.articleId ?? ''),
        categorySlug: row.categorySlug ? String(row.categorySlug) : undefined,
        at: new Date(row.at as string | Date).toISOString(),
        views: 0,
        shares: 0,
        comments: 0,
        bookmarks: 1,
      }),
    )

    await pushRows(
      `select article_slug as "articleId", article_category as "categorySlug",
              created_at as "at", event_type as "eventType"
       from nw_ranking_events where created_at >= $1`,
      (row) => {
        const type = String(row.eventType ?? '')
        if (type === 'share') {
          return {
            articleId: String(row.articleId ?? ''),
            categorySlug: row.categorySlug ? String(row.categorySlug) : undefined,
            at: new Date(row.at as string | Date).toISOString(),
            views: 0,
            shares: 1,
            comments: 0,
            bookmarks: 0,
          }
        }
        if (type === 'impression' || type === 'click') {
          return {
            articleId: String(row.articleId ?? ''),
            categorySlug: row.categorySlug ? String(row.categorySlug) : undefined,
            at: new Date(row.at as string | Date).toISOString(),
            views: type === 'click' ? 2 : 1,
            shares: 0,
            comments: 0,
            bookmarks: 0,
          }
        }
        return null
      },
    )

    await pushRows(
      `select article_slug as "articleId", article_category as "categorySlug", created_at as "at"
       from nw_reactions where created_at >= $1`,
      (row) => ({
        articleId: String(row.articleId ?? ''),
        categorySlug: row.categorySlug ? String(row.categorySlug) : undefined,
        at: new Date(row.at as string | Date).toISOString(),
        // Reactions count as lightweight engagement (same weight family as comments).
        views: 0,
        shares: 0,
        comments: 1,
        bookmarks: 0,
      }),
    )

    return samples.filter((sample) => Boolean(sample.articleId))
  }

  const store = await readLocal()
  const readings: EngagementSample[] = Object.values(store.readings)
    .filter((item) => Date.parse(item.readAt) >= cutoff.getTime())
    .map((item) => {
      // Prefer last-session dwell for recent velocity; fall back for legacy rows.
      const dwell = item.lastSessionSeconds ?? item.dwellSeconds ?? 0
      const views = 1 + (item.readPercent >= 50 ? 1 : 0)
      return {
        articleId: item.articleSlug,
        categorySlug: item.articleCategory,
        at: item.readAt,
        views: Math.max(1, views),
        shares: 0,
        comments: 0,
        bookmarks: 0,
        dwellSeconds: Math.max(0, dwell),
      }
    })
  const comments: EngagementSample[] = store.comments
    .filter((item) => item.status === 'approved' && Date.parse(item.createdAt) >= cutoff.getTime())
    .map((item) => ({
      articleId: item.articleSlug,
      categorySlug: item.articleCategory,
      at: item.createdAt,
      views: 0,
      shares: 0,
      comments: 1,
      bookmarks: 0,
    }))
  const bookmarks: EngagementSample[] = Object.values(store.bookmarks)
    .filter((item) => Date.parse(item.createdAt) >= cutoff.getTime())
    .map((item) => ({
      articleId: item.articleSlug,
      categorySlug: item.articleCategory,
      at: item.createdAt,
      views: 0,
      shares: 0,
      comments: 0,
      bookmarks: 1,
    }))
  const shares: EngagementSample[] = (
    await getRankingShareSamples(windowMinutes).catch(() => [])
  ).map((item) => ({
    articleId: item.articleSlug,
    categorySlug: item.articleCategory,
    at: item.at,
    views: 0,
    shares: 1,
    comments: 0,
    bookmarks: 0,
  }))
  const attention: EngagementSample[] = (
    await getRankingAttentionSamples(windowMinutes).catch(() => [])
  ).map((item) => ({
    articleId: item.articleSlug,
    categorySlug: item.articleCategory,
    at: item.at,
    views: item.type === 'click' ? 2 : 1,
    shares: 0,
    comments: 0,
    bookmarks: 0,
  }))
  return [...readings, ...comments, ...bookmarks, ...shares, ...attention]
}
