import { createHmac, timingSafeEqual } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000

type RevalidateMessage = {
  event?: string
  articleId?: string
  slug?: string
  categorySlug?: string
  status?: string
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
  const paths = new Set(['/', '/latest', '/rss.xml', '/news-sitemap.xml', '/sitemap.xml'])

  if (category) {
    paths.add(`/${category}`)
    paths.add(`/en/${category}`)
  }
  if (category && slug) {
    paths.add(`/${category}/${slug}`)
    paths.add(`/en/${category}/${slug}`)
  }

  for (const path of paths) revalidatePath(path)

  return NextResponse.json({
    ok: true,
    articleId: cleanSegment(message.articleId),
    revalidated: Array.from(paths),
  })
}
