/**
 * Notification scoring and fatigue prevention. Pure functions that an
 * ingestion worker calls when deciding whether a push/email should fire and
 * at what priority. The decisions are intentionally explicit and testable:
 * no hidden state, no clock side effects (callers pass `now`).
 *
 * Policies:
 *   - Breaking news always qualifies, but a reader's "breaking" preference
 *     and a per-reader cooldown gate the send.
 *   - Followed-topic/author notifications rank below breaking.
 *   - Daily-digest roll-up only fires once per reader per day.
 *   - Fatigue: total sends per reader per 24h are capped; recent sends push
 *     the score down so a reader who just got 3 alerts is deprioritized.
 */
import type { AnalyticsEvent, NotificationPreference } from './types'

export type NotificationKind =
  | 'breaking'
  | 'followed_topic'
  | 'followed_author'
  | 'daily_digest'
  | 'marketing'

export type NotificationCandidate = {
  userId: string
  kind: NotificationKind
  articleId?: string
  topicSlug?: string
  authorSlug?: string
  /** ISO timestamp the underlying event happened. */
  at: string
}

export type SendWindow = {
  userId: string
  sent24h: number
  lastSentAt?: string
}

export type NotificationPolicy = {
  maxPerDay: number
  breakingCooldownMinutes: number
  topicCooldownMinutes: number
  /** Hour window (local) during which pushes are suppressed unless breaking. */
  quietHours?: { start: number; end: number }
}

export const DEFAULT_POLICY: NotificationPolicy = {
  maxPerDay: 6,
  breakingCooldownMinutes: 15,
  topicCooldownMinutes: 60,
}

export type ScoredNotification = NotificationCandidate & {
  score: number
  reason: 'breaking' | 'follow' | 'digest' | 'suppressed-quota' | 'suppressed-pref' | 'suppressed-cooldown' | 'suppressed-quiet'
  willSend: boolean
}

const KIND_WEIGHT: Record<NotificationKind, number> = {
  breaking: 100,
  followed_topic: 60,
  followed_author: 55,
  daily_digest: 30,
  marketing: 10,
}

export function scoreNotification(
  candidate: NotificationCandidate,
  prefs: NotificationPreference,
  window: SendWindow,
  policy: NotificationPolicy = DEFAULT_POLICY,
  now = new Date(),
): ScoredNotification {
  const base = KIND_WEIGHT[candidate.kind]
  const ageMinutes = (now.getTime() - Date.parse(candidate.at)) / 60_000
  const freshness = Math.exp(-ageMinutes / 60)

  let reason: ScoredNotification['reason'] =
    candidate.kind === 'breaking'
      ? 'breaking'
      : candidate.kind === 'daily_digest'
        ? 'digest'
        : 'follow'

  const channelOk =
    candidate.kind === 'breaking'
      ? prefs.breaking
      : candidate.kind === 'followed_topic'
        ? prefs.followedTopics
        : candidate.kind === 'followed_author'
          ? prefs.followedAuthors
          : candidate.kind === 'daily_digest'
            ? prefs.dailyDigest
            : prefs.marketing

  if (!channelOk) {
    return { ...candidate, score: 0, reason: 'suppressed-pref', willSend: false }
  }

  if (window.sent24h >= policy.maxPerDay) {
    return { ...candidate, score: 0, reason: 'suppressed-quota', willSend: false }
  }

  const cooldown =
    candidate.kind === 'breaking'
      ? policy.breakingCooldownMinutes
      : candidate.kind === 'marketing'
        ? Infinity
        : policy.topicCooldownMinutes
  if (window.lastSentAt) {
    const sinceLast = (now.getTime() - Date.parse(window.lastSentAt)) / 60_000
    if (sinceLast < cooldown) {
      return { ...candidate, score: 0, reason: 'suppressed-cooldown', willSend: false }
    }
  }

  if (policy.quietHours) {
    const hour = now.getHours()
    const { start, end } = policy.quietHours
    const inQuiet = start < end ? hour >= start && hour < end : hour >= start || hour < end
    if (inQuiet && candidate.kind !== 'breaking') {
      return { ...candidate, score: 0, reason: 'suppressed-quiet', willSend: false }
    }
  }

  const fatiguePenalty = Math.min(50, window.sent24h * 6)
  const score = Math.max(0, base * freshness - fatiguePenalty)

  return { ...candidate, score, reason, willSend: score > 0 }
}

/** Sort a batch of candidates per user, respecting per-user quotas. Mutates
 *  the supplied window counters as it commits sends. */
export function planSends(
  candidates: NotificationCandidate[],
  prefsByUser: Map<string, NotificationPreference>,
  windowByUser: Map<string, SendWindow>,
  policy: NotificationPolicy = DEFAULT_POLICY,
  now = new Date(),
): ScoredNotification[] {
  const scored = candidates.map((c) => {
    const prefs =
      prefsByUser.get(c.userId) ?? {
        userId: c.userId,
        breaking: true,
        followedTopics: true,
        followedAuthors: true,
        dailyDigest: true,
        marketing: false,
        channels: { push: true, email: true, sms: false },
      }
    const win =
      windowByUser.get(c.userId) ?? { userId: c.userId, sent24h: 0 }
    return scoreNotification(c, prefs, win, policy, now)
  })

  const plan: ScoredNotification[] = []
  for (const s of scored.sort((a, b) => b.score - a.score)) {
    if (!s.willSend) {
      plan.push(s)
      continue
    }
    const win = windowByUser.get(s.userId) ?? { userId: s.userId, sent24h: 0 }
    if (win.sent24h >= policy.maxPerDay) {
      plan.push({ ...s, willSend: false, reason: 'suppressed-quota' })
      continue
    }
    win.sent24h += 1
    win.lastSentAt = now.toISOString()
    windowByUser.set(s.userId, win)
    plan.push(s)
  }
  return plan
}

/** Notification events are recorded as analytics events; this helper maps a
 *  planned send to the event shape the warehouse expects. */
export function toEvent(s: ScoredNotification): AnalyticsEvent {
  return {
    name: 'notification_click',
    at: s.at,
    sessionId: s.userId,
    userId: s.userId,
    articleId: s.articleId,
    props: { kind: s.kind, reason: s.reason, score: s.score },
  }
}
