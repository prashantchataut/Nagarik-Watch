import { describe, expect, it } from 'vitest'
import { scoreAssignment, scoreDraft } from './desk-scoring'

describe('desk scoring', () => {
  it('prioritizes urgent high-gap assignments', () => {
    const urgent = scoreAssignment({
      deadlineHours: 2,
      coverageGap: 0.9,
      checklistRemaining: 4,
      hoursLeft: 2,
    })
    const calm = scoreAssignment({
      deadlineHours: 48,
      coverageGap: 0.1,
      checklistRemaining: 0,
      hoursLeft: 48,
    })
    expect(urgent.deskScore).toBeGreaterThan(calm.deskScore)
  })

  it('scores draft quality signals', () => {
    const draft = scoreDraft({
      deck: 'काठमाडौंमा बाढीपछि सडक अवरुद्ध, प्रशासनले उद्धार तीव्र पारेको छ',
      caption: 'बाढी प्रभावित क्षेत्र',
      claims: 4,
      citations: 3,
      slug: 'kathmandu-flood',
      slugTaken: false,
    })
    expect(draft.deskScore).toBeGreaterThan(0.5)
    expect(draft.resolvedSlug).toBe('kathmandu-flood')
  })
})
