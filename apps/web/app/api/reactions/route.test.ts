import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockReactionCounts,
  mockToggleReaction,
  mockGetPublicArticleIdentity,
  mockEnforceRateLimit,
  mockIsTrustedWriteRequest,
} = vi.hoisted(() => ({
  mockReactionCounts: vi.fn(),
  mockToggleReaction: vi.fn(),
  mockGetPublicArticleIdentity: vi.fn(),
  mockEnforceRateLimit: vi.fn(),
  mockIsTrustedWriteRequest: vi.fn(),
}))

vi.mock('@/lib/engagement/reactions', () => ({
  isReactionEmoji: (value: string) => value === '👍',
  reactionCounts: mockReactionCounts,
  toggleReaction: mockToggleReaction,
}))

vi.mock('@/lib/content/public-article-identity', () => ({
  getPublicArticleIdentity: mockGetPublicArticleIdentity,
}))

vi.mock('@/lib/rate-limit', () => ({ enforceRateLimit: mockEnforceRateLimit }))
vi.mock('@/lib/security/origin', () => ({ isTrustedWriteRequest: mockIsTrustedWriteRequest }))

import { GET, POST } from './route'

afterEach(() => {
  vi.clearAllMocks()
  mockEnforceRateLimit.mockResolvedValue(null)
  mockIsTrustedWriteRequest.mockReturnValue(true)
})

describe('reaction route', () => {
  it('returns a controlled 503 when reaction storage is unavailable', async () => {
    mockGetPublicArticleIdentity.mockResolvedValue({
      slug: 'budget-brief',
      category: 'economy',
      commentsEnabled: false,
    })
    mockReactionCounts.mockRejectedValue(new Error('database unavailable'))
    const response = await GET(
      new NextRequest(
        'http://localhost/api/reactions?articleSlug=budget-brief&articleCategory=economy',
      ),
    )
    expect(response.status).toBe(503)
  })

  it('only exposes reaction counts for a currently public canonical article', async () => {
    mockGetPublicArticleIdentity.mockResolvedValue({
      slug: 'canonical-slug',
      category: 'economy',
      commentsEnabled: false,
    })
    mockReactionCounts.mockResolvedValue({ '👍': 3 })

    const response = await GET(
      new NextRequest(
        'http://localhost/api/reactions?articleSlug=client-slug&articleCategory=economy',
      ),
    )

    expect(response.status).toBe(200)
    expect(mockReactionCounts).toHaveBeenCalledWith('canonical-slug')
  })

  it('does not expose reaction counts for an unpublished or unknown article', async () => {
    mockGetPublicArticleIdentity.mockResolvedValue(null)
    const response = await GET(
      new NextRequest('http://localhost/api/reactions?articleSlug=missing&articleCategory=economy'),
    )
    expect(response.status).toBe(404)
    expect(mockReactionCounts).not.toHaveBeenCalled()
  })

  it('canonicalizes reaction writes against a currently public article', async () => {
    mockGetPublicArticleIdentity.mockResolvedValue({
      slug: 'canonical-slug',
      category: 'politics',
      commentsEnabled: false,
    })
    mockToggleReaction.mockResolvedValue({ active: true, counts: { '👍': 1 } })

    const response = await POST(
      new NextRequest('http://localhost/api/reactions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
        body: JSON.stringify({
          articleSlug: 'client-slug',
          articleCategory: 'politics',
          emoji: '👍',
          visitorKey: 'visitor-1234567890',
        }),
      }),
    )

    expect(response.status).toBe(200)
    expect(mockToggleReaction).toHaveBeenCalledWith(
      expect.objectContaining({ articleSlug: 'canonical-slug', articleCategory: 'politics' }),
    )
  })

  it('does not write a reaction for an unpublished or unknown article', async () => {
    mockGetPublicArticleIdentity.mockResolvedValue(null)
    const response = await POST(
      new NextRequest('http://localhost/api/reactions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
        body: JSON.stringify({
          articleSlug: 'missing',
          articleCategory: 'politics',
          emoji: '👍',
          visitorKey: 'visitor-1234567890',
        }),
      }),
    )
    expect(response.status).toBe(404)
    expect(mockToggleReaction).not.toHaveBeenCalled()
  })
})
