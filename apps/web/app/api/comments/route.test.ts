import { afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockGetCommentsForArticle,
  mockGetSession,
  mockGetPublicArticleIdentity,
  mockCreateComment,
  mockDeleteOwnComment,
  mockEnforceRateLimit,
  mockIsTrustedWriteRequest,
  mockGetCaptchaState,
} = vi.hoisted(() => ({
  mockGetCommentsForArticle: vi.fn(),
  mockGetSession: vi.fn(),
  mockGetPublicArticleIdentity: vi.fn(),
  mockCreateComment: vi.fn(),
  mockDeleteOwnComment: vi.fn(),
  mockEnforceRateLimit: vi.fn(),
  mockIsTrustedWriteRequest: vi.fn(),
  mockGetCaptchaState: vi.fn(),
}))

vi.mock('@/lib/engagement/store', () => ({
  getCommentsForArticle: mockGetCommentsForArticle,
  createComment: mockCreateComment,
  deleteOwnComment: mockDeleteOwnComment,
  isValidCommentParent: vi.fn(async () => true),
}))

vi.mock('@/lib/auth/session', () => ({
  getSession: mockGetSession,
}))

vi.mock('@/lib/content/public-article-identity', () => ({
  getPublicArticleIdentity: mockGetPublicArticleIdentity,
}))

vi.mock('@/lib/rate-limit', () => ({
  clientIp: () => '127.0.0.1',
  enforceRateLimit: mockEnforceRateLimit,
}))

vi.mock('@/lib/security/origin', () => ({
  isTrustedWriteRequest: mockIsTrustedWriteRequest,
}))

vi.mock('@/lib/security/turnstile', () => ({
  getCaptchaState: mockGetCaptchaState,
  verifyTurnstileToken: vi.fn(async () => ({ success: true, skipped: false, errorCodes: [] })),
}))

import { DELETE, GET, POST } from './route'

afterEach(() => {
  vi.clearAllMocks()
  mockEnforceRateLimit.mockResolvedValue(null)
  mockIsTrustedWriteRequest.mockReturnValue(true)
  mockGetCaptchaState.mockReturnValue({ provider: 'turnstile', enabled: false })
})

describe('comments collection route', () => {
  it('lists comments for a public article', async () => {
    mockGetPublicArticleIdentity.mockResolvedValue({ slug: 'floods', category: 'national' })
    mockGetCommentsForArticle.mockResolvedValue([
      {
        id: 'c1',
        authorName: 'Reader',
        bodyNe: 'ठीक छ',
        parentId: undefined,
        locale: 'ne',
        status: 'approved',
        createdAt: '2026-08-01T00:00:00.000Z',
        authorUserId: 'user-1',
      },
    ])
    mockGetSession.mockResolvedValue({ userId: 'user-1', displayName: 'Reader' })

    const response = await GET(
      new NextRequest(
        'http://localhost/api/comments?articleSlug=floods&articleCategory=national',
      ),
    )
    expect(response.status).toBe(200)
    const body = (await response.json()) as { comments: Array<{ id: string; canDelete: boolean }> }
    expect(body.comments).toHaveLength(1)
    expect(body.comments[0]?.canDelete).toBe(true)
  })

  it('requires sign-in to create a comment', async () => {
    mockGetSession.mockResolvedValue(null)
    const response = await POST(
      new NextRequest('http://localhost/api/comments', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://localhost:3000' },
        body: JSON.stringify({
          articleSlug: 'floods',
          articleCategory: 'national',
          bodyNe: 'एक टिप्पणी',
        }),
      }),
    )
    expect(response.status).toBe(401)
  })

  it('deletes only the signed-in owner comment', async () => {
    mockGetSession.mockResolvedValue({ userId: 'user-1' })
    mockDeleteOwnComment.mockResolvedValue('deleted')
    const response = await DELETE(
      new NextRequest('http://localhost/api/comments', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: 'c1' }),
      }),
    )
    expect(response.status).toBe(200)
    expect(mockDeleteOwnComment).toHaveBeenCalledWith('c1', 'user-1')
  })
})
