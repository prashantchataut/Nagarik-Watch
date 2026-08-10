import { describe, expect, it } from 'vitest'
import {
  lexicalToxicity,
  moderateComment,
  rankComment,
  reputationScore,
  spamScore,
  trollRiskScore,
  wilsonScore,
} from './moderation'

describe('moderation scoring', () => {
  it('scores configured lexical policy terms without a hardcoded default list', () => {
    expect(lexicalToxicity('सभ्य टिप्पणी', ['अपशब्द'])).toBe(0)
    expect(lexicalToxicity('यो अपशब्द हो', ['अपशब्द'])).toBeGreaterThan(0)
  })

  it('avoids Latin substring false positives and still catches spaced tokens', () => {
    expect(lexicalToxicity('classic newsroom note', ['ass'])).toBe(0)
    expect(lexicalToxicity('what an ass comment', ['ass'])).toBeGreaterThan(0)
  })

  it('normalizes zero-width obfuscation before matching', () => {
    expect(lexicalToxicity('अ\u200bप\u200cशब्द', ['अपशब्द'])).toBeGreaterThan(0)
  })

  it('flags spam signals and keeps clean comments below the hold threshold', () => {
    const spam = spamScore('BUY NOW http://a.com http://b.com http://c.com AAAAA')
    expect(spam.score).toBeGreaterThanOrEqual(0.6)
    expect(spam.flags.length).toBeGreaterThan(0)
    expect(spamScore('यो सफा टिप्पणी हो।').score).toBeLessThan(0.3)
  })

  it('maps high-risk comments to auto reject or hide', () => {
    const rejected = moderateComment(
      { id: '1', body: 'http://a.com http://b.com http://c.com AAAAA http://d.com' },
      0.5,
    )
    expect(['auto_reject', 'auto_hide']).toContain(rejected.verdict)

    const held = moderateComment({ id: '2', body: 'यो अपशब्द हो' }, 0.5, ['अपशब्द'])
    expect(['hold_for_review', 'auto_hide', 'auto_reject']).toContain(held.verdict)
  })

  it('starts new users at a neutral reputation', () => {
    expect(reputationScore(0, 0)).toBe(0.5)
    expect(wilsonScore(12, 2)).toBeGreaterThan(wilsonScore(1, 0))
  })

  it('combines reject history, link density and posting bursts into troll risk', () => {
    const risky = trollRiskScore({
      approvedComments: 1,
      rejectedComments: 9,
      text: 'See http://one.test and http://two.test',
      commentsLastTenMinutes: 10,
    })
    const ordinary = trollRiskScore({
      approvedComments: 8,
      rejectedComments: 1,
      text: 'A normal civic discussion comment.',
      commentsLastTenMinutes: 1,
    })

    expect(risky.score).toBeGreaterThan(ordinary.score)
    expect(risky.flags).toEqual(['high_reject_rate', 'high_link_density', 'posting_burst'])
  })

  it('discounts sparse reject history', () => {
    const sparse = trollRiskScore({
      approvedComments: 0,
      rejectedComments: 1,
      text: 'No links here.',
      commentsLastTenMinutes: 1,
    })
    expect(sparse.score).toBeLessThan(0.2)
    expect(sparse.flags).not.toContain('high_reject_rate')
  })

  it('ranks comments with Wilson and recency', () => {
    const now = new Date('2026-07-18T12:00:00Z')
    const fresh = rankComment(
      {
        id: 'fresh',
        body: 'a',
        createdAt: '2026-07-18T11:00:00Z',
        upvotes: 10,
        downvotes: 1,
      },
      now,
    )
    const stale = rankComment(
      {
        id: 'stale',
        body: 'b',
        createdAt: '2026-06-01T11:00:00Z',
        upvotes: 10,
        downvotes: 1,
      },
      now,
    )
    expect(fresh.rankScore).toBeGreaterThan(stale.rankScore)
  })
})
