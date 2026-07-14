import 'server-only'
import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import pg from 'pg'
import type { EngagementSample } from '@nagarikwatch/db'

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
  readPercent: number
}

export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'flagged'
export type ModerationComment = CommentInput & {
  id: string
  status: CommentStatus
  createdAt: string
}

type StoredBookmark = BookmarkInput & { createdAt: string }
type StoredVote = PollVoteInput & { id: string; createdAt: string }
type StoredReading = ReadingInput & { readAt: string }
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
let pool: pg.Pool | null = null
let schemaReady: Promise<void> | null = null

function getPool() {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null
  if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL is required for persistent reader engagement in production.')
    }
    return null
  }
  pool ??= new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    max: Number(process.env.ENGAGEMENT_DB_POOL_MAX || 5),
  })
  return pool
}

async function ensureSchema() {
  const database = getPool()
  if (!database) return
  schemaReady ??= database
    .query(`
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
  created_at timestamptz default now()
);
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
  read_percent integer not null,
  read_at timestamptz default now(),
  unique(owner_key,article_slug)
);`)
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
  const database = getPool()
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
export async function isValidCommentParent(articleSlug: string, parentId: string): Promise<boolean> {
  const database = getPool()
  if (database) {
    await ensureSchema()
    const result = await database.query(
      `select 1 from nw_comments where id=$1 and article_slug=$2 and status='approved' limit 1`,
      [parentId, articleSlug],
    )
    return Number(result.rowCount ?? 0) > 0
  }
  return (await readLocal()).comments.some(
    (comment) =>
      comment.id === parentId && comment.articleSlug === articleSlug && comment.status === 'approved',
  )
}

export async function addBookmark(input: BookmarkInput) {
  const database = getPool()
  if (database) {
    await ensureSchema()
    await database.query(
      `insert into nw_bookmarks(id,owner_key,article_slug,article_category,article_title_ne)
       values($1,$2,$3,$4,$5)
       on conflict(owner_key,article_slug) do update set
       article_category=excluded.article_category,article_title_ne=excluded.article_title_ne`,
      [randomUUID(), owner(input.anonymousId, input.userId), input.articleSlug, input.articleCategory, input.articleTitleNe],
    )
    return
  }
  const store = await readLocal()
  const key = `${owner(input.anonymousId, input.userId)}:${input.articleSlug}`
  await writeLocal({ ...store, bookmarks: { ...store.bookmarks, [key]: { ...input, createdAt: new Date().toISOString() } } })
}

export async function removeBookmark(anonymousId: string, userId: string | undefined, articleSlug: string) {
  const database = getPool()
  if (database) {
    await ensureSchema()
    await database.query('delete from nw_bookmarks where owner_key=$1 and article_slug=$2', [owner(anonymousId, userId), articleSlug])
    return
  }
  const store = await readLocal()
  const bookmarks = { ...store.bookmarks }
  delete bookmarks[`${owner(anonymousId, userId)}:${articleSlug}`]
  await writeLocal({ ...store, bookmarks })
}

export async function getBookmarks(anonymousId: string, userId?: string) {
  const database = getPool()
  if (database) {
    await ensureSchema()
    const result = await database.query(
      `select article_slug as "articleSlug", article_category as "articleCategory",
              article_title_ne as "articleTitleNe", created_at as "createdAt"
       from nw_bookmarks where owner_key=$1 order by created_at desc`,
      [owner(anonymousId, userId)],
    )
    return result.rows as Array<{ articleSlug: string; articleCategory: string; articleTitleNe: string; createdAt: string }>
  }
  const keyPrefix = `${owner(anonymousId, userId)}:`
  return Object.entries((await readLocal()).bookmarks)
    .filter(([key]) => key.startsWith(keyPrefix))
    .map(([, value]) => value)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function createComment(input: CommentInput): Promise<ModerationComment> {
  const item: ModerationComment = { id: randomUUID(), ...input, status: 'pending', createdAt: new Date().toISOString() }
  const database = getPool()
  if (database) {
    await ensureSchema()
    await database.query(
      `insert into nw_comments(id,article_slug,article_category,author_name,author_email,author_user_id,body_ne,parent_id,locale,status)
       values($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')`,
      [item.id, input.articleSlug, input.articleCategory, input.authorName, input.authorEmail ?? null, input.authorUserId ?? null, input.bodyNe, input.parentId ?? null, input.locale],
    )
    return item
  }
  const store = await readLocal()
  await writeLocal({ ...store, comments: [...store.comments, item] })
  return item
}

export async function getCommentsForArticle(articleSlug: string) {
  const database = getPool()
  if (database) {
    await ensureSchema()
    const result = await database.query(
      `select id, author_name as "authorName", body_ne as "bodyNe", parent_id as "parentId",
              locale, status, created_at as "createdAt"
       from nw_comments where article_slug=$1 and status='approved' order by created_at asc`,
      [articleSlug],
    )
    return result.rows as Array<Pick<ModerationComment, 'id' | 'authorName' | 'bodyNe' | 'parentId' | 'locale' | 'status' | 'createdAt'>>
  }
  return (await readLocal()).comments.filter((comment) => comment.articleSlug === articleSlug && comment.status === 'approved')
}

export async function listCommentsForModeration(status: CommentStatus | 'all' = 'pending', limit = 200): Promise<ModerationComment[]> {
  const database = getPool()
  if (database) {
    await ensureSchema()
    const values: unknown[] = []
    const where = status === 'all' ? '' : `where status=$${values.push(status)}`
    values.push(limit)
    const result = await database.query(
      `select id, article_slug as "articleSlug", article_category as "articleCategory",
              author_name as "authorName", author_email as "authorEmail",
              author_user_id as "authorUserId", body_ne as "bodyNe", parent_id as "parentId",
              locale, status, created_at as "createdAt"
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
  const database = getPool()
  if (database) {
    await ensureSchema()
    const result = await database.query('update nw_comments set status=$2 where id=$1', [commentId, status])
    return Number(result.rowCount ?? 0) > 0
  }
  const store = await readLocal()
  const index = store.comments.findIndex((comment) => comment.id === commentId)
  if (index === -1) return false
  const comments = [...store.comments]
  comments[index] = { ...comments[index]!, status }
  await writeLocal({ ...store, comments })
  return true
}

export async function getPollVoteCounts(pollId: string): Promise<Record<string, number>> {
  const database = getPool()
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
  const database = getPool()
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
  await writeLocal({ ...store, votes: { ...store.votes, [key]: { ...input, id: randomUUID(), createdAt: new Date().toISOString() } } })
  return { recorded: true, results: await getPollVoteCounts(input.pollId) }
}

export async function recordReading(input: ReadingInput) {
  const database = getPool()
  if (database) {
    await ensureSchema()
    await database.query(
      `insert into nw_reading(id,owner_key,article_slug,article_category,article_title_ne,read_percent)
       values($1,$2,$3,$4,$5,$6)
       on conflict(owner_key,article_slug) do update set read_percent=excluded.read_percent,read_at=now()`,
      [randomUUID(), owner(input.anonymousId, input.userId), input.articleSlug, input.articleCategory, input.articleTitleNe, Math.round(input.readPercent)],
    )
    return
  }
  const store = await readLocal()
  const key = `${owner(input.anonymousId, input.userId)}:${input.articleSlug}`
  await writeLocal({ ...store, readings: { ...store.readings, [key]: { ...input, readAt: new Date().toISOString() } } })
}


export type MostReadStat = {
  articleSlug: string
  articleCategory: string
  articleTitleNe: string
  uniqueReaders: number
  averageReadPercent: number
  lastReadAt: string
}

/** Aggregate privacy-preserving first-party reading activity. Owner keys never leave storage. */
export async function getMostReadStats(windowDays = 7, limit = 50): Promise<MostReadStat[]> {
  const safeDays = Math.max(1, Math.min(windowDays, 30))
  const safeLimit = Math.max(1, Math.min(limit, 200))
  const cutoff = new Date(Date.now() - safeDays * 86_400_000)
  const database = getPool()
  if (database) {
    await ensureSchema()
    const result = await database.query(
      `select article_slug as "articleSlug",
              max(article_category) as "articleCategory",
              max(article_title_ne) as "articleTitleNe",
              count(distinct owner_key)::int as "uniqueReaders",
              round(avg(read_percent))::int as "averageReadPercent",
              max(read_at) as "lastReadAt"
       from nw_reading
       where read_at >= $1 and read_percent >= 10
       group by article_slug
       order by count(distinct owner_key) desc, avg(read_percent) desc, max(read_at) desc
       limit $2`,
      [cutoff.toISOString(), safeLimit],
    )
    return result.rows.map((row) => ({
      articleSlug: String(row.articleSlug),
      articleCategory: String(row.articleCategory ?? ''),
      articleTitleNe: String(row.articleTitleNe ?? ''),
      uniqueReaders: Number(row.uniqueReaders ?? 0),
      averageReadPercent: Number(row.averageReadPercent ?? 0),
      lastReadAt: new Date(row.lastReadAt as string | Date).toISOString(),
    }))
  }

  const rows = Object.values((await readLocal()).readings).filter(
    (item) => Date.parse(item.readAt) >= cutoff.getTime() && item.readPercent >= 10,
  )
  const grouped = new Map<string, MostReadStat>()
  for (const item of rows) {
    const current = grouped.get(item.articleSlug)
    if (!current) {
      grouped.set(item.articleSlug, {
        articleSlug: item.articleSlug,
        articleCategory: item.articleCategory,
        articleTitleNe: item.articleTitleNe,
        uniqueReaders: 1,
        averageReadPercent: Math.round(item.readPercent),
        lastReadAt: item.readAt,
      })
      continue
    }
    const nextCount = current.uniqueReaders + 1
    current.averageReadPercent = Math.round(
      (current.averageReadPercent * current.uniqueReaders + item.readPercent) / nextCount,
    )
    current.uniqueReaders = nextCount
    if (item.readAt > current.lastReadAt) current.lastReadAt = item.readAt
  }
  return Array.from(grouped.values())
    .sort(
      (a, b) =>
        b.uniqueReaders - a.uniqueReaders ||
        b.averageReadPercent - a.averageReadPercent ||
        b.lastReadAt.localeCompare(a.lastReadAt),
    )
    .slice(0, safeLimit)
}


/** Recent reader activity shaped for the shared trending detector. No identity leaves the store. */
export async function getTrendingSamples(windowMinutes = 120): Promise<EngagementSample[]> {
  const cutoff = new Date(Date.now() - Math.max(15, windowMinutes) * 60_000)
  const database = getPool()
  if (database) {
    await ensureSchema()
    const result = await database.query(
      `select article_slug as "articleId", article_category as "categorySlug",
              read_at as "at", 1::int as views, 0::int as shares, 0::int as comments
       from nw_reading where read_at >= $1
       union all
       select article_slug as "articleId", article_category as "categorySlug",
              created_at as "at", 0::int as views, 0::int as shares, 1::int as comments
       from nw_comments where status='approved' and created_at >= $1`,
      [cutoff.toISOString()],
    )
    return result.rows.map((row) => ({
      articleId: String(row.articleId),
      categorySlug: row.categorySlug ? String(row.categorySlug) : undefined,
      at: new Date(row.at as string | Date).toISOString(),
      views: Number(row.views ?? 0),
      shares: Number(row.shares ?? 0),
      comments: Number(row.comments ?? 0),
    }))
  }

  const store = await readLocal()
  const readings: EngagementSample[] = Object.values(store.readings)
    .filter((item) => Date.parse(item.readAt) >= cutoff.getTime())
    .map((item) => ({
      articleId: item.articleSlug,
      categorySlug: item.articleCategory,
      at: item.readAt,
      views: 1,
      shares: 0,
      comments: 0,
    }))
  const comments: EngagementSample[] = store.comments
    .filter((item) => item.status === 'approved' && Date.parse(item.createdAt) >= cutoff.getTime())
    .map((item) => ({
      articleId: item.articleSlug,
      categorySlug: item.articleCategory,
      at: item.createdAt,
      views: 0,
      shares: 0,
      comments: 1,
    }))
  return [...readings, ...comments]
}
