/**
 * Official-source ingestion — primary instrument and institutional readings
 * turned into newsroom drafts.
 *
 * WHY THIS IS NOT AGGREGATION. `packages/ingest` carries an RSS parser for
 * licensed agency feeds and registers no publishers, because Nagarik Watch
 * does not republish other outlets' headlines. This module is the other
 * thing: it reads *primary* sources — a seismograph network, a central bank,
 * an exchange — and states what the instrument recorded. There is no upstream
 * article, so there is nothing to copy and no competitor to credit. The
 * institution is named because it is the origin of the measurement.
 *
 * WHAT IT MAY WRITE. Measured values and nothing else: magnitude, depth,
 * coordinates, time, the institution's own place string. It never infers
 * damage, casualties, cause or consequence, never attributes a statement to
 * anyone, and never adds an adjective a reading cannot support. Those are
 * reporting, and reporting needs a reporter.
 *
 * WHERE IT LANDS. Always `draft`, never `published`. A desk editor verifies
 * against the National Seismological Centre bulletin, adds the reporting a
 * reading cannot contain, and publishes under a real byline. Nothing here
 * reaches a reader on its own — DESIGN.md §8 ("no fixture journalism") holds.
 */
import type { ArticleBlock } from '@nagarikwatch/db'

/** Nepal plus the ~200km of Himalaya whose events are felt in-country. */
export const NEPAL_SEISMIC_BOUNDS = {
  minLat: 25.8,
  maxLat: 31.5,
  minLon: 79.5,
  maxLon: 89.5,
} as const

/**
 * Below this, an event is instrument-only: real, recorded, and not news.
 * M4.0 is roughly where Kathmandu Valley residents report feeling a tremor.
 */
export const FELT_MAGNITUDE_FLOOR = 4.0

export interface SeismicEvent {
  /** Upstream catalogue id; the idempotency key for ingestion. */
  id: string
  magnitude: number
  /** Depth in kilometres, when the catalogue reports one. */
  depthKm?: number
  latitude: number
  longitude: number
  /** The catalogue's own place string, verbatim. Not translated or guessed. */
  place: string
  occurredAt: string
  /** The institution's event page, for the desk to verify against. */
  sourceUrl?: string
}

export interface OfficialBrief {
  /** Stable across re-runs so an unchanged event is never ingested twice. */
  externalId: string
  slug: string
  categorySlug: string
  titleNe: string
  titleEn: string
  deckNe: string
  bodyNe: ArticleBlock[]
  sourceName: string
  sourceUrl?: string
  occurredAt: string
  /** Shown to the desk, never to a reader. States what still needs doing. */
  deskNote: string
}

const USGS_WEEK_FEED = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson'

function withinNepal(latitude: number, longitude: number): boolean {
  return (
    latitude >= NEPAL_SEISMIC_BOUNDS.minLat &&
    latitude <= NEPAL_SEISMIC_BOUNDS.maxLat &&
    longitude >= NEPAL_SEISMIC_BOUNDS.minLon &&
    longitude <= NEPAL_SEISMIC_BOUNDS.maxLon
  )
}

/** Devanagari numerals; Nepali surfaces use them for counted quantities. */
const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']
export function toDevanagariNumber(value: string | number): string {
  return String(value).replace(/\d/g, (digit) => DEVANAGARI_DIGITS[Number(digit)]!)
}

export interface UsgsFeature {
  id?: string
  properties?: {
    mag?: number | null
    place?: string | null
    time?: number | null
    url?: string | null
  }
  geometry?: { coordinates?: number[] }
}

/**
 * Parse a USGS GeoJSON summary into events inside the Nepal window that are
 * at or above the felt floor. Pure: no network, no clock, fully testable.
 */
export function parseUsgsFeed(json: { features?: UsgsFeature[] }): SeismicEvent[] {
  const events: SeismicEvent[] = []
  for (const feature of json.features ?? []) {
    const coordinates = feature.geometry?.coordinates
    const longitude = Number(coordinates?.[0])
    const latitude = Number(coordinates?.[1])
    const depthKm = Number(coordinates?.[2])
    const magnitude = Number(feature.properties?.mag)
    const time = Number(feature.properties?.time)

    if (!feature.id) continue
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue
    if (!Number.isFinite(magnitude) || magnitude < FELT_MAGNITUDE_FLOOR) continue
    // `Number(null)` is 0, which is finite — so a missing time would otherwise
    // survive as the epoch and date-stamp the brief 1970.
    if (!Number.isFinite(time) || time <= 0) continue
    if (!withinNepal(latitude, longitude)) continue

    events.push({
      id: feature.id,
      magnitude,
      depthKm: Number.isFinite(depthKm) ? depthKm : undefined,
      latitude,
      longitude,
      place: (feature.properties?.place ?? '').trim() || 'Nepal region',
      occurredAt: new Date(time).toISOString(),
      sourceUrl: feature.properties?.url ?? undefined,
    })
  }
  return events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
}

/**
 * Turn one reading into a draft brief.
 *
 * Every sentence below is a restatement of a recorded number. There is
 * deliberately no lede, no context paragraph and no consequence: an editor
 * writes those after checking the National Seismological Centre bulletin and
 * calling the district. The draft says so in `deskNote`.
 */
export function buildSeismicBrief(event: SeismicEvent): OfficialBrief {
  const magnitude = event.magnitude.toFixed(1)
  const magnitudeNe = toDevanagariNumber(magnitude)
  const depthNe = event.depthKm !== undefined ? toDevanagariNumber(event.depthKm.toFixed(0)) : null
  const latNe = toDevanagariNumber(event.latitude.toFixed(2))
  const lonNe = toDevanagariNumber(event.longitude.toFixed(2))

  const titleNe = `भूकम्प मापन: म्याग्निच्युड ${magnitudeNe}`
  const titleEn = `Magnitude ${magnitude} earthquake recorded`

  const measurements: string[] = [`म्याग्निच्युड ${magnitudeNe}`]
  if (depthNe) measurements.push(`केन्द्रविन्दुको गहिराइ ${depthNe} किलोमिटर`)
  measurements.push(`अक्षांश ${latNe}, देशान्तर ${lonNe}`)

  const bodyNe: ArticleBlock[] = [
    {
      type: 'paragraph',
      text: `भूकम्प मापन यन्त्रले ${measurements.join(', ')} रहेको अभिलेख गरेको छ।`,
    },
    {
      type: 'paragraph',
      text: `अभिलेखमा उल्लेख गरिएको स्थान: ${event.place}।`,
    },
  ]

  return {
    externalId: event.id,
    slug: `bhukampa-${event.id.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    categorySlug: 'society',
    titleNe,
    titleEn,
    deckNe: `मापन यन्त्रको प्रारम्भिक अभिलेख। क्षति र प्रभावको विवरण पुष्टि भएपछि मात्र थपिनेछ।`,
    bodyNe,
    sourceName: 'USGS Earthquake Hazards Program',
    sourceUrl: event.sourceUrl,
    occurredAt: event.occurredAt,
    deskNote:
      'स्वचालित मापन-मस्यौदा। प्रकाशन अघि राष्ट्रिय भूकम्प मापन केन्द्रको बुलेटिनसँग म्याग्निच्युड र केन्द्रविन्दु भिडाउनुहोस्, प्रभावित जिल्लाबाट क्षतिको पुष्टि लिनुहोस्, र आफ्नो बाइलाइन राख्नुहोस्।',
  }
}

export interface SeismicFetchResult {
  ok: boolean
  briefs: OfficialBrief[]
  error?: string
  endpoint: string
}

/** Fetch the catalogue and build briefs. Network failure is reported, never thrown. */
export async function fetchSeismicBriefs(options?: {
  endpoint?: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
}): Promise<SeismicFetchResult> {
  const endpoint = options?.endpoint?.trim() || USGS_WEEK_FEED
  const doFetch = options?.fetchImpl ?? fetch
  try {
    const response = await doFetch(endpoint, {
      headers: { 'user-agent': 'NagarikWatch/1.0 (+https://nagarikwatch.com)' },
      signal: AbortSignal.timeout(options?.timeoutMs ?? 8000),
    })
    if (!response.ok) {
      return { ok: false, briefs: [], error: `HTTP ${response.status}`, endpoint }
    }
    const json = (await response.json()) as { features?: UsgsFeature[] }
    return { ok: true, briefs: parseUsgsFeed(json).map(buildSeismicBrief), endpoint }
  } catch (error) {
    return {
      ok: false,
      briefs: [],
      error: error instanceof Error ? error.message : 'Seismic feed request failed',
      endpoint,
    }
  }
}
