import 'server-only'
import {
  ensureOperationalSchema,
  requireOperationalPool,
  type Queryable,
  toIso,
} from '@/lib/ops-db'

export type ReaderPreferences = {
  categories: string[]
  tags: string[]
  authors: string[]
  provinces: string[]
  breaking: boolean
  followedTopics: boolean
  followedAuthors: boolean
  dailyDigest: boolean
  browserAlerts: boolean
  quietStart: number | null
  quietEnd: number | null
  timeZone: string
  updatedAt: string
}

type PreferenceRow = {
  owner_key: string
  categories: unknown
  tags: unknown
  authors: unknown
  provinces: unknown
  breaking: boolean
  followed_topics: boolean
  followed_authors: boolean
  daily_digest: boolean
  browser_alerts: boolean
  quiet_start: number | null
  quiet_end: number | null
  time_zone: string
  updated_at: Date | string
}

const memory = new Map<string, ReaderPreferences>()

function ownerKey(fingerprint: string, userId?: string) {
  return userId ? `user:${userId}` : `anon:${fingerprint}`
}

function cleanList(value: unknown, max = 50): string[] {
  if (!Array.isArray(value)) return []
  return [
    ...new Set(
      value
        .map(String)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    ),
  ]
    .filter((item) => item.length <= 100)
    .slice(0, max)
}

function timeZone(value: unknown): string {
  const candidate = String(value ?? '').trim()
  if (!candidate || candidate.length > 80) return 'Asia/Kathmandu'
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: candidate }).format(new Date())
    return candidate
  } catch {
    return 'Asia/Kathmandu'
  }
}

function hour(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 23 ? parsed : null
}

export function defaultReaderPreferences(): ReaderPreferences {
  return {
    categories: [],
    tags: [],
    authors: [],
    provinces: [],
    breaking: true,
    followedTopics: true,
    followedAuthors: true,
    dailyDigest: false,
    browserAlerts: false,
    quietStart: 22,
    quietEnd: 7,
    timeZone: 'Asia/Kathmandu',
    updatedAt: new Date(0).toISOString(),
  }
}

function normalize(input: Partial<ReaderPreferences>): ReaderPreferences {
  return {
    categories: cleanList(input.categories),
    tags: cleanList(input.tags),
    authors: cleanList(input.authors),
    provinces: cleanList(input.provinces),
    breaking: input.breaking !== false,
    followedTopics: input.followedTopics !== false,
    followedAuthors: input.followedAuthors !== false,
    dailyDigest: Boolean(input.dailyDigest),
    browserAlerts: Boolean(input.browserAlerts),
    quietStart: hour(input.quietStart),
    quietEnd: hour(input.quietEnd),
    timeZone: timeZone(input.timeZone),
    updatedAt: new Date().toISOString(),
  }
}

async function setup(pool: Queryable) {
  await pool.query(`
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
  `)
}

async function operationalPool(): Promise<Queryable | null> {
  return requireOperationalPool(await ensureOperationalSchema('reader-preferences-v1', setup))
}

function rowToPreferences(row: PreferenceRow): ReaderPreferences {
  return {
    categories: cleanList(row.categories),
    tags: cleanList(row.tags),
    authors: cleanList(row.authors),
    provinces: cleanList(row.provinces),
    breaking: row.breaking,
    followedTopics: row.followed_topics,
    followedAuthors: row.followed_authors,
    dailyDigest: row.daily_digest,
    browserAlerts: row.browser_alerts,
    quietStart: row.quiet_start,
    quietEnd: row.quiet_end,
    timeZone: timeZone(row.time_zone),
    updatedAt: toIso(row.updated_at),
  }
}

export async function getReaderPreferences(
  fingerprint: string,
  userId?: string,
): Promise<ReaderPreferences> {
  const key = ownerKey(fingerprint, userId)
  const pool = await operationalPool()
  if (pool) {
    const result = await pool.query<PreferenceRow>(
      `SELECT * FROM nw_reader_preferences WHERE owner_key=$1 LIMIT 1`,
      [key],
    )
    return result.rows[0] ? rowToPreferences(result.rows[0]) : defaultReaderPreferences()
  }
  return memory.get(key) ?? defaultReaderPreferences()
}

export async function saveReaderPreferences(
  fingerprint: string,
  userId: string | undefined,
  input: Partial<ReaderPreferences>,
): Promise<ReaderPreferences> {
  const current = await getReaderPreferences(fingerprint, userId)
  const next = normalize({ ...current, ...input })
  const key = ownerKey(fingerprint, userId)
  const pool = await operationalPool()
  if (pool) {
    const result = await pool.query<PreferenceRow>(
      `INSERT INTO nw_reader_preferences(
        owner_key,categories,tags,authors,provinces,breaking,followed_topics,
        followed_authors,daily_digest,browser_alerts,quiet_start,quiet_end,time_zone,updated_at
      ) VALUES($1,$2::jsonb,$3::jsonb,$4::jsonb,$5::jsonb,$6,$7,$8,$9,$10,$11,$12,$13,now())
      ON CONFLICT(owner_key) DO UPDATE SET
        categories=excluded.categories,tags=excluded.tags,authors=excluded.authors,
        provinces=excluded.provinces,breaking=excluded.breaking,
        followed_topics=excluded.followed_topics,followed_authors=excluded.followed_authors,
        daily_digest=excluded.daily_digest,browser_alerts=excluded.browser_alerts,
        quiet_start=excluded.quiet_start,quiet_end=excluded.quiet_end,time_zone=excluded.time_zone,updated_at=now()
      RETURNING *`,
      [
        key,
        JSON.stringify(next.categories),
        JSON.stringify(next.tags),
        JSON.stringify(next.authors),
        JSON.stringify(next.provinces),
        next.breaking,
        next.followedTopics,
        next.followedAuthors,
        next.dailyDigest,
        next.browserAlerts,
        next.quietStart,
        next.quietEnd,
        next.timeZone,
      ],
    )
    return rowToPreferences(result.rows[0]!)
  }
  memory.set(key, next)
  return next
}

export async function mergeAnonymousPreferences(
  fingerprint: string,
  userId: string,
): Promise<void> {
  if (!fingerprint.trim()) return
  const anonymous = await getReaderPreferences(fingerprint)
  const account = await getReaderPreferences('', userId)
  const untouched = anonymous.updatedAt === new Date(0).toISOString()
  if (untouched) return
  await saveReaderPreferences('', userId, {
    ...account,
    categories: [...new Set([...account.categories, ...anonymous.categories])],
    tags: [...new Set([...account.tags, ...anonymous.tags])],
    authors: [...new Set([...account.authors, ...anonymous.authors])],
    provinces: [...new Set([...account.provinces, ...anonymous.provinces])],
    breaking: account.breaking && anonymous.breaking,
    followedTopics: account.followedTopics && anonymous.followedTopics,
    followedAuthors: account.followedAuthors && anonymous.followedAuthors,
    dailyDigest: account.dailyDigest || anonymous.dailyDigest,
    browserAlerts: account.browserAlerts || anonymous.browserAlerts,
    timeZone:
      Date.parse(anonymous.updatedAt) > Date.parse(account.updatedAt)
        ? anonymous.timeZone
        : account.timeZone,
  })
}

export function sanitizeReaderPreferenceInput(
  body: Record<string, unknown>,
): Partial<ReaderPreferences> {
  const output: Partial<ReaderPreferences> = {}
  for (const key of ['categories', 'tags', 'authors', 'provinces'] as const) {
    if (key in body) output[key] = cleanList(body[key])
  }
  for (const key of [
    'breaking',
    'followedTopics',
    'followedAuthors',
    'dailyDigest',
    'browserAlerts',
  ] as const) {
    if (key in body) output[key] = Boolean(body[key])
  }
  if ('quietStart' in body) output.quietStart = hour(body.quietStart)
  if ('quietEnd' in body) output.quietEnd = hour(body.quietEnd)
  if ('timeZone' in body) output.timeZone = timeZone(body.timeZone)
  return output
}
