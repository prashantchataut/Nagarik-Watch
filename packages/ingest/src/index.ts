/**
 * @nagarikwatch/ingest — wire/RSS ingestion (Phase 2, Task 2.9).
 *
 * Placeholder for now: the public surface is declared so dependent code can import it,
 * but the actual fetch/normalize/dedupe/sanitize pipeline is built in Phase 2 per
 * docs/phase-2-tasks.md. See editorial-workflow.md §3 for the attribution rules every
 * ingested item must satisfy.
 */

export interface IngestSource {
  id: string
  name: string
  /** RSS/Atom feed URL. */
  feedUrl: string
  /** Default sourceType for items from this source. */
  sourceType: 'aggregated' | 'wire'
  license?: string
}

/**
 * Normalize a raw feed item into a draft-article shape. Implemented in Phase 2.
 * Contract: returns a draft with sourceName + sourceUrl + sourcePublishedAt set
 * (editorial-workflow.md §3 enforcement happens in the CMS, not here).
 */
export interface NormalizedItem {
  titleNe: string
  sourceName: string
  sourceUrl: string
  sourcePublishedAt: string
  bodyHtml: string // raw; sanitized before persisting
  sourceType: 'aggregated' | 'wire'
}

export async function fetchFeed(_source: IngestSource): Promise<NormalizedItem[]> {
  throw new Error('Not implemented — see docs/phase-2-tasks.md Task 2.9')
}
