import 'server-only'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { asSlug, cleanMultiline, cleanText, ensureOperationalSchema, toIso, type Queryable } from '@/lib/ops-db'

export type LiveBlogStatus = 'scheduled' | 'live' | 'closed'

export type LiveBlogRecord = {
  id: string
  slug: string
  titleNe: string
  titleEn?: string
  summaryNe?: string
  summaryEn?: string
  status: LiveBlogStatus
  createdBy: string
  createdAt: string
  updatedAt: string
  startedAt?: string
  endedAt?: string
}

export type LiveBlogUpdateRecord = {
  id: string
  liveBlogId: string
  bodyNe: string
  bodyEn?: string
  authorEmail: string
  pinned: boolean
  createdAt: string
}

type BlogRow = {
  id: string
  slug: string
  title_ne: string
  title_en: string | null
  summary_ne: string | null
  summary_en: string | null
  status: LiveBlogStatus
  created_by: string
  created_at: Date | string
  updated_at: Date | string
  started_at: Date | string | null
  ended_at: Date | string | null
}

type UpdateRow = {
  id: string
  live_blog_id: string
  body_ne: string
  body_en: string | null
  author_email: string
  pinned: boolean
  created_at: Date | string
}

type LocalStore = {
  blogs: LiveBlogRecord[]
  updates: LiveBlogUpdateRecord[]
}

const LOCAL_STORE_PATH =
  process.env.LIVE_BLOG_STORE_PATH ?? path.join(process.cwd(), '.data', 'live-blogs.json')
let localWriteQueue = Promise.resolve()

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build'
}

async function schema(): Promise<Queryable | null> {
  const pool = await ensureOperationalSchema('live-blogs', async (database) => {
    await database.query(`
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
      )
    `)
    await database.query(`
      CREATE TABLE IF NOT EXISTS nw_live_blog_updates (
        id text PRIMARY KEY,
        live_blog_id text NOT NULL REFERENCES nw_live_blogs(id) ON DELETE CASCADE,
        body_ne text NOT NULL,
        body_en text,
        author_email text NOT NULL,
        pinned boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `)
    await database.query(
      `CREATE INDEX IF NOT EXISTS nw_live_blog_updates_blog_idx ON nw_live_blog_updates(live_blog_id, created_at DESC)`,
    )
  })
  if (!pool && isProductionRuntime()) {
    throw new Error('DATABASE_URL is required for live-blog persistence in production')
  }
  return pool
}

function blogFromRow(row: BlogRow): LiveBlogRecord {
  return {
    id: row.id,
    slug: row.slug,
    titleNe: row.title_ne,
    titleEn: row.title_en ?? undefined,
    summaryNe: row.summary_ne ?? undefined,
    summaryEn: row.summary_en ?? undefined,
    status: row.status,
    createdBy: row.created_by,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    startedAt: row.started_at ? toIso(row.started_at) : undefined,
    endedAt: row.ended_at ? toIso(row.ended_at) : undefined,
  }
}

function updateFromRow(row: UpdateRow): LiveBlogUpdateRecord {
  return {
    id: row.id,
    liveBlogId: row.live_blog_id,
    bodyNe: row.body_ne,
    bodyEn: row.body_en ?? undefined,
    authorEmail: row.author_email,
    pinned: row.pinned,
    createdAt: toIso(row.created_at),
  }
}

async function readLocal(): Promise<LocalStore> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return { blogs: [], updates: [] }
  try {
    const parsed = JSON.parse(await readFile(LOCAL_STORE_PATH, 'utf8')) as Partial<LocalStore>
    return {
      blogs: Array.isArray(parsed.blogs) ? parsed.blogs : [],
      updates: Array.isArray(parsed.updates) ? parsed.updates : [],
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { blogs: [], updates: [] }
    throw new Error(`Unable to read local live-blog store: ${(error as Error).message}`)
  }
}

async function writeLocal(store: LocalStore): Promise<void> {
  await mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true })
  const temporaryPath = `${LOCAL_STORE_PATH}.${process.pid}.tmp`
  await writeFile(temporaryPath, `${JSON.stringify(store, null, 2)}\n`, 'utf8')
  await rename(temporaryPath, LOCAL_STORE_PATH)
}

async function mutateLocal<T>(mutation: (store: LocalStore) => T | Promise<T>): Promise<T> {
  let result!: T
  localWriteQueue = localWriteQueue.then(async () => {
    const store = await readLocal()
    result = await mutation(store)
    await writeLocal(store)
  })
  await localWriteQueue
  return result
}

function status(value: unknown): LiveBlogStatus {
  return value === 'live' || value === 'closed' ? value : 'scheduled'
}

export async function listLiveBlogs(): Promise<LiveBlogRecord[]> {
  const pool = await schema()
  if (pool) {
    const result = await pool.query<BlogRow>(
      `SELECT * FROM nw_live_blogs ORDER BY
       CASE status WHEN 'live' THEN 0 WHEN 'scheduled' THEN 1 ELSE 2 END,
       updated_at DESC`,
    )
    return result.rows.map(blogFromRow)
  }
  return (await readLocal()).blogs.sort((a, b) => {
    const priority = { live: 0, scheduled: 1, closed: 2 }
    return priority[a.status] - priority[b.status] || b.updatedAt.localeCompare(a.updatedAt)
  })
}

export async function getLiveBlogBySlug(
  slug: string,
): Promise<{ blog: LiveBlogRecord; updates: LiveBlogUpdateRecord[] } | null> {
  const pool = await schema()
  if (pool) {
    const blogs = await pool.query<BlogRow>('SELECT * FROM nw_live_blogs WHERE slug = $1', [slug])
    const blog = blogs.rows[0]
    if (!blog) return null
    const updates = await pool.query<UpdateRow>(
      `SELECT * FROM nw_live_blog_updates WHERE live_blog_id = $1
       ORDER BY pinned DESC, created_at DESC`,
      [blog.id],
    )
    return { blog: blogFromRow(blog), updates: updates.rows.map(updateFromRow) }
  }
  const store = await readLocal()
  const blog = store.blogs.find((item) => item.slug === slug)
  if (!blog) return null
  const updates = store.updates
    .filter((item) => item.liveBlogId === blog.id)
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt))
  return { blog, updates }
}

export async function createLiveBlog(input: {
  titleNe: unknown
  titleEn?: unknown
  slug?: unknown
  summaryNe?: unknown
  summaryEn?: unknown
  status?: unknown
  createdBy: string
}): Promise<LiveBlogRecord> {
  const titleNe = cleanText(input.titleNe, 180)
  if (!titleNe) throw new Error('Live blog title is required')
  const now = new Date().toISOString()
  const initialStatus = status(input.status)
  const blog: LiveBlogRecord = {
    id: randomUUID(),
    slug: asSlug(input.slug || input.titleEn || titleNe, 'live'),
    titleNe,
    titleEn: cleanText(input.titleEn, 180) || undefined,
    summaryNe: cleanMultiline(input.summaryNe, 1200) || undefined,
    summaryEn: cleanMultiline(input.summaryEn, 1200) || undefined,
    status: initialStatus,
    createdBy: cleanText(input.createdBy, 240),
    createdAt: now,
    updatedAt: now,
    startedAt: initialStatus === 'live' ? now : undefined,
  }
  const pool = await schema()
  if (pool) {
    const result = await pool.query<BlogRow>(
      `INSERT INTO nw_live_blogs
       (id, slug, title_ne, title_en, summary_ne, summary_en, status, created_by, started_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        blog.id,
        blog.slug,
        blog.titleNe,
        blog.titleEn ?? null,
        blog.summaryNe ?? null,
        blog.summaryEn ?? null,
        blog.status,
        blog.createdBy,
        blog.startedAt ?? null,
      ],
    )
    const saved = result.rows[0]
    if (!saved) throw new Error('Live blog was not persisted')
    return blogFromRow(saved)
  }
  return mutateLocal((store) => {
    if (store.blogs.some((item) => item.slug === blog.slug)) {
      throw new Error(`Live blog slug already exists: ${blog.slug}`)
    }
    store.blogs.push(blog)
    return blog
  })
}

export async function addLiveBlogUpdate(input: {
  liveBlogId: string
  bodyNe: unknown
  bodyEn?: unknown
  authorEmail: string
  pinned?: unknown
}): Promise<LiveBlogUpdateRecord> {
  const bodyNe = cleanMultiline(input.bodyNe, 8000)
  if (!bodyNe) throw new Error('Update text is required')
  const update: LiveBlogUpdateRecord = {
    id: randomUUID(),
    liveBlogId: cleanText(input.liveBlogId, 100),
    bodyNe,
    bodyEn: cleanMultiline(input.bodyEn, 8000) || undefined,
    authorEmail: cleanText(input.authorEmail, 240),
    pinned: input.pinned === true || input.pinned === 'on',
    createdAt: new Date().toISOString(),
  }
  const pool = await schema()
  if (pool) {
    const result = await pool.query<UpdateRow>(
      `INSERT INTO nw_live_blog_updates
       (id, live_blog_id, body_ne, body_en, author_email, pinned)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [update.id, update.liveBlogId, update.bodyNe, update.bodyEn ?? null, update.authorEmail, update.pinned],
    )
    await pool.query('UPDATE nw_live_blogs SET updated_at = now() WHERE id = $1', [update.liveBlogId])
    const saved = result.rows[0]
    if (!saved) throw new Error('Live blog update was not persisted')
    return updateFromRow(saved)
  }
  return mutateLocal((store) => {
    if (!store.blogs.some((blog) => blog.id === update.liveBlogId)) {
      throw new Error('Live blog not found')
    }
    store.updates.push(update)
    store.blogs = store.blogs.map((blog) =>
      blog.id === update.liveBlogId ? { ...blog, updatedAt: update.createdAt } : blog,
    )
    return update
  })
}

export async function setLiveBlogStatus(
  id: string,
  nextStatus: LiveBlogStatus,
): Promise<LiveBlogRecord | null> {
  const now = new Date().toISOString()
  const pool = await schema()
  if (pool) {
    const result = await pool.query<BlogRow>(
      `UPDATE nw_live_blogs SET
         status = $2,
         started_at = CASE WHEN $2 = 'live' THEN COALESCE(started_at, now()) ELSE started_at END,
         ended_at = CASE WHEN $2 = 'closed' THEN now() ELSE NULL END,
         updated_at = now()
       WHERE id = $1 RETURNING *`,
      [id, nextStatus],
    )
    return result.rows[0] ? blogFromRow(result.rows[0]) : null
  }
  return mutateLocal((store) => {
    const index = store.blogs.findIndex((blog) => blog.id === id)
    if (index < 0) return null
    const current = store.blogs[index]!
    const updated: LiveBlogRecord = {
      ...current,
      status: nextStatus,
      startedAt: nextStatus === 'live' ? current.startedAt ?? now : current.startedAt,
      endedAt: nextStatus === 'closed' ? now : undefined,
      updatedAt: now,
    }
    store.blogs[index] = updated
    return updated
  })
}
