import { describe, expect, it } from 'vitest'
import { coReadRecommend, knnRecommend, vectorCosine } from './cf'

describe('collaborative filtering baselines', () => {
  it('recommends items co-read by readers with overlapping histories', () => {
    const matrix = {
      target: { politics: 1 },
      readerA: { politics: 1, economy: 1 },
      readerB: { politics: 1, economy: 1 },
      readerC: { politics: 1, sports: 1 },
      readerD: { weather: 1, sports: 1 },
    }

    const result = coReadRecommend(matrix, 'target', {
      candidateIds: ['economy', 'sports', 'weather'],
    })

    expect(result.map((item) => item.itemId)).toEqual(['economy', 'sports'])
    expect(result[0]!.score).toBeGreaterThan(result[1]!.score)
  })

  it('returns no invented recommendations for an unknown reader', () => {
    expect(coReadRecommend({ reader: { one: 1 } }, 'missing')).toEqual([])
  })

  it('orders k nearest interest vectors by cosine similarity', () => {
    const interest = new Map([
      ['politics', 1],
      ['economy', 1],
    ])
    const result = knnRecommend(
      interest,
      [
        {
          id: 'exact',
          vector: new Map([
            ['politics', 1],
            ['economy', 1],
          ]),
        },
        { id: 'partial', vector: new Map([['politics', 1]]) },
        { id: 'unrelated', vector: new Map([['sports', 1]]) },
      ],
      2,
    )

    expect(result.map((item) => item.id)).toEqual(['exact', 'partial'])
    expect(result[0]!.similarity).toBeCloseTo(1)
    expect(vectorCosine(new Map(), interest)).toBe(0)
  })
})
