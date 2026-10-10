import 'server-only'
import { fetchSeismicBriefs, type OfficialBrief } from './official'
import { createArticle, articleSlugExists } from '@/lib/content/store/json-store'

/**
 * Official-source ingestion into the newsroom.
 *
 * Briefs land as `draft` and are never promoted automatically. The desk
 * verifies, adds the reporting a measurement cannot contain, and publishes
 * under a real byline — see `./official.ts` for why the
 * generated text is restricted to recorded values.
 */

/** The shared desk identity a draft is filed under until a reporter claims it. */
const INGEST_AUTHOR_ID = 'aut-newsroom-desk'

export interface IngestRunResult {
  job: string
  ok: boolean
  /** Briefs the source offered this run. */
  offered: number
  /** Briefs written as new drafts. */
  created: number
  /** Briefs already present from an earlier run. */
  skippedExisting: number
  /** Briefs rejected because the store refused them. */
  failed: number
  error?: string
  createdSlugs: string[]
}

/**
 * Re-running must not duplicate. The brief's slug is derived from the upstream
 * catalogue id, so an event already ingested produces the same slug and is
 * skipped. The check spans every workflow stage — a draft written last run
 * still counts, and so does one an editor has since published.
 */
async function writeBriefs(job: string, briefs: OfficialBrief[]): Promise<IngestRunResult> {
  const result: IngestRunResult = {
    job,
    ok: true,
    offered: briefs.length,
    created: 0,
    skippedExisting: 0,
    failed: 0,
    createdSlugs: [],
  }

  const seenThisRun = new Set<string>()

  for (const brief of briefs) {
    const key = `${brief.categorySlug}/${brief.slug}`
    if (seenThisRun.has(key)) continue
    seenThisRun.add(key)

    if (await articleSlugExists(brief.categorySlug, brief.slug)) {
      result.skippedExisting += 1
      continue
    }

    try {
      await createArticle({
        slug: brief.slug,
        categorySlug: brief.categorySlug,
        titleNe: brief.titleNe,
        deckNe: brief.deckNe,
        bodyNe: brief.bodyNe,
        authorIds: [INGEST_AUTHOR_ID],
        tagSlugs: [],
        // Draft, always. Promotion is an editor's decision.
        workflowStage: 'draft',
        publishedAt: brief.occurredAt,
        sourceType: 'original',
        sourceName: brief.sourceName,
        sourceUrl: brief.sourceUrl,
        sourceNote: brief.deskNote,
        editorPitch: brief.deskNote,
        createdBy: INGEST_AUTHOR_ID,
        commentsEnabled: true,
        noIndex: false,
        includeInNewsSitemap: true,
      })
      result.created += 1
      result.createdSlugs.push(brief.slug)
    } catch {
      // A refused brief must not abort the rest of the run.
      result.failed += 1
    }
  }

  return result
}

/** Seismic readings for the Nepal window, as newsroom drafts. */
export async function ingestSeismicDrafts(options?: {
  endpoint?: string
  fetchImpl?: typeof fetch
}): Promise<IngestRunResult> {
  const job = 'ingest-seismic'
  const feed = await fetchSeismicBriefs({
    endpoint: options?.endpoint ?? process.env.SEISMIC_FEED_URL,
    fetchImpl: options?.fetchImpl,
  })
  if (!feed.ok) {
    return {
      job,
      ok: false,
      offered: 0,
      created: 0,
      skippedExisting: 0,
      failed: 0,
      error: feed.error,
      createdSlugs: [],
    }
  }
  return writeBriefs(job, feed.briefs)
}
