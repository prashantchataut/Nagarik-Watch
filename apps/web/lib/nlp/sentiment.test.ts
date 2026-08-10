import { describe, expect, it } from 'vitest'
import { sentimentOf } from './sentiment'

describe('sentimentOf', () => {
  it('is neutral (0) when no lexicon words appear', () => {
    expect(sentimentOf('काठमाडौंमा सडक मर्मत सुरु भयो')).toEqual({
      polarity: 0,
      positive: 0,
      negative: 0,
    })
  })

  it('scores positive text above zero', () => {
    const result = sentimentOf('यो सफल र प्रभावकारी राहत कार्य थियो, great success')
    expect(result.polarity).toBeGreaterThan(0)
    expect(result.positive).toBeGreaterThan(0)
  })

  it('scores negative text below zero', () => {
    const result = sentimentOf('बाढीले ठूलो क्षति पुर्‍यायो, this was a bad failure')
    expect(result.polarity).toBeLessThan(0)
    expect(result.negative).toBeGreaterThan(0)
  })
})
