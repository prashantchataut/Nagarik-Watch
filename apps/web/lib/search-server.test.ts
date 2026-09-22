import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { StoryCardData } from '@nagarikwatch/db'

const getStories = vi.fn()
vi.mock('@/lib/content', () => ({ getStories: (...args: unknown[]) => getStories(...args) }))

const { resetServerSearchIndex, searchStoriesRanked } = await import('./search-server')

function story(slug: string, titleNe: string, publishedAt = '2026-06-01T00:00:00Z'): StoryCardData {
  return {
    id: slug,
    slug,
    category: { id: 'c', slug: 'politics', nameNe: 'राजनीति', nameEn: 'Politics' },
    categoryLabel: 'राजनीति',
    titleNe,
    byline: '',
    authors: [],
    publishedAt,
    hasEnglish: false,
    isBreaking: false,
  }
}

const CORPUS = [
  story('budget-review', 'बजेट कार्यान्वयनको समीक्षा', '2026-05-01T00:00:00Z'),
  story('budget-latest', 'बजेट बहस जारी', '2026-06-10T00:00:00Z'),
  story('sports', 'क्रिकेट टोली घोषणा', '2026-06-11T00:00:00Z'),
]

/** Returns the indexed corpus for an unfiltered list, archive hits for a `q`. */
function sourceWith(archive: StoryCardData[] = []) {
  return vi.fn(async (opts: { q?: string }) => {
    if (opts.q) return { items: archive, total: archive.length }
    return { items: CORPUS, total: CORPUS.length }
  })
}

beforeEach(() => {
  resetServerSearchIndex()
  getStories.mockReset()
})

describe('searchStoriesRanked', () => {
  it('ignores queries shorter than two characters without touching the source', async () => {
    getStories.mockImplementation(sourceWith())
    const result = await searchStoriesRanked('ब', 'ne', 10)
    expect(result.items).toEqual([])
    expect(getStories).not.toHaveBeenCalled()
  })

  it('matches an inflected query against the uninflected headline', async () => {
    // The old SQL `LIKE '%बजेटको%'` path returned nothing for this query.
    getStories.mockImplementation(sourceWith())
    const result = await searchStoriesRanked('बजेटको', 'ne', 10)
    expect(result.ranked).toBe(true)
    expect(result.items.map((item) => item.slug)).toEqual(
      expect.arrayContaining(['budget-review', 'budget-latest']),
    )
    expect(result.items.some((item) => item.slug === 'sports')).toBe(false)
  })

  it('ranks by relevance rather than publish date', async () => {
    getStories.mockImplementation(sourceWith())
    const result = await searchStoriesRanked('बजेट समीक्षा', 'ne', 10)
    // `budget-latest` is newer; `budget-review` carries both query terms.
    expect(result.items[0]?.slug).toBe('budget-review')
  })

  it('caches the index across queries instead of rebuilding per request', async () => {
    const source = sourceWith()
    getStories.mockImplementation(source)
    await searchStoriesRanked('बजेट', 'ne', 10)
    await searchStoriesRanked('क्रिकेट', 'ne', 10)
    const corpusLoads = source.mock.calls.filter((call) => !call[0]?.q)
    expect(corpusLoads).toHaveLength(1)
  })

  it('reaches past the indexed cap when the ranked block is thin', async () => {
    const archived = story('old-budget', 'पुरानो बजेट विवरण', '2020-01-01T00:00:00Z')
    getStories.mockImplementation(sourceWith([archived]))
    const result = await searchStoriesRanked('बजेट', 'ne', 10)
    expect(result.archiveConsulted).toBe(true)
    // Archive hits are appended, never interleaved: their scores come from a
    // different index and are not comparable.
    expect(result.items.at(-1)?.slug).toBe('old-budget')
  })

  it('does not duplicate a story that is already indexed', async () => {
    getStories.mockImplementation(sourceWith([CORPUS[0]]))
    const result = await searchStoriesRanked('बजेट', 'ne', 10)
    const slugs = result.items.map((item) => item.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('still answers from the content source when the index cannot be built', async () => {
    getStories.mockImplementation(async (opts: { q?: string }) => {
      if (!opts.q) throw new Error('content source unreachable')
      return { items: [CORPUS[0]], total: 1 }
    })
    const result = await searchStoriesRanked('बजेट', 'ne', 10)
    expect(result.ranked).toBe(false)
    expect(result.items.map((item) => item.slug)).toEqual(['budget-review'])
  })

  it('keeps the ranked block when the archive expansion fails', async () => {
    getStories.mockImplementation(async (opts: { q?: string }) => {
      if (opts.q) throw new Error('archive query failed')
      return { items: CORPUS, total: CORPUS.length }
    })
    const result = await searchStoriesRanked('बजेट', 'ne', 10)
    expect(result.ranked).toBe(true)
    expect(result.items.length).toBeGreaterThan(0)
  })
})
