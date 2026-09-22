import 'server-only'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { getStories } from '@/lib/content'
import {
  buildIndex,
  search,
  type SearchIndex,
  type SearchResult,
  type SearchableStory,
} from '@/lib/search'

/**
 * Server-side BM25 search.
 *
 * `/api/search` used to answer with `getStories({ q })`, i.e. a SQL substring
 * match ordered by publish date. That has two consequences the reader feels:
 * an inflected Nepali query (`बजेटको`) never matches a story that says `बजेट`,
 * and when it does match, the best story is not first — the newest is. The BM25
 * ranker in `lib/search` already knows how to do both, but it only ever ran in
 * the browser over the 120-story payload the page ships.
 *
 * So the same ranker runs here, over a much larger bounded corpus, behind a
 * module-scoped cache. Two deliberate bounds:
 *
 *  - `CORPUS_CAP` stories are indexed, not the whole archive. Building an
 *    inverted index per request over an unbounded corpus is how a search box
 *    takes a site down.
 *  - Anything older than the cap is still reachable, but through the content
 *    source's own `q` filter, appended after the ranked hits. Those are
 *    substring matches; they are not, and are not reported as, BM25-ranked.
 */

/** Stories held in the server index. Bounded: this is an in-process structure. */
const CORPUS_CAP = 600
/** Matches the search page's `revalidate`, so a publish shows up within a minute. */
const INDEX_TTL_MS = 60_000
/** Below this many ranked hits, reach past the cap into the older archive. */
const THIN_RESULT_FLOOR = 8
const ARCHIVE_FETCH = 48

/** Map a full story card onto the narrower shape the ranker and client share. */
export function toSearchableStory(story: StoryCardData): SearchableStory {
  return {
    id: story.id,
    slug: story.slug,
    category: story.category,
    categoryLabel: story.categoryLabel,
    titleNe: story.titleNe,
    titleEn: story.titleEn,
    deckNe: story.deckNe,
    deckEn: story.deckEn,
    byline: story.byline,
    publishedAt: story.publishedAt,
    hasEnglish: story.hasEnglish,
    isBreaking: story.isBreaking,
    authors: story.authors.map((author) => ({ name: author.name, slug: author.slug })),
    heroImage: story.heroImage ? { url: story.heroImage.url, alt: story.heroImage.alt } : null,
  }
}

type CachedIndex = {
  at: number
  index: SearchIndex
  slugs: Set<string>
}

let cache: CachedIndex | null = null
/**
 * Single in-flight build. Without this, the first request after a TTL
 * expiry — or a burst on a cold isolate — starts one full index build per
 * concurrent request, which is exactly when the site can least afford it.
 */
let building: Promise<CachedIndex> | null = null

function fresh(entry: CachedIndex | null): entry is CachedIndex {
  return entry !== null && Date.now() - entry.at < INDEX_TTL_MS
}

async function buildServerIndex(): Promise<CachedIndex> {
  // No locale filter: a Nepali query should still surface an English-headlined
  // story, which is why the client corpus is unfiltered too.
  const { items } = await getStories({ perPage: CORPUS_CAP, limit: CORPUS_CAP })
  const corpus = items.map(toSearchableStory)
  return {
    at: Date.now(),
    index: buildIndex(corpus),
    slugs: new Set(corpus.map((story) => story.slug)),
  }
}

/** Cached BM25 index, or `null` when the content source is unreachable. */
export async function getServerSearchIndex(): Promise<CachedIndex | null> {
  if (fresh(cache)) return cache
  if (!building) {
    building = buildServerIndex().finally(() => {
      building = null
    })
  }
  try {
    cache = await building
    return cache
  } catch (error) {
    console.error('[search] index build failed', error instanceof Error ? error.message : error)
    // A stale index answers better than a 503. Only give up if there is none.
    return cache
  }
}

export type ServerSearchResponse = {
  items: SearchResult[]
  total: number
  /** False when BM25 was unavailable and this is a raw content-source match. */
  ranked: boolean
  /** Stories in the BM25 index at answer time; 0 when unranked. */
  corpusSize: number
  /** True when the query was thin enough to also read past the indexed cap. */
  archiveConsulted: boolean
}

const EMPTY: ServerSearchResponse = {
  items: [],
  total: 0,
  ranked: false,
  corpusSize: 0,
  archiveConsulted: false,
}

/** Substring-matched stories older than the indexed cap, ranked among themselves. */
async function deepArchiveResults(
  query: string,
  locale: Locale,
  known: Set<string>,
  limit: number,
): Promise<SearchResult[]> {
  const { items } = await getStories({
    q: query,
    locale,
    page: 1,
    perPage: ARCHIVE_FETCH,
    limit: ARCHIVE_FETCH,
  })
  const extras = items.map(toSearchableStory).filter((story) => !known.has(story.slug))
  if (extras.length === 0) return []
  // Ranked within their own small index. Those scores are not comparable with
  // the main index's — different corpus, different IDF — so the caller keeps
  // them strictly after the ranked block rather than merging by score.
  return search(buildIndex(extras), query, limit)
}

/**
 * Rank `query` against the cached index, reaching into the older archive when
 * the ranked block is thin. Never throws: a failure degrades to the raw
 * content-source query, and then to an empty result.
 */
export async function searchStoriesRanked(
  rawQuery: string,
  locale: Locale,
  limit: number,
): Promise<ServerSearchResponse> {
  const query = rawQuery.trim()
  if (query.length < 2) return EMPTY

  const cached = await getServerSearchIndex()

  if (!cached) {
    // Index unavailable — fall back to what the route did before, and say so.
    try {
      const { items, total } = await getStories({
        q: query,
        locale,
        page: 1,
        perPage: limit,
        limit,
      })
      return {
        items: items.map((story) => ({ ...toSearchableStory(story), score: 0 })),
        total,
        ranked: false,
        corpusSize: 0,
        archiveConsulted: true,
      }
    } catch {
      return EMPTY
    }
  }

  const ranked = search(cached.index, query, limit)
  if (ranked.length >= THIN_RESULT_FLOOR || ranked.length >= limit) {
    return {
      items: ranked,
      total: ranked.length,
      ranked: true,
      corpusSize: cached.index.docCount,
      archiveConsulted: false,
    }
  }

  let extras: SearchResult[] = []
  try {
    extras = await deepArchiveResults(query, locale, cached.slugs, limit - ranked.length)
  } catch (error) {
    // The ranked block still stands on its own; log and answer with it.
    console.error(
      '[search] archive expansion failed',
      error instanceof Error ? error.message : error,
    )
  }

  const items = [...ranked, ...extras].slice(0, limit)
  return {
    items,
    total: items.length,
    ranked: true,
    corpusSize: cached.index.docCount,
    archiveConsulted: true,
  }
}

/** Test seam: drop the cached index so a suite can control what is indexed. */
export function resetServerSearchIndex(): void {
  cache = null
  building = null
}
