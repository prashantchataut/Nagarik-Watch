import { describe, expect, it } from 'vitest'
import {
  addArticleToSessionMeter,
  articleMeterKey,
  freeReadsRemainingFor,
  parseMeter,
  serializeMeter,
} from './free-article-meter'
import { paywallReason, shouldShowPaywall } from './paywall/decision'

describe('free article session meter', () => {
  it('counts distinct articles and caps retained keys', () => {
    const first = addArticleToSessionMeter(null, 'news:a', 3)
    const repeat = addArticleToSessionMeter(JSON.stringify(first.articles), 'news:a', 3)
    const full = addArticleToSessionMeter(JSON.stringify(['news:a', 'news:b']), 'news:c', 3)
    expect(repeat.count).toBe(1)
    expect(full).toEqual({
      articles: ['news:a', 'news:b', 'news:c'],
      count: 3,
      remaining: 0,
      limit: 3,
    })
  })

  it('round-trips through the cookie form', () => {
    expect(parseMeter(serializeMeter(['politics:a', 'sports:b']))).toEqual([
      'politics:a',
      'sports:b',
    ])
    expect(parseMeter(null)).toEqual([])
    expect(parseMeter('')).toEqual([])
    // A cookie the reader (or anyone else) hand-edited must not crash the page.
    expect(parseMeter('||  ||')).toEqual([])
    expect(serializeMeter(['bad|key', 'x'.repeat(400), 'ok:1'])).toBe('ok:1')
  })

  it('never spends a second slot on an article already read this session', () => {
    const read = ['a:1', 'a:2', 'a:3', 'a:4', 'a:5']
    expect(freeReadsRemainingFor(read, 'a:3', 5)).toBe(1)
    expect(freeReadsRemainingFor(read, 'a:6', 5)).toBe(0)
  })

  it('gates the sixth story and keeps the first five open', () => {
    const limit = 5
    const gate = (read: string[], key: string, premium = false) =>
      shouldShowPaywall({
        isMember: false,
        freeRemaining: freeReadsRemainingFor(read, key, limit),
        articlePremium: premium,
      })

    let read: string[] = []
    for (let i = 1; i <= limit; i += 1) {
      const key = articleMeterKey('news', `story-${i}`)
      expect(gate(read, key)).toBe(false)
      read = [...read, key]
    }

    const sixth = articleMeterKey('news', 'story-6')
    expect(gate(read, sixth)).toBe(true)
    expect(paywallReason({ isMember: false, freeRemaining: 0, articlePremium: false })).toBe(
      'meter-exhausted',
    )
    // Re-opening one of the five is still free; the back button is not a paywall.
    expect(gate(read, articleMeterKey('news', 'story-2'))).toBe(false)
  })

  it('lets members past the meter entirely', () => {
    const read = ['a:1', 'a:2', 'a:3', 'a:4', 'a:5']
    expect(
      shouldShowPaywall({
        isMember: true,
        freeRemaining: freeReadsRemainingFor(read, 'a:9', 5),
        articlePremium: true,
      }),
    ).toBe(false)
  })
})
