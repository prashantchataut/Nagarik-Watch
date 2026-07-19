import { describe, expect, it } from 'vitest'
import { attentionScore, isAttentiveImpression, summarizeAttention, ATTENTION_DWELL_CAP_MS } from './attention'

describe('attentionScore', () => {
  it('is zero for an unviewed, undwelt placement', () => {
    expect(attentionScore({ viewableRatio: 0, dwellMs: 0 })).toBe(0)
  })

  it('is full for a fully viewable placement dwelt at/above the cap', () => {
    expect(attentionScore({ viewableRatio: 1, dwellMs: ATTENTION_DWELL_CAP_MS })).toBeCloseTo(1)
  })

  it('discounts hidden-tab dwell', () => {
    const visible = attentionScore({ viewableRatio: 1, dwellMs: ATTENTION_DWELL_CAP_MS, tabVisible: true })
    const hidden = attentionScore({ viewableRatio: 1, dwellMs: ATTENTION_DWELL_CAP_MS, tabVisible: false })
    expect(hidden).toBeLessThan(visible)
    expect(hidden).toBeCloseTo(0.3)
  })

  it('clamps out-of-range inputs', () => {
    expect(attentionScore({ viewableRatio: 2, dwellMs: -100 })).toBeCloseTo(0.5)
  })
})

describe('isAttentiveImpression', () => {
  it('applies the default and custom threshold', () => {
    expect(isAttentiveImpression(0.4)).toBe(true)
    expect(isAttentiveImpression(0.39)).toBe(false)
    expect(isAttentiveImpression(0.2, 0.1)).toBe(true)
  })
})

describe('summarizeAttention', () => {
  it('handles an empty batch honestly', () => {
    expect(summarizeAttention([])).toEqual({ averageScore: 0, attentiveShare: 0 })
  })

  it('averages scores and computes the attentive share', () => {
    const summary = summarizeAttention([0, 0.5, 1])
    expect(summary.averageScore).toBeCloseTo(0.5)
    expect(summary.attentiveShare).toBeCloseTo(2 / 3)
  })
})
