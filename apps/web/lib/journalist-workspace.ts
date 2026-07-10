import 'server-only'

export type JournalistDraftMeta = {
  articleSlug: string
  reporterId: string
  reportingLocation?: string
  sourceNote?: string
  editorPitch?: string
  customHomepageText?: string
  customSocialText?: string
  createdAt: string
  updatedAt: string
}

type Queryable = {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: T[]; rowCount: number | null }>
}

type Row = {
  article_slug: string
  reporter_id: string
  reporting_location: string | null
  source_note: string | null
  editor_pitch: string | null
  custom_homepage_text: string | null
  custom_social_text: string | null
  created_at: Date | string
  updated_at: Date | string
}

const memory = new Map<string, JournalistDraftMeta>()
let poolPromise: Promise<Queryable | null> | null = null
let schemaReady: Promise<void> | null = null

async function getPool(): Promise<Queryable | null> {
  if (process.env.NEXT_PHASE === 'phase-production-build') return null
  if (!process.env.DATABASE_URL?.startsWith('postgres')) return null
  if (!poolPromise) {
    poolPromise = (async () => {
      const { Pool } = await import('pg')
      return new Pool({ connectionString: process.env.DATABASE_URL, max: 5 }) as Queryable
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
        CREATE TABLE IF NOT EXISTS nw_journalist_draft_meta (
          article_slug text PRIMARY KEY,
          reporter_id text NOT NULL,
          reporting_location text,
          source_note text,
          editor_pitch text,
          custom_homepage_text text,
          custom_social_text text,
          created_at timestamptz NOT NULL DEFAULT now(),
          updated_at timestamptz NOT NULL DEFAULT now()
        )
      `)
      await pool.query(
        `CREATE INDEX IF NOT EXISTS nw_journalist_draft_meta_reporter_idx ON nw_journalist_draft_meta(reporter_id, updated_at DESC)`,
      )
    })()
  }
  await schemaReady
  return pool
}

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function rowToMeta(row: Row): JournalistDraftMeta {
  return {
    articleSlug: row.article_slug,
    reporterId: row.reporter_id,
    reportingLocation: row.reporting_location ?? undefined,
    sourceNote: row.source_note ?? undefined,
    editorPitch: row.editor_pitch ?? undefined,
    customHomepageText: row.custom_homepage_text ?? undefined,
    customSocialText: row.custom_social_text ?? undefined,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  }
}

export async function saveJournalistDraftMeta(input: {
  articleSlug: string
  reporterId: string
  reportingLocation?: string
  sourceNote?: string
  editorPitch?: string
  customHomepageText?: string
  customSocialText?: string
}): Promise<JournalistDraftMeta> {
  const now = new Date().toISOString()
  const meta: JournalistDraftMeta = {
    articleSlug: input.articleSlug,
    reporterId: input.reporterId,
    reportingLocation: input.reportingLocation?.slice(0, 160) || undefined,
    sourceNote: input.sourceNote?.slice(0, 2000) || undefined,
    editorPitch: input.editorPitch?.slice(0, 2000) || undefined,
    customHomepageText: input.customHomepageText?.slice(0, 220) || undefined,
    customSocialText: input.customSocialText?.slice(0, 280) || undefined,
    createdAt: now,
    updatedAt: now,
  }
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(
      `INSERT INTO nw_journalist_draft_meta (
        article_slug, reporter_id, reporting_location, source_note, editor_pitch,
        custom_homepage_text, custom_social_text
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (article_slug) DO UPDATE SET
        reporter_id = EXCLUDED.reporter_id,
        reporting_location = EXCLUDED.reporting_location,
        source_note = EXCLUDED.source_note,
        editor_pitch = EXCLUDED.editor_pitch,
        custom_homepage_text = EXCLUDED.custom_homepage_text,
        custom_social_text = EXCLUDED.custom_social_text,
        updated_at = now()
      RETURNING *`,
      [
        meta.articleSlug,
        meta.reporterId,
        meta.reportingLocation ?? null,
        meta.sourceNote ?? null,
        meta.editorPitch ?? null,
        meta.customHomepageText ?? null,
        meta.customSocialText ?? null,
      ],
    )
    return rowToMeta(result.rows[0]!)
  }
  memory.set(meta.articleSlug, meta)
  return meta
}

export async function listJournalistDraftMeta(reporterId?: string): Promise<JournalistDraftMeta[]> {
  const pool = await ensureSchema()
  if (pool) {
    const result = reporterId
      ? await pool.query<Row>(
          `SELECT * FROM nw_journalist_draft_meta WHERE reporter_id = $1 ORDER BY updated_at DESC LIMIT 100`,
          [reporterId],
        )
      : await pool.query<Row>(`SELECT * FROM nw_journalist_draft_meta ORDER BY updated_at DESC LIMIT 100`)
    return result.rows.map(rowToMeta)
  }
  const all = Array.from(memory.values())
  return (reporterId ? all.filter((m) => m.reporterId === reporterId) : all).sort((a, b) =>
    b.updatedAt > a.updatedAt ? 1 : -1,
  )
}
