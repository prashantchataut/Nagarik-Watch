import { describe, expect, it } from 'vitest'
import {
  FELT_MAGNITUDE_FLOOR,
  buildSeismicBrief,
  fetchSeismicBriefs,
  parseUsgsFeed,
  toDevanagariNumber,
  type UsgsFeature,
} from './official'

function feature(
  overrides: Partial<UsgsFeature['properties']> & {
    id?: string
    coordinates?: number[]
  },
): UsgsFeature {
  const { id = 'us1000abcd', coordinates = [85.3, 27.7, 12], ...properties } = overrides
  return {
    id,
    geometry: { coordinates },
    properties: {
      mag: 4.8,
      place: '31 km NE of Kathmandu, Nepal',
      time: Date.UTC(2026, 9, 10, 3, 15),
      url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us1000abcd',
      ...properties,
    },
  }
}

describe('parseUsgsFeed', () => {
  it('keeps a felt event inside the Nepal window', () => {
    const events = parseUsgsFeed({ features: [feature({})] })
    expect(events).toHaveLength(1)
    expect(events[0]!.magnitude).toBe(4.8)
    expect(events[0]!.depthKm).toBe(12)
    expect(events[0]!.place).toBe('31 km NE of Kathmandu, Nepal')
  })

  it('drops events below the felt floor', () => {
    const events = parseUsgsFeed({
      features: [feature({ mag: FELT_MAGNITUDE_FLOOR - 0.1 })],
    })
    expect(events).toEqual([])
  })

  it('drops events outside Nepal even when strongly felt elsewhere', () => {
    // Tokyo: large magnitude, nowhere near the Nepal window.
    const events = parseUsgsFeed({
      features: [feature({ mag: 6.5, coordinates: [139.7, 35.7, 30] })],
    })
    expect(events).toEqual([])
  })

  it('skips malformed features rather than throwing', () => {
    const events = parseUsgsFeed({
      features: [
        { id: undefined, geometry: { coordinates: [85, 27] }, properties: { mag: 5 } },
        { id: 'no-geometry', properties: { mag: 5, time: 1 } },
        feature({ mag: null }),
        feature({ time: null }),
        feature({ id: 'good' }),
      ],
    })
    expect(events.map((event) => event.id)).toEqual(['good'])
  })

  it('returns newest first', () => {
    const events = parseUsgsFeed({
      features: [
        feature({ id: 'older', time: Date.UTC(2026, 9, 1) }),
        feature({ id: 'newer', time: Date.UTC(2026, 9, 9) }),
      ],
    })
    expect(events.map((event) => event.id)).toEqual(['newer', 'older'])
  })
})

describe('buildSeismicBrief', () => {
  const brief = buildSeismicBrief(parseUsgsFeed({ features: [feature({})] })[0]!)

  it('uses the upstream id so a re-run is idempotent', () => {
    expect(brief.externalId).toBe('us1000abcd')
    expect(brief.slug).toBe('bhukampa-us1000abcd')
  })

  it('writes magnitude and depth in Devanagari numerals', () => {
    expect(brief.titleNe).toContain('४.८')
    expect(brief.bodyNe[0]).toMatchObject({ type: 'paragraph' })
    expect((brief.bodyNe[0] as { text: string }).text).toContain('१२ किलोमिटर')
  })

  it('states only what the instrument recorded', () => {
    const prose = [
      brief.titleNe,
      brief.deckNe,
      ...brief.bodyNe.map((b) => (b as { text?: string }).text ?? ''),
    ].join(' ')
    // No casualty, damage, cause or attribution language may appear: those are
    // reporting, and this module has no reporter.
    for (const forbidden of ['मृत्यु', 'घाइते', 'क्षति भएको', 'भनेका छन्', 'अनुसार', 'आशंका']) {
      expect(prose).not.toContain(forbidden)
    }
  })

  it('credits the measuring institution and keeps the verification link', () => {
    expect(brief.sourceName).toBe('USGS Earthquake Hazards Program')
    expect(brief.sourceUrl).toContain('earthquake.usgs.gov')
  })

  it('tells the desk what still has to be done before publishing', () => {
    expect(brief.deskNote).toContain('राष्ट्रिय भूकम्प मापन केन्द्र')
    expect(brief.deskNote).toContain('बाइलाइन')
  })
})

describe('toDevanagariNumber', () => {
  it('converts digits and leaves separators alone', () => {
    expect(toDevanagariNumber('4.8')).toBe('४.८')
    expect(toDevanagariNumber(2083)).toBe('२०८३')
  })
})

describe('fetchSeismicBriefs', () => {
  it('reports an HTTP failure instead of throwing', async () => {
    const result = await fetchSeismicBriefs({
      fetchImpl: async () => new Response('', { status: 503 }),
    })
    expect(result.ok).toBe(false)
    expect(result.error).toBe('HTTP 503')
    expect(result.briefs).toEqual([])
  })

  it('reports a network failure instead of throwing', async () => {
    const result = await fetchSeismicBriefs({
      fetchImpl: async () => {
        throw new Error('getaddrinfo ENOTFOUND')
      },
    })
    expect(result.ok).toBe(false)
    expect(result.error).toContain('ENOTFOUND')
  })

  it('builds briefs from a successful response', async () => {
    const result = await fetchSeismicBriefs({
      fetchImpl: async () =>
        new Response(JSON.stringify({ features: [feature({})] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    })
    expect(result.ok).toBe(true)
    expect(result.briefs).toHaveLength(1)
    expect(result.briefs[0]!.externalId).toBe('us1000abcd')
  })
})
