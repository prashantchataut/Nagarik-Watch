import { createHmac, timingSafeEqual } from 'node:crypto'
import { after } from 'next/server'
import { NextResponse, type NextRequest } from 'next/server'
import { recordNotificationEvent } from '@/lib/notifications/store'
import { deliverPushEvent } from '@/lib/notifications/subscriptions'
import { revalidatePublishedArticle } from '@/lib/content/revalidate-published'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000

type RevalidateMessage = {
  event?: string
  articleId?: string
  slug?: string
  categorySlug?: string
  previousSlug?: string
  previousCategorySlug?: string
  status?: string
  titleNe?: string
  titleEn?: string
  isBreaking?: boolean
  notificationMode?: 'none' | 'followers' | 'breaking'
  notificationTagSlugs?: string[]
  publishedAt?: string
  authorSlugs?: string[]
  tagSlugs?: string[]
}

function validSignature(body: string, timestamp: string, received: string, secret: string): boolean {
  if (!/^\d{13}$/.test(timestamp) || !/^[a-f0-9]{64}$/i.test(received)) return false
  const sentAt = Number(timestamp)
  if (!Number.isFinite(sentAt) || Math.abs(Date.now() - sentAt) > MAX_CLOCK_SKEW_MS) return false

  const expected = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
  const expectedBuffer = Buffer.from(expected, 'hex')
  const receivedBuffer = Buffer.from(received, 'hex')
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer)
}

function cleanSegment(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9\u0900-\u097f-]/g, '')
    .slice(0, 120)
}

export async function POST(request: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET?.trim()
  if (!secret || secret.length < 32) {
    return NextResponse.json({ error: 'Revalidation is not configured.' }, { status: 503 })
  }

  const timestamp = request.headers.get('x-nw-timestamp') ?? ''
  const signature = request.headers.get('x-nw-signature') ?? ''
  const rawBody = await request.text()

  if (!validSignature(rawBody, timestamp, signature, secret)) {
    return NextResponse.json({ error: 'Invalid or expired signature.' }, { status: 401 })
  }

  let message: RevalidateMessage
  try {
    message = JSON.parse(rawBody) as RevalidateMessage
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  if (message.event !== 'article.changed') {
    return NextResponse.json({ error: 'Unsupported event.' }, { status: 400 })
  }

  const category = cleanSegment(message.categorySlug)
  const slug = cleanSegment(message.slug)
  const previousCategory = cleanSegment(message.previousCategorySlug)
  const previousSlug = cleanSegment(message.previousSlug)
  const authorSlugs = Array.isArray(message.authorSlugs)
    ? message.authorSlugs.map(cleanSegment).filter(Boolean)
    : []
  const tagSlugs = Array.isArray(message.tagSlugs)
    ? message.tagSlugs.map(cleanSegment).filter(Boolean)
    : []

  const paths = revalidatePublishedArticle({
    categorySlug: category,
    slug,
    authorSlugs,
    tagSlugs,
  })

  if (
    previousSlug &&
    previousCategory &&
    (previousSlug !== slug || previousCategory !== category)
  ) {
    for (const path of revalidatePublishedArticle({
      categorySlug: previousCategory,
      slug: previousSlug,
    })) {
      if (!paths.includes(path)) paths.push(path)
    }
  }

  const notificationEligible = message.status === 'published' || message.status === 'updated'
  if (notificationEligible && slug && category && message.titleNe && message.articleId) {
    const event = await recordNotificationEvent({
      articleId: cleanSegment(message.articleId),
      articleSlug: slug,
      categorySlug: category,
      titleNe: String(message.titleNe).trim().slice(0, 240),
      titleEn: message.titleEn ? String(message.titleEn).trim().slice(0, 240) : undefined,
      authorSlugs,
      tagSlugs,
      isBreaking: Boolean(message.isBreaking),
      notificationMode:
        message.notificationMode === 'breaking' || message.notificationMode === 'followers'
          ? message.notificationMode
          : 'none',
      notificationTagSlugs: Array.isArray(message.notificationTagSlugs)
        ? message.notificationTagSlugs.map(cleanSegment).filter(Boolean)
        : [],
      publishedAt: Number.isFinite(Date.parse(String(message.publishedAt ?? '')))
        ? new Date(String(message.publishedAt)).toISOString()
        : new Date().toISOString(),
    })
    after(async () => {
      await deliverPushEvent(event).catch(() => undefined)
    })
  }

  return NextResponse.json({
    ok: true,
    articleId: cleanSegment(message.articleId),
    revalidated: paths,
  })
}
