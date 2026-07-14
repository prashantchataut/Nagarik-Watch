import 'server-only'
import { ensureOperationalSchema, isProductionRuntime, type Queryable, toIso } from '@/lib/ops-db'

export type JournalistDraftMeta = {
  articleId?: string
  articleSlug: string
  titleNe: string
  categorySlug: string
  workflowStage: string
  reporterId: string
  reportingLocation?: string
  sourceNote?: string
  editorPitch?: string
  mediaReferenceUrl?: string
  customHomepageText?: string
  customSocialText?: string
  notificationMode: 'none' | 'breaking' | 'followers'
  notificationTags: string[]
  editorFeedback?: string
  revisionRequestedAt?: string
  createdAt: string
  updatedAt: string
}

type Row = {
  article_id: string | null
  article_slug: string
  title_ne: string | null
  category_slug: string | null
  workflow_stage: string | null
  reporter_id: string
  reporting_location: string | null
  source_note: string | null
  editor_pitch: string | null
  media_reference_url: string | null
  custom_homepage_text: string | null
  custom_social_text: string | null
  notification_mode: string | null
  notification_tags: unknown
  editor_feedback: string | null
  revision_requested_at: Date | string | null
  created_at: Date | string
  updated_at: Date | string
}

const memory = new Map<string, JournalistDraftMeta>()

async function setup(pool: Queryable) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nw_journalist_draft_meta (
      article_slug text PRIMARY KEY,
      article_id text,
      title_ne text,
      category_slug text,
      workflow_stage text NOT NULL DEFAULT 'draft',
      reporter_id text NOT NULL,
      reporting_location text,
      source_note text,
      editor_pitch text,
      media_reference_url text,
      custom_homepage_text text,
      custom_social_text text,
      notification_mode text NOT NULL DEFAULT 'none',
      notification_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
      editor_feedback text,
      revision_requested_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    ALTER TABLE nw_journalist_draft_meta ADD COLUMN IF NOT EXISTS article_id text;
    ALTER TABLE nw_journalist_draft_meta ADD COLUMN IF NOT EXISTS title_ne text;
    ALTER TABLE nw_journalist_draft_meta ADD COLUMN IF NOT EXISTS category_slug text;
    ALTER TABLE nw_journalist_draft_meta ADD COLUMN IF NOT EXISTS workflow_stage text NOT NULL DEFAULT 'draft';
    ALTER TABLE nw_journalist_draft_meta ADD COLUMN IF NOT EXISTS media_reference_url text;
    ALTER TABLE nw_journalist_draft_meta ADD COLUMN IF NOT EXISTS notification_mode text NOT NULL DEFAULT 'none';
    ALTER TABLE nw_journalist_draft_meta ADD COLUMN IF NOT EXISTS notification_tags jsonb NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE nw_journalist_draft_meta ADD COLUMN IF NOT EXISTS editor_feedback text;
    ALTER TABLE nw_journalist_draft_meta ADD COLUMN IF NOT EXISTS revision_requested_at timestamptz;
    CREATE UNIQUE INDEX IF NOT EXISTS nw_journalist_draft_meta_article_id_idx
      ON nw_journalist_draft_meta(article_id) WHERE article_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS nw_journalist_draft_meta_reporter_idx
      ON nw_journalist_draft_meta(reporter_id, updated_at DESC);
  `)
}

async function pool(): Promise<Queryable | null> {
  try {
    return await ensureOperationalSchema('journalist-workspace-v2', setup)
  } catch (error) {
    if (isProductionRuntime()) throw error
    return null
  }
}

function list(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.map(String).map((item) => item.trim().toLowerCase()).filter(Boolean))].slice(0, 40)
}

function mode(value: unknown): JournalistDraftMeta['notificationMode'] {
  return value === 'breaking' || value === 'followers' ? value : 'none'
}

function rowToMeta(row: Row): JournalistDraftMeta {
  return {
    articleId: row.article_id ?? undefined,
    articleSlug: row.article_slug,
    titleNe: row.title_ne ?? row.article_slug,
    categorySlug: row.category_slug ?? '',
    workflowStage: row.workflow_stage ?? 'draft',
    reporterId: row.reporter_id,
    reportingLocation: row.reporting_location ?? undefined,
    sourceNote: row.source_note ?? undefined,
    editorPitch: row.editor_pitch ?? undefined,
    mediaReferenceUrl: row.media_reference_url ?? undefined,
    customHomepageText: row.custom_homepage_text ?? undefined,
    customSocialText: row.custom_social_text ?? undefined,
    notificationMode: mode(row.notification_mode),
    notificationTags: list(row.notification_tags),
    editorFeedback: row.editor_feedback ?? undefined,
    revisionRequestedAt: row.revision_requested_at ? toIso(row.revision_requested_at) : undefined,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }
}

export async function saveJournalistDraftMeta(input: {
  articleId?: string
  articleSlug: string
  titleNe?: string
  categorySlug?: string
  workflowStage?: string
  reporterId: string
  reportingLocation?: string
  sourceNote?: string
  editorPitch?: string
  mediaReferenceUrl?: string
  customHomepageText?: string
  customSocialText?: string
  notificationMode?: JournalistDraftMeta['notificationMode']
  notificationTags?: string[]
  editorFeedback?: string
  revisionRequestedAt?: string
}): Promise<JournalistDraftMeta> {
  const now = new Date().toISOString()
  const existing = await getJournalistDraftMeta(input.articleId || input.articleSlug, input.reporterId)
  const meta: JournalistDraftMeta = {
    articleId: input.articleId?.slice(0, 160) || existing?.articleId,
    articleSlug: input.articleSlug.slice(0, 160),
    titleNe: input.titleNe?.trim().slice(0, 240) || existing?.titleNe || input.articleSlug,
    categorySlug: input.categorySlug?.trim().slice(0, 120) || existing?.categorySlug || '',
    workflowStage: input.workflowStage?.trim().slice(0, 60) || existing?.workflowStage || 'draft',
    reporterId: input.reporterId,
    reportingLocation: input.reportingLocation?.trim().slice(0, 160) || undefined,
    sourceNote: input.sourceNote?.trim().slice(0, 4000) || undefined,
    editorPitch: input.editorPitch?.trim().slice(0, 2400) || undefined,
    mediaReferenceUrl: input.mediaReferenceUrl?.trim().slice(0, 2048) || undefined,
    customHomepageText: input.customHomepageText?.trim().slice(0, 220) || undefined,
    customSocialText: input.customSocialText?.trim().slice(0, 280) || undefined,
    notificationMode: mode(input.notificationMode ?? existing?.notificationMode),
    notificationTags: list(input.notificationTags ?? existing?.notificationTags),
    editorFeedback: input.editorFeedback?.trim().slice(0, 4000) || existing?.editorFeedback,
    revisionRequestedAt: input.revisionRequestedAt || existing?.revisionRequestedAt,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
  const database = await pool()
  if (database) {
    const result = await database.query<Row>(
      `INSERT INTO nw_journalist_draft_meta(
        article_slug,article_id,title_ne,category_slug,workflow_stage,reporter_id,
        reporting_location,source_note,editor_pitch,media_reference_url,custom_homepage_text,custom_social_text,
        notification_mode,notification_tags,editor_feedback,revision_requested_at
      ) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15,$16)
      ON CONFLICT(article_slug) DO UPDATE SET
        article_id=COALESCE(excluded.article_id,nw_journalist_draft_meta.article_id),
        title_ne=excluded.title_ne,category_slug=excluded.category_slug,
        workflow_stage=excluded.workflow_stage,reporter_id=excluded.reporter_id,
        reporting_location=excluded.reporting_location,source_note=excluded.source_note,
        editor_pitch=excluded.editor_pitch,media_reference_url=excluded.media_reference_url,
        custom_homepage_text=excluded.custom_homepage_text,
        custom_social_text=excluded.custom_social_text,notification_mode=excluded.notification_mode,
        notification_tags=excluded.notification_tags,editor_feedback=COALESCE(excluded.editor_feedback,nw_journalist_draft_meta.editor_feedback),
        revision_requested_at=COALESCE(excluded.revision_requested_at,nw_journalist_draft_meta.revision_requested_at),
        updated_at=now()
      RETURNING *`,
      [
        meta.articleSlug,meta.articleId ?? null,meta.titleNe,meta.categorySlug,meta.workflowStage,
        meta.reporterId,meta.reportingLocation ?? null,meta.sourceNote ?? null,meta.editorPitch ?? null,
        meta.mediaReferenceUrl ?? null,meta.customHomepageText ?? null,meta.customSocialText ?? null,meta.notificationMode,
        JSON.stringify(meta.notificationTags),meta.editorFeedback ?? null,meta.revisionRequestedAt ?? null,
      ],
    )
    return rowToMeta(result.rows[0]!)
  }
  memory.set(meta.articleSlug, meta)
  return meta
}

export async function listJournalistDraftMeta(reporterId?: string): Promise<JournalistDraftMeta[]> {
  const database = await pool()
  if (database) {
    const result = reporterId
      ? await database.query<Row>(`SELECT * FROM nw_journalist_draft_meta WHERE reporter_id=$1 ORDER BY updated_at DESC LIMIT 100`, [reporterId])
      : await database.query<Row>(`SELECT * FROM nw_journalist_draft_meta ORDER BY updated_at DESC LIMIT 100`)
    return result.rows.map(rowToMeta)
  }
  return [...memory.values()]
    .filter((item) => !reporterId || item.reporterId === reporterId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getJournalistDraftMeta(identifier: string, reporterId?: string): Promise<JournalistDraftMeta | null> {
  const database = await pool()
  if (database) {
    const params: unknown[] = [identifier]
    const reporterFilter = reporterId ? `AND reporter_id=$${params.push(reporterId)}` : ''
    const result = await database.query<Row>(
      `SELECT * FROM nw_journalist_draft_meta WHERE (article_id=$1 OR article_slug=$1) ${reporterFilter} LIMIT 1`,
      params,
    )
    return result.rows[0] ? rowToMeta(result.rows[0]) : null
  }
  return [...memory.values()].find((item) =>
    (item.articleId === identifier || item.articleSlug === identifier) && (!reporterId || item.reporterId === reporterId),
  ) ?? null
}

export async function setJournalistFeedback(
  identifier: string,
  reporterId: string,
  feedback: string | null,
  revisionRequestedAt: string | null,
): Promise<JournalistDraftMeta | null> {
  const database = await pool()
  if (database) {
    const result = await database.query<Row>(
      `UPDATE nw_journalist_draft_meta
       SET editor_feedback=$3, revision_requested_at=$4, updated_at=now()
       WHERE (article_id=$1 OR article_slug=$1) AND reporter_id=$2
       RETURNING *`,
      [identifier, reporterId, feedback, revisionRequestedAt],
    )
    return result.rows[0] ? rowToMeta(result.rows[0]) : null
  }
  const current = await getJournalistDraftMeta(identifier, reporterId)
  if (!current) return null
  const next: JournalistDraftMeta = {
    ...current,
    editorFeedback: feedback ?? undefined,
    revisionRequestedAt: revisionRequestedAt ?? undefined,
    updatedAt: new Date().toISOString(),
  }
  memory.delete(current.articleSlug)
  memory.set(next.articleSlug, next)
  return next
}
