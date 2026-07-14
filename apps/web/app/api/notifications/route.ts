import { NextResponse, type NextRequest } from 'next/server'
import type { NotificationPreference } from '@nagarikwatch/db'
import { scoreNotification, type NotificationKind } from '@nagarikwatch/db'
import { getSession } from '@/lib/auth/session'
import { getStories } from '@/lib/content'
import { asLocale, localePrefix } from '@/lib/i18n/locales'
import { enforceRateLimit } from '@/lib/rate-limit'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { getReaderPreferences, mergeAnonymousPreferences } from '@/lib/reader/preferences-store'
import {
  getNotificationReceipts,
  listNotificationEvents,
  recordNotificationEvent,
  updateNotificationReceipts,
  type NotificationEvent,
} from '@/lib/notifications/store'

export const dynamic = 'force-dynamic'

type PublicAlert = {
  id: string
  title: string
  url: string
  publishedAt: string
  kind: NotificationKind
  reason: 'breaking' | 'follow' | 'digest'
  score: number
  seen: boolean
  read: boolean
}

function fp(request: NextRequest) {
  return request.nextUrl.searchParams.get('fingerprint')?.trim() ?? ''
}

function candidateKind(event: NotificationEvent, preferences: Awaited<ReturnType<typeof getReaderPreferences>>): NotificationKind | null {
  if (event.notificationMode === 'breaking' && event.isBreaking && preferences.breaking) return 'breaking'
  if (event.notificationMode === 'followers' || event.notificationMode === 'breaking') {
    if (preferences.followedAuthors && event.authorSlugs.some((slug) => preferences.authors.includes(slug))) return 'followed_author'
    const audienceTags = event.notificationTagSlugs.length ? event.notificationTagSlugs : event.tagSlugs
    if (preferences.followedTopics && (
      preferences.categories.includes(event.categorySlug) ||
      audienceTags.some((slug) => preferences.tags.includes(slug))
    )) return 'followed_topic'
  }
  if (preferences.dailyDigest) return 'daily_digest'
  return null
}

async function fallbackEvents(locale: 'ne' | 'en'): Promise<NotificationEvent[]> {
  const { items } = await getStories({ locale, perPage: 30 })
  return Promise.all(items.map((story) => recordNotificationEvent({
    articleId: story.id,
    articleSlug: story.slug,
    categorySlug: story.category.slug,
    titleNe: story.titleNe,
    titleEn: story.titleEn,
    authorSlugs: story.authors.map((author) => author.slug),
    tagSlugs: [],
    isBreaking: story.isBreaking,
    notificationMode: story.isBreaking ? 'breaking' : 'none',
    notificationTagSlugs: [],
    publishedAt: story.publishedAt,
  })))
}

export async function GET(request: NextRequest) {
  const fingerprint = fp(request)
  const session = await getSession().catch(() => null)
  if (!session && !fingerprint) return NextResponse.json({ alerts: [], unread: 0 })
  if (fingerprint.length > 160) return NextResponse.json({ error: 'Invalid reader identifier.' }, { status: 400 })
  if (session && fingerprint) await mergeAnonymousPreferences(fingerprint, session.userId)

  const locale = asLocale(request.nextUrl.searchParams.get('locale') ?? 'ne')
  const preferences = await getReaderPreferences(fingerprint, session?.userId)
  let events = await listNotificationEvents(80, 7)
  if (!events.length) events = await fallbackEvents(locale)
  const receipts = await getNotificationReceipts(fingerprint, session?.userId)
  const notificationPreference: NotificationPreference = {
    userId: session?.userId ?? fingerprint,
    breaking: preferences.breaking,
    followedTopics: preferences.followedTopics,
    followedAuthors: preferences.followedAuthors,
    dailyDigest: preferences.dailyDigest,
    marketing: false,
    channels: { push: preferences.browserAlerts, email: false, sms: false },
  }
  const prefix = localePrefix(locale)
  // Quiet hours govern interruptive delivery, not the reader's in-app inbox.
  // The push dispatcher applies them in the reader's persisted IANA timezone.
  const inboxPolicy = {
    // The in-app inbox is not an interruptive channel. Opening it must not
    // consume the push-delivery quota or activate push cooldowns.
    maxPerDay: 1_000,
    breakingCooldownMinutes: 0,
    topicCooldownMinutes: 0,
  }

  const alerts: PublicAlert[] = events.flatMap((event) => {
    const receipt = receipts.get(event.id)
    if (receipt?.dismissedAt) return []
    const kind = candidateKind(event, preferences)
    if (!kind) return []
    const scored = scoreNotification({
      userId: notificationPreference.userId,
      kind,
      articleId: event.articleId,
      topicSlug: kind === 'followed_topic' ? event.categorySlug : undefined,
      authorSlug: kind === 'followed_author' ? event.authorSlugs.find((slug) => preferences.authors.includes(slug)) : undefined,
      at: event.publishedAt,
    }, notificationPreference, {
      userId: notificationPreference.userId,
      sent24h: 0,
    }, inboxPolicy)
    if (!scored.willSend) return []
    const reason: PublicAlert['reason'] =
      kind === 'breaking' ? 'breaking' : kind === 'daily_digest' ? 'digest' : 'follow'
    return [{
      id: event.id,
      title: locale === 'en' && event.titleEn ? event.titleEn : event.titleNe,
      url: `${prefix}/${event.categorySlug}/${event.articleSlug}`,
      publishedAt: event.publishedAt,
      kind,
      reason,
      score: Math.round(scored.score * 10) / 10,
      seen: Boolean(receipt?.seenAt),
      read: Boolean(receipt?.readAt),
    }]
  }).sort((a, b) => Number(a.read) - Number(b.read) || b.score - a.score || b.publishedAt.localeCompare(a.publishedAt)).slice(0, 20)

  return NextResponse.json({ alerts, unread: alerts.filter((item) => !item.read).length, preferences })
}

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  const limited = await enforceRateLimit(request, 'notification-receipts', 30, 60_000)
  if (limited) return limited
  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const fingerprint = String(body.fingerprint ?? '').trim()
  const session = await getSession().catch(() => null)
  if ((!session && !fingerprint) || fingerprint.length > 160) return NextResponse.json({ error: 'Reader identity required.' }, { status: 400 })
  const action = body.action === 'read' || body.action === 'dismiss' ? body.action : 'seen'
  const eventIds = Array.isArray(body.eventIds) ? body.eventIds.map(String) : []
  await updateNotificationReceipts(fingerprint, session?.userId, eventIds, action)
  return NextResponse.json({ ok: true })
}
