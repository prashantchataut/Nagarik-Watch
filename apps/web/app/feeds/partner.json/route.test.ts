import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockGetDistributionStories, mockAuthorize, mockConfiguredTokens } = vi.hoisted(() => ({
  mockGetDistributionStories: vi.fn(),
  mockAuthorize: vi.fn(),
  mockConfiguredTokens: vi.fn(),
}))

vi.mock('@/lib/feeds/stories', () => ({
  getDistributionStories: mockGetDistributionStories,
  distributionStory: () => ({
    title: 'Headline',
    summary: 'Deck',
    canonicalUrl: 'https://www.nagarikwatch.com/national/floods',
    publishedAt: '2020-01-01T00:00:00.000Z',
    imageUrl: null,
  }),
}))

vi.mock('@/lib/syndication/partner-auth', () => ({
  configuredPartnerFeedTokens: mockConfiguredTokens,
  authorizePartnerFeedToken: mockAuthorize,
}))

vi.mock('@/lib/site', () => ({
  SITE_URL: 'https://www.nagarikwatch.com',
}))

import { GET } from './route'

afterEach(() => {
  vi.clearAllMocks()
})

describe('partner.json feed', () => {
  it('fails closed when no partner tokens are configured', async () => {
    mockConfiguredTokens.mockReturnValue([])
    const response = await GET(new NextRequest('http://localhost/feeds/partner.json'))
    expect(response.status).toBe(503)
    expect(response.headers.get('cache-control')).toContain('no-store')
  })

  it('rejects unauthorized requests', async () => {
    mockConfiguredTokens.mockReturnValue(['nw_partner_aaaaaaaaaaaaaaaa'])
    mockAuthorize.mockReturnValue(false)
    const response = await GET(new NextRequest('http://localhost/feeds/partner.json'))
    expect(response.status).toBe(401)
  })

  it('returns items only after authorization', async () => {
    mockConfiguredTokens.mockReturnValue(['nw_partner_aaaaaaaaaaaaaaaa'])
    mockAuthorize.mockReturnValue(true)
    mockGetDistributionStories.mockResolvedValue([
      {
        id: 'a1',
        publishedAt: '2020-01-01T00:00:00.000Z',
        premium: false,
        title: 'Headline',
        summary: 'Deck',
      },
    ])
    const response = await GET(
      new NextRequest('http://localhost/feeds/partner.json', {
        headers: { authorization: 'Bearer nw_partner_aaaaaaaaaaaaaaaa' },
      }),
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as { items: unknown[] }
    expect(body.items).toHaveLength(1)
  })
})
