import { describe, expect, it } from 'vitest'
import { addArticleToSessionMeter } from './free-article-meter'

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
})
