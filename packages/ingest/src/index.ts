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
  sourcePublishedAt: string
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
    id: 'kathmandu-post',
    name: 'Kathmandu Post',
    feedUrl: 'https://kathmandupost.com/rss',
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
] as const

const CDATA_RE = /^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/
function unwrap(s: string | null | undefined): string {
  if (!s) return ''
  const m = s.trim().match(CDATA_RE)
  return m?.[1] ? m[1].trim() : s.trim()
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

    const iso = toIso(pubDate)
    items.push({
      titleNe: title,
      sourceName: source.name,
      sourceUrl: link,
      sourcePublishedAt: iso,
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

function toIso(date: string): string {
  if (!date) return new Date().toISOString()
  const t = Date.parse(date)
  return Number.isFinite(t) ? new Date(t).toISOString() : new Date().toISOString()
}

/** Fetch a single feed with a timeout; returns [] on any failure so one dead
 *  feed never breaks the rest of the aggregate. */
export async function fetchFeed(source: IngestSource, timeoutMs = 5000): Promise<NormalizedItem[]> {
  try {
    const res = await withTimeout(
      fetch(source.feedUrl, {
        headers: { 'user-agent': 'NagarikWatch/1.0 (+https://nagarikwatch.com)' },
        cache: 'no-store',
      }),
      timeoutMs,
    )
    if (!res.ok) return []
    const xml = await res.text()
    return parseFeed(xml, source)
  } catch {
    return []
  }
}

/** Fetch all configured feeds in parallel, normalize, dedupe by URL, sort
 *  newest-first, and cap. This is the entrypoint the homepage "From wires"
 *  section calls. */
export async function fetchAggregatedFeed(
  sources: readonly IngestSource[] = INGEST_SOURCES,
  limit = 20,
): Promise<NormalizedItem[]> {
  const results = await Promise.all(sources.map((s) => fetchFeed(s)))
  const flat = results.flat()

  const seen = new Set<string>()
  const deduped = flat.filter((item) => {
    if (seen.has(item.sourceUrl)) return false
    seen.add(item.sourceUrl)
    return true
  })

  return deduped
    .sort((a, b) => b.sourcePublishedAt.localeCompare(a.sourcePublishedAt))
    .slice(0, limit)
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timer = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('ingest timeout')), ms),
  )
  return Promise.race([promise, timer])
}
