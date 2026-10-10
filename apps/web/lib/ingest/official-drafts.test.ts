import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The store is mocked: these tests are about the ingestion contract — drafts
 * only, idempotent across runs, one bad brief never aborts the batch — not
 * about Postgres or the JSON file underneath it.
 */
const createArticle = vi.fn()
const articleSlugExists = vi.fn()

vi.mock('@/lib/content/store/json-store', () => ({
  createArticle: (...args: unknown[]) => createArticle(...args),
  articleSlugExists: (...args: unknown[]) => articleSlugExists(...args),
}))

const { ingestSeismicDrafts } = await import('./official-drafts')

function usgsResponse(features: unknown[]) {
  return async () =>
    new Response(JSON.stringify({ features }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
}

function quake(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    geometry: { coordinates: [85.3, 27.7, 12] },
    properties: {
      mag: 4.9,
      place: '31 km NE of Kathmandu, Nepal',
      time: Date.UTC(2026, 9, 10, 3, 15),
      url: `https://earthquake.usgs.gov/earthquakes/eventpage/${id}`,
      ...overrides,
    },
  }
}

beforeEach(() => {
  createArticle.mockReset().mockResolvedValue({})
  articleSlugExists.mockReset().mockResolvedValue(false)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ingestSeismicDrafts', () => {
  it('writes a felt Nepal event as a draft, never as published', async () => {
    const result = await ingestSeismicDrafts({ fetchImpl: usgsResponse([quake('us-a')]) })

    expect(result.ok).toBe(true)
    expect(result.created).toBe(1)
    expect(createArticle).toHaveBeenCalledTimes(1)

    const written = createArticle.mock.calls[0]![0] as Record<string, unknown>
    expect(written.workflowStage).toBe('draft')
    expect(written.slug).toBe('bhukampa-us-a')
    expect(written.sourceName).toBe('USGS Earthquake Hazards Program')
    expect(String(written.sourceUrl)).toContain('earthquake.usgs.gov')
  })

  it('carries a desk note saying what must happen before publication', async () => {
    await ingestSeismicDrafts({ fetchImpl: usgsResponse([quake('us-b')]) })
    const written = createArticle.mock.calls[0]![0] as Record<string, string>
    expect(written.sourceNote).toContain('राष्ट्रिय भूकम्प मापन केन्द्र')
    expect(written.editorPitch).toContain('बाइलाइन')
  })

  it('is idempotent: an already-ingested event is skipped, not rewritten', async () => {
    articleSlugExists.mockResolvedValue(true)
    const result = await ingestSeismicDrafts({ fetchImpl: usgsResponse([quake('us-c')]) })

    expect(result.created).toBe(0)
    expect(result.skippedExisting).toBe(1)
    expect(createArticle).not.toHaveBeenCalled()
  })

  it('deduplicates a catalogue that lists the same event twice in one run', async () => {
    const result = await ingestSeismicDrafts({
      fetchImpl: usgsResponse([quake('us-d'), quake('us-d')]),
    })
    expect(result.created).toBe(1)
    expect(createArticle).toHaveBeenCalledTimes(1)
  })

  it('keeps going when one brief is refused by the store', async () => {
    createArticle.mockRejectedValueOnce(new Error('slug already exists')).mockResolvedValueOnce({})
    const result = await ingestSeismicDrafts({
      fetchImpl: usgsResponse([
        quake('us-e', { time: Date.UTC(2026, 9, 10, 5) }),
        quake('us-f', { time: Date.UTC(2026, 9, 10, 4) }),
      ]),
    })

    expect(result.failed).toBe(1)
    expect(result.created).toBe(1)
  })

  it('ignores events below the felt floor and outside Nepal', async () => {
    const result = await ingestSeismicDrafts({
      fetchImpl: usgsResponse([
        quake('weak', { mag: 2.1 }),
        { ...quake('tokyo'), geometry: { coordinates: [139.7, 35.7, 30] } },
      ]),
    })

    expect(result.offered).toBe(0)
    expect(result.created).toBe(0)
    expect(createArticle).not.toHaveBeenCalled()
  })

  it('reports an upstream failure without writing anything', async () => {
    const result = await ingestSeismicDrafts({
      fetchImpl: async () => new Response('', { status: 500 }),
    })

    expect(result.ok).toBe(false)
    expect(result.error).toBe('HTTP 500')
    expect(createArticle).not.toHaveBeenCalled()
  })
})
