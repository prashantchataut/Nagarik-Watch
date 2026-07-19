import { describe, expect, it } from 'vitest'
import { classifyTopic } from './topics'

describe('classifyTopic', () => {
  it('classifies disaster coverage from bilingual keywords', () => {
    const result = classifyTopic('काठमाडौंमा बाढी र पहिरोको जोखिम बढेको छ, disaster warning issued')
    expect(result.topic).toBe('disaster')
    expect(result.score).toBeGreaterThan(0)
  })

  it('classifies political coverage', () => {
    const result = classifyTopic('संसदमा सरकार र मन्त्रीहरूबीच निर्वाचन बारे छलफल')
    expect(result.topic).toBe('politics')
  })

  it('falls back to general when nothing matches', () => {
    expect(classifyTopic('साहित्यिक समीक्षा र कविता पाठ')).toEqual({ topic: 'general', score: 0 })
  })
})
