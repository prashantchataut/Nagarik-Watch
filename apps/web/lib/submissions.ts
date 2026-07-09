import 'server-only'
import type { Locale } from '@nagarikwatch/db'

export type SubmissionType = 'tip' | 'document' | 'photo' | 'video' | 'psa' | 'correction' | 'other'
export type SubmissionStatus = 'new' | 'in_review' | 'accepted' | 'rejected'

export type ReaderSubmission = {
  id: string
  type: SubmissionType
  status: SubmissionStatus
  headline: string
  description: string
  name?: string
  email?: string
  phone?: string
  evidenceUrl?: string
  anonymous: boolean
  consent: boolean
  locale: Locale
  ipHash: string
  userId?: string
  editorNote?: string
  handledBy?: string
  createdAt: string
  updatedAt: string
}

type Queryable = {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: T[]; rowCount: number | null }>
}

type SubmissionRow = {
  id: string
  type: SubmissionType
  status: SubmissionStatus
  headline: string
  description: string
  name: string | null
  email: string | null
  phone: string | null
  evidence_url: string | null
  anonymous: boolean
  consent: boolean
  locale: Locale
  ip_hash: string
  user_id: string | null
  editor_note: string | null
  handled_by: string | null
  created_at: Date | string
  updated_at: Date | string
}

const memory = new Map<string, ReaderSubmission>()
let poolPromise: Promise<Queryable | null> | null = null
let schemaReady: Promise<void> | null = null

export function submissionsStorageMode(): 'postgres' | 'memory' {
  return process.env.DATABASE_URL?.startsWith('postgres') ? 'postgres' : 'memory'
}

async function getPool(): Promise<Queryable | null> {
  if (submissionsStorageMode() !== 'postgres') return null
  if (!poolPromise) {
    poolPromise = (async () => {
      const { Pool } = await import('pg')
      return new Pool({
        connectionString: process.env.DATABASE_URL,
        max: Number(process.env.SUBMISSIONS_DB_POOL_MAX ?? 5),
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
        )
      `)
      await pool.query(
        `CREATE INDEX IF NOT EXISTS nw_submissions_status_idx ON nw_submissions(status, created_at DESC)`,
      )
      await pool.query(
        `CREATE INDEX IF NOT EXISTS nw_submissions_type_idx ON nw_submissions(type, created_at DESC)`,
      )
    })()
  }
  await schemaReady
  return pool
}

function genId(): string {
  return `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function rowToSubmission(row: SubmissionRow): ReaderSubmission {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    headline: row.headline,
    description: row.description,
    name: row.name ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    evidenceUrl: row.evidence_url ?? undefined,
    anonymous: Boolean(row.anonymous),
    consent: Boolean(row.consent),
    locale: row.locale === 'en' ? 'en' : 'ne',
    ipHash: row.ip_hash,
    userId: row.user_id ?? undefined,
    editorNote: row.editor_note ?? undefined,
    handledBy: row.handled_by ?? undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  }
}

function asType(value: string): SubmissionType {
  if (
    value === 'tip' ||
    value === 'document' ||
    value === 'photo' ||
    value === 'video' ||
    value === 'psa' ||
    value === 'correction' ||
    value === 'other'
  ) {
    return value
  }
  return 'tip'
}

export function asSubmissionStatus(value: string | undefined): 'all' | SubmissionStatus {
  if (value === 'new' || value === 'in_review' || value === 'accepted' || value === 'rejected') {
    return value
  }
  return value === 'all' ? 'all' : 'new'
}

export async function createSubmission(input: {
  type: string
  headline: string
  description: string
  name?: string
  email?: string
  phone?: string
  evidenceUrl?: string
  anonymous?: boolean
  consent: boolean
  locale: Locale
  ipHash: string
  userId?: string
}): Promise<ReaderSubmission> {
  const now = new Date().toISOString()
  const submission: ReaderSubmission = {
    id: genId(),
    type: asType(input.type),
    status: 'new',
    headline: input.headline.slice(0, 160),
    description: input.description.slice(0, 5000),
    name: input.name?.slice(0, 100) || undefined,
    email: input.email?.slice(0, 180) || undefined,
    phone: input.phone?.slice(0, 40) || undefined,
    evidenceUrl: input.evidenceUrl?.slice(0, 500) || undefined,
    anonymous: Boolean(input.anonymous),
    consent: input.consent,
    locale: input.locale,
    ipHash: input.ipHash,
    userId: input.userId,
    createdAt: now,
    updatedAt: now,
  }

  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<SubmissionRow>(
      `INSERT INTO nw_submissions (
        id, type, status, headline, description, name, email, phone, evidence_url,
        anonymous, consent, locale, ip_hash, user_id, created_at, updated_at
      ) VALUES ($1,$2,'new',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now(),now())
      RETURNING *`,
      [
        submission.id,
        submission.type,
        submission.headline,
        submission.description,
        submission.name ?? null,
        submission.email ?? null,
        submission.phone ?? null,
        submission.evidenceUrl ?? null,
        submission.anonymous,
        submission.consent,
        submission.locale,
        submission.ipHash,
        submission.userId ?? null,
      ],
    )
    return rowToSubmission(result.rows[0]!)
  }

  memory.set(submission.id, submission)
  return submission
}

export async function listSubmissions(opts: {
  status?: SubmissionStatus
  limit?: number
} = {}): Promise<ReaderSubmission[]> {
  const pool = await ensureSchema()
  const limit = Math.max(1, Math.min(500, opts.limit ?? 100))
  if (pool) {
    const result = opts.status
      ? await pool.query<SubmissionRow>(
          `SELECT * FROM nw_submissions WHERE status = $1 ORDER BY created_at DESC LIMIT $2`,
          [opts.status, limit],
        )
      : await pool.query<SubmissionRow>(
          `SELECT * FROM nw_submissions ORDER BY created_at DESC LIMIT $1`,
          [limit],
        )
    return result.rows.map(rowToSubmission)
  }

  let all = Array.from(memory.values())
  if (opts.status) all = all.filter((item) => item.status === opts.status)
  all.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
  return all.slice(0, limit)
}

export async function updateSubmissionStatus(input: {
  id: string
  status: SubmissionStatus
  editorNote?: string
  handledBy?: string
}): Promise<boolean> {
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query(
      `UPDATE nw_submissions
       SET status = $2, editor_note = COALESCE($3, editor_note), handled_by = $4, updated_at = now()
       WHERE id = $1`,
      [input.id, input.status, input.editorNote ?? null, input.handledBy ?? null],
    )
    return Number(result.rowCount ?? 0) > 0
  }

  const existing = memory.get(input.id)
  if (!existing) return false
  memory.set(input.id, {
    ...existing,
    status: input.status,
    editorNote: input.editorNote ?? existing.editorNote,
    handledBy: input.handledBy ?? existing.handledBy,
    updatedAt: new Date().toISOString(),
  })
  return true
}
