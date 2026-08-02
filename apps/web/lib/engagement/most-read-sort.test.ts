import { describe, expect, it } from 'vitest'
import { compareMostReadStats, type MostReadStat } from '@/lib/engagement/store'

function row(partial: Partial<MostReadStat> & Pick<MostReadStat, 'articleSlug'>): MostReadStat {
  return {
    articleCategory: 'society',
    articleTitleNe: partial.articleSlug,
    uniqueReaders: 1,
    averageReadPercent: 50,
    averageDwellSeconds: 30,
    completionRate: 0.5,
    totalSessions: 1,
    lastReadAt: '2026-08-01T00:00:00.000Z',
    ...partial,
  }
}

describe('compareMostReadStats', () => {
  it('prefers higher dwell when unique readers tie', () => {
    const a = row({ articleSlug: 'short', uniqueReaders: 5, averageDwellSeconds: 20 })
    const b = row({ articleSlug: 'long', uniqueReaders: 5, averageDwellSeconds: 90 })
    expect([a, b].sort(compareMostReadStats).map((s) => s.articleSlug)).toEqual(['long', 'short'])
  })

  it('prefers unique readers over dwell', () => {
    const popular = row({ articleSlug: 'popular', uniqueReaders: 12, averageDwellSeconds: 15 })
    const deep = row({ articleSlug: 'deep', uniqueReaders: 4, averageDwellSeconds: 200 })
    expect([deep, popular].sort(compareMostReadStats).map((s) => s.articleSlug)).toEqual([
      'popular',
      'deep',
    ])
  })

  it('uses read percent then recency as later tie-breaks', () => {
    const higherPct = row({
      articleSlug: 'pct',
      uniqueReaders: 3,
      averageDwellSeconds: 40,
      averageReadPercent: 80,
      lastReadAt: '2026-08-01T00:00:00.000Z',
    })
    const fresher = row({
      articleSlug: 'fresh',
      uniqueReaders: 3,
      averageDwellSeconds: 40,
      averageReadPercent: 80,
      lastReadAt: '2026-08-02T00:00:00.000Z',
    })
    expect([higherPct, fresher].sort(compareMostReadStats).map((s) => s.articleSlug)).toEqual([
      'fresh',
      'pct',
    ])
  })
})
