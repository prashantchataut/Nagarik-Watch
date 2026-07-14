import { describe, expect, it } from 'vitest'
import type { NotificationPreference } from './types'
import { planSends, scoreNotification } from './notify'

const prefs: NotificationPreference = {
  userId: 'reader-1',
  breaking: true,
  followedTopics: true,
  followedAuthors: true,
  dailyDigest: true,
  marketing: false,
  channels: { push: true, email: false, sms: false },
}

const now = new Date('2026-07-14T12:00:00.000Z')

describe('notification policy', () => {
  it('does not amplify future timestamps beyond full freshness', () => {
    const result = scoreNotification({
      userId: 'reader-1',
      kind: 'breaking',
      articleId: 'future',
      at: '2026-07-14T12:05:00.000Z',
    }, prefs, { userId: 'reader-1', sent24h: 0 }, undefined, now)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('suppresses non-breaking alerts during quiet hours but permits breaking alerts', () => {
    const policy = { maxPerDay: 6, breakingCooldownMinutes: 15, topicCooldownMinutes: 60, quietHours: { start: 22, end: 7 } }
    const quietNow = new Date('2026-07-14T23:00:00.000Z')
    const topic = scoreNotification({ userId: 'reader-1', kind: 'followed_topic', at: quietNow.toISOString() }, prefs, { userId: 'reader-1', sent24h: 0 }, policy, quietNow)
    const breaking = scoreNotification({ userId: 'reader-1', kind: 'breaking', at: quietNow.toISOString() }, prefs, { userId: 'reader-1', sent24h: 0 }, policy, quietNow)
    expect(topic.reason).toBe('suppressed-quiet')
    expect(breaking.willSend).toBe(true)
  })

  it('rechecks cooldown after each committed send in the same batch', () => {
    const plan = planSends([
      { userId: 'reader-1', kind: 'breaking', articleId: 'a', at: now.toISOString() },
      { userId: 'reader-1', kind: 'breaking', articleId: 'b', at: now.toISOString() },
    ], new Map([['reader-1', prefs]]), new Map(), undefined, now)
    expect(plan.filter((item) => item.willSend)).toHaveLength(1)
    expect(plan.find((item) => !item.willSend)?.reason).toBe('suppressed-cooldown')
  })
})
