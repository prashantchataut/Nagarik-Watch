/**
 * @nagarikwatch/ingest — RSS/wire ingestion.
 *
 * Aggregates headlines from official Nepali news outlets via their public RSS feeds.
 * LEGAL POLICY (editorial-workflow.md §3 + Google News originality rules):
 *   - We ingest TITLE + LINK + PUBLISHED-DATE only.
 *   - We NEVER copy body text, ledes, or images from upstream articles.
 *   - Every aggregated item carries sourceName + sourceUrl; the reader always leaves
 *     Nagarik Watch to read the original on the publisher's own site.
 *   - Aggregated items are clearly labelled "स्रोतबाट / From wires" so readers never
 *     mistake them for original Nagarik Watch reporting.
 *
 * Resilience: each feed is fetched independently with a timeout; a single feed's
 * failure never breaks the others or the homepage render. The result is deduped
 * by sourceUrl so a feed that double-lists an item only appears once.
 */
import { z } from 'zod'

export interface IngestSource {
  id: string
  name: string
  /** RSS/Atom feed URL. */
  feedUrl: string
  /** Default sourceType for items from this source. */
  sourceType: 'aggregated' | 'wire'
  license?: string
}

export interface NormalizedItem {
  titleNe: string
  titleEn?: string
  sourceName: string
  sourceUrl: string
  sourcePublishedAt?: string
  /** Time Nagarik Watch retrieved the feed item; never presented as source publication time. */
  retrievedAt: string
  /** Always empty by policy — we never copy upstream body text. Kept on the type
   *  for compatibility with the original ingest contract; a future on-demand
   *  reader-preview could surface a short machine-excerpt, but only with licensing. */
  bodyHtml: string
  sourceType: 'aggregated' | 'wire'
  /** Outlet's category slug, when the feed exposes one (e.g. /rss/politics). */
  category?: string
}

/**
 * Curated registry of official Nepali outlets with public RSS feeds.
 * Add or remove feeds here as outlets publish or retire them. Every entry
 * must point at the OUTLET'S OWN feed — never a third-party scraper.
 */
export const INGEST_SOURCES: readonly IngestSource[] = [
  {
    id: 'ekantipur',
    name: 'कान्तिपुर',
    feedUrl: 'https://ekantipur.com/rss',
    sourceType: 'aggregated',
    license: 'headline+link only',
  },
  {
    id: 'ekantipur-news',
    name: 'Kantipur News',
    feedUrl: 'https://ekantipur.com/news/rss',
    sourceType: 'aggregated',
    license: 'headline+link only',
  },
  {
    id: 'onlinekhabar',
    name: 'अनलाइनखबर',
    feedUrl: 'https://www.onlinekhabar.com/feed',
    sourceType: 'aggregated',
    license: 'headline+link only',
  },
  {
    id: 'onlinekhabar-en',
    name: 'Onlinekhabar English',
    feedUrl: 'https://english.onlinekhabar.com/feed',
    sourceType: 'aggregated',
    license: 'headline+link only',
  },
  {
    id: 'ratopati',
    name: 'रातोपाती',
    feedUrl: 'https://ratopati.com/rss',
    sourceType: 'aggregated',
    license: 'headline+link only',
  },
  {
    id: 'setopati',
    name: 'सेतोपाती',
    feedUrl: 'https://www.setopati.com/rss',
    sourceType: 'aggregated',
    license: 'headline+link only',
  },
  {
    id: 'himalayan-times',
    name: 'The Himalayan Times',
    feedUrl: 'https://thehimalayantimes.com/feed',
    sourceType: 'aggregated',
    license: 'headline+link only',
  },
  {
    id: 'nepali-times',
    name: 'Nepali Times',
    feedUrl: 'https://www.nepalitimes.com/feed',
    sourceType: 'aggregated',
    license: 'headline+link only',
  },
  {
    id: 'annapurna-post',
    name: 'अन्नपूर्ण पोस्ट',
    feedUrl: 'https://www.annapurnapost.com/rss/news.rss',
    sourceType: 'aggregated',
    license: 'headline+link only',
  },
  {
    id: 'bbc-nepali',
    name: 'BBC Nepali',
    feedUrl: 'https://feeds.bbci.co.uk/nepali/rss.xml',
    sourceType: 'wire',
    license: 'headline+link only',
  },
  {
    id: 'rss-gorkhapatra',
    name: 'गोरखापत्र',
    feedUrl: 'https://gorkhapatraonline.com/rss',
    sourceType: 'aggregated',
    license: 'headline+link only',
  },
] as const

const CDATA_RE = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/
function decodeXmlEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|amp|lt|gt|quot|apos);/gi, (entity, token: string) => {
    const lower = token.toLowerCase()
    if (lower === 'amp') return '&'
    if (lower === 'lt') return '<'
    if (lower === 'gt') return '>'
    if (lower === 'quot') return '"'
    if (lower === 'apos') return "'"
    const numeric = lower.startsWith('#x')
      ? Number.parseInt(lower.slice(2), 16)
      : Number.parseInt(lower.slice(1), 10)
    return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : entity
  })
}

function unwrap(s: string | null | undefined): string {
  if (!s) return ''
  const trimmed = s.trim()
  const m = trimmed.match(CDATA_RE)
  return decodeXmlEntities((m?.[1] ?? trimmed).trim())
}

function normalizeSourceUrl(rawUrl: string, feedUrl: string): string | null {
  try {
    const url = new URL(rawUrl, feedUrl)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

const ItemSchema = z.object({
  title: z.string().optional(),
  link: z.string().optional(),
  pubDate: z.string().optional(),
  category: z.string().optional(),
})

/** Parse a raw RSS/Atom XML document into normalized items. Pure, testable,
 *  no network. Title + link + date only; body is discarded by policy. */
export function parseFeed(xml: string, source: IngestSource): NormalizedItem[] {
  const items: NormalizedItem[] = []
  const itemRe = /<item[\s\S]*?<\/item>|<entry[\s\S]*?<\/entry>/gi
  const matches = xml.match(itemRe) ?? []

  for (const block of matches) {
    const title = unwrap(extractTag(block, 'title'))
    const link = unwrap(extractTag(block, 'link')) || extractHref(block)
    const pubDate =
      unwrap(extractTag(block, 'pubDate')) ||
      unwrap(extractTag(block, 'published')) ||
      unwrap(extractTag(block, 'updated'))
    const category = unwrap(extractTag(block, 'category'))

    const parsed = ItemSchema.safeParse({ title, link, pubDate, category })
    if (!parsed.success) continue
    if (!title || !link) continue
    const sourceUrl = normalizeSourceUrl(link, source.feedUrl)
    if (!sourceUrl) continue

    const sourcePublishedAt = toIso(pubDate)
    const retrievedAt = new Date().toISOString()
    items.push({
      titleNe: title,
      sourceName: source.name,
      sourceUrl,
      sourcePublishedAt,
      retrievedAt,
      bodyHtml: '',
      sourceType: source.sourceType,
      category: category || undefined,
    })
  }
  return items
}

function extractTag(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i')
  const m = xml.match(re)
  return m ? m[1] : undefined
}

function extractHref(xml: string): string {
  const m = xml.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i)
  return m?.[1] ?? ''
}

function toIso(date: string): string | undefined {
  if (!date) return undefined
  const t = Date.parse(date)
  return Number.isFinite(t) ? new Date(t).toISOString() : undefined
}

export interface FeedFetchResult {
  source: IngestSource
  ok: boolean
  items: NormalizedItem[]
  error?: string
}

export interface AggregatedFeedResult {
  items: NormalizedItem[]
  successfulSources: number
  failedSources: Array<{ id: string; name: string; error: string }>
  retrievedAt: string
}

/** Fetch a single feed with an abortable timeout and explicit provider status. */
export async function fetchFeedResult(
  source: IngestSource,
  timeoutMs = 5000,
): Promise<FeedFetchResult> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(source.feedUrl, {
      headers: { 'user-agent': 'NagarikWatch/1.0 (+https://nagarikwatch.com)' },
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!res.ok) {
      return { source, ok: false, items: [], error: `HTTP ${res.status}` }
    }
    const xml = await res.text()
    return { source, ok: true, items: parseFeed(xml, source) }
  } catch (error) {
    const message =
      error instanceof Error && error.name === 'AbortError'
        ? `Timed out after ${timeoutMs}ms`
        : error instanceof Error
          ? error.message
          : 'Feed request failed'
    return { source, ok: false, items: [], error: message }
  } finally {
    clearTimeout(timeout)
  }
}

/** Backward-compatible item-only feed function. */
export async function fetchFeed(source: IngestSource, timeoutMs = 5000): Promise<NormalizedItem[]> {
  return (await fetchFeedResult(source, timeoutMs)).items
}

/** Fetch, normalize, deduplicate, and report provider health without copying article bodies. */
export async function fetchAggregatedFeedWithStatus(
  sources: readonly IngestSource[] = INGEST_SOURCES,
  limit = 20,
): Promise<AggregatedFeedResult> {
  const results = await Promise.all(sources.map((source) => fetchFeedResult(source)))
  const flat = results.flatMap((result) => result.items)

  const seen = new Set<string>()
  const items = flat
    .filter((item) => {
      if (seen.has(item.sourceUrl)) return false
      seen.add(item.sourceUrl)
      return true
    })
    .sort((a, b) => (b.sourcePublishedAt ?? '').localeCompare(a.sourcePublishedAt ?? ''))
    .slice(0, limit)

  return {
    items,
    successfulSources: results.filter((result) => result.ok).length,
    failedSources: results
      .filter((result) => !result.ok)
      .map((result) => ({
        id: result.source.id,
        name: result.source.name,
        error: result.error ?? 'Unknown provider failure',
      })),
    retrievedAt: new Date().toISOString(),
  }
}

/** Item-only entrypoint used by public surfaces. */
export async function fetchAggregatedFeed(
  sources: readonly IngestSource[] = INGEST_SOURCES,
  limit = 20,
): Promise<NormalizedItem[]> {
  return (await fetchAggregatedFeedWithStatus(sources, limit)).items
}
