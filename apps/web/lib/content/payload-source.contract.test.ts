import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const SAMPLE_ARTICLE = {
  id: 42,
  slug: 'budget-brief',
  titleNe: 'बजेट संक्षिप्त',
  titleEn: 'Budget brief',
  deckNe: 'संसदमा प्रस्तुत',
  bodyNe: [{ type: 'paragraph', text: 'पहिलो अनुच्छेद।' }],
  workflowStage: 'published',
  _status: 'published',
  publishAt: '2026-07-01T10:00:00.000Z',
  createdAt: '2026-07-01T09:00:00.000Z',
  englishStatus: 'none',
  category: {
    id: 1,
    slug: 'politics',
    nameNe: 'राजनीति',
    nameEn: 'Politics',
  },
  authors: [{ author: { id: 9, slug: 'reporter', name: 'Reporter' } }],
  tags: [{ tag: { id: 3, slug: 'budget', nameNe: 'बजेट' } }],
  heroImage: {
    url: '/media/budget.jpg',
    alt: 'संसद भवन',
    width: 1200,
    height: 800,
  },
  byline: 'Reporter',
  commentsEnabled: true,
  premium: false,
  noIndex: false,
}

describe('Payload content source contract', () => {
  vi.setConfig({ testTimeout: 20_000 })
  const env = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = {
      ...env,
      CONTENT_SOURCE: 'payload',
      PAYLOAD_PUBLIC_SERVER_URL: 'https://cms.test',
      NEXT_PHASE: 'phase-production-build',
    }
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/api/articles?') && url.includes('slug')) {
          return new Response(JSON.stringify({ docs: [SAMPLE_ARTICLE] }), { status: 200 })
        }
        if (url.includes('/api/articles?')) {
          return new Response(
            JSON.stringify({
              docs: [SAMPLE_ARTICLE],
              totalDocs: 1,
              totalPages: 1,
              page: 1,
            }),
            { status: 200 },
          )
        }
        if (url.includes('/api/categories')) {
          return new Response(
            JSON.stringify({
              docs: [
                {
                  id: 1,
                  slug: 'politics',
                  nameNe: 'राजनीति',
                  nameEn: 'Politics',
                  navOrder: 1,
                  showInNav: true,
                },
              ],
            }),
            { status: 200 },
          )
        }
        if (url.includes('/api/authors')) {
          return new Response(JSON.stringify({ docs: [] }), { status: 200 })
        }
        if (url.includes('/api/tags')) {
          return new Response(JSON.stringify({ docs: [] }), { status: 200 })
        }
        return new Response(JSON.stringify({ docs: [] }), { status: 404 })
      }),
    )
  })

  afterEach(() => {
    process.env = env
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('maps a published Payload article into the shared Article contract', async () => {
    const { createPayloadContentSource } = await import('./payload-source')
    const source = await createPayloadContentSource()
    const article = await source.getArticleBySlug('politics', 'budget-brief', 'ne')

    expect(article).not.toBeNull()
    expect(article?.slug).toBe('budget-brief')
    expect(article?.titleNe).toBe('बजेट संक्षिप्त')
    expect(article?.category.slug).toBe('politics')
    expect(article?.authors[0]?.name).toBe('Reporter')
    expect(article?.tags?.map((tag) => tag.slug)).toEqual(['budget'])
    expect(article?.heroImage?.url).toBe('https://cms.test/media/budget.jpg')
  })

  it('builds homepage cards from Payload list responses', async () => {
    const { createPayloadContentSource } = await import('./payload-source')
    const source = await createPayloadContentSource()
    const homepage = await source.getHomepage()

    expect(homepage).not.toBeNull()
    expect(homepage?.lead.slug).toBe('budget-brief')
    expect(homepage?.lead.category.slug).toBe('politics')
    expect(homepage?.lead.tags?.map((tag) => tag.slug)).toEqual(['budget'])
    expect(homepage?.featured.length).toBeGreaterThan(0)
  })

  it('requires publishAt to have reached the reader cutoff', async () => {
    const { createPayloadContentSource } = await import('./payload-source')
    const source = await createPayloadContentSource()
    await source.getHomepage()
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    const articleUrl = fetchMock.mock.calls
      .map((call) => decodeURIComponent(String(call[0])))
      .find((url) => url.includes('/api/articles?'))
    expect(articleUrl).toContain('where[and][2][publishAt][less_than_equal]=')
    expect(articleUrl).not.toContain('[publishAt][exists]=false')
    expect(articleUrl).not.toContain('[publishAt][equals]=null')
  })

  it('uses the exact reader publication cutoff so the first post-publish render is eligible', async () => {
    const now = Date.parse('2026-08-21T10:00:14.900Z')
    vi.spyOn(Date, 'now').mockReturnValue(now)

    const { createPayloadContentSource } = await import('./payload-source')
    const source = await createPayloadContentSource()
    await source.getHomepage()
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    const articleUrl = fetchMock.mock.calls
      .map((call) => String(call[0]))
      .find((url) => url.includes('/api/articles?'))
    expect(articleUrl).toBeTruthy()
    const cutoff = new URL(articleUrl!).searchParams.get(
      'where[and][2][publishAt][less_than_equal]',
    )
    expect(cutoff).toBeTruthy()
    expect(Date.parse(String(cutoff))).toBe(now)
  })

  it('keeps the publication gate when a search adds its own OR clauses', async () => {
    const { createPayloadContentSource } = await import('./payload-source')
    const source = await createPayloadContentSource()
    await source.getStories({ q: 'budget', locale: 'ne', page: 1 })
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    const searchUrl = fetchMock.mock.calls
      .map((call) => decodeURIComponent(String(call[0])))
      .find((url) => url.includes('/api/articles?') && url.includes('budget'))

    expect(searchUrl).toContain('where[and][0][_status][equals]=published')
    expect(searchUrl).toContain('where[and][2][publishAt][less_than_equal]=')
    expect(searchUrl).toContain('where[or][0][titleNe][contains]=budget')
  })

  it('includes scheduled in the reader stage gate so due stories do not depend on cron promotion', async () => {
    const { createPayloadContentSource } = await import('./payload-source')
    const source = await createPayloadContentSource()
    await source.getHomepage()
    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>
    const articleCalls = fetchMock.mock.calls
      .map((call) => String(call[0]))
      .filter((url) => url.includes('/api/articles'))
    const decoded = articleCalls.map((url) => decodeURIComponent(url)).join('\n')
    expect(decoded).toContain('where[and][1][workflowStage][in]=scheduled,published,updated')
  })

  it('builds homepage sections from expanded article categories when the category endpoint is down', async () => {
    const workingFetch = globalThis.fetch as ReturnType<typeof vi.fn>
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/api/categories')) {
          return new Response(JSON.stringify({ message: 'category service unavailable' }), {
            status: 503,
          })
        }
        return workingFetch(input)
      }),
    )

    const { createPayloadContentSource } = await import('./payload-source')
    const source = await createPayloadContentSource()
    const homepage = await source.getHomepage()

    expect(homepage?.lead.slug).toBe('budget-brief')
    expect(homepage?.sections[0]?.category.slug).toBe('politics')
    expect(homepage?.sections[0]?.lead?.slug).toBe('budget-brief')
  })

  it('reuses a warm article response across publication cutoff timestamps during a CMS outage', async () => {
    const firstMinute = Date.parse('2026-07-01T10:00:30.000Z')
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(firstMinute)

    const { createPayloadContentSource } = await import('./payload-source')
    const source = await createPayloadContentSource()
    const first = await source.getHomepage()
    expect(first?.lead.slug).toBe('budget-brief')

    nowSpy.mockReturnValue(firstMinute + 90_000)
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () => new Response(JSON.stringify({ message: 'cms unavailable' }), { status: 503 }),
      ),
    )

    const duringOutage = await source.getHomepage()
    expect(duringOutage?.lead.slug).toBe('budget-brief')
  })
})
