import { describe, expect, it } from 'vitest'
import { analyzeExperiment, assignVariant, posteriorFor } from './core'

const variants = [
  { id: 'control', label: 'Control', weight: 1 },
  { id: 'treatment', label: 'Treatment', weight: 1 },
]

describe('experiment assignment', () => {
  it('assigns the same visitor deterministically', () => {
    const first = assignVariant('headline-test', 'reader-123', variants)
    const second = assignVariant('headline-test', 'reader-123', variants)
    expect(first?.id).toBe(second?.id)
  })

  it('rejects unusable assignments', () => {
    expect(assignVariant('', 'reader', variants)).toBeNull()
    expect(assignVariant('test', '', variants)).toBeNull()
    expect(assignVariant('test', 'reader', [])).toBeNull()
  })

  it('respects zero-weight exclusions', () => {
    const assigned = assignVariant('test', 'reader', [
      { id: 'off', label: 'Off', weight: 0 },
      { id: 'on', label: 'On', weight: 1 },
    ])
    expect(assigned?.id).toBe('on')
  })
})

describe('Bayesian experiment analysis', () => {
  it('uses a beta prior and clamps invalid conversions', () => {
    const posterior = posteriorFor({
      variantId: 'a',
      exposures: 10,
      conversions: 20,
    })
    expect(posterior.conversions).toBe(10)
    expect(posterior.posteriorAlpha).toBe(11)
    expect(posterior.posteriorBeta).toBe(1)
  })

  it('does not call a winner below the minimum sample', () => {
    const analysis = analyzeExperiment(
      {
        id: 'small-test',
        variants,
        minimumExposuresPerVariant: 100,
        winnerProbability: 0.95,
      },
      [
        { variantId: 'control', exposures: 20, conversions: 2 },
        { variantId: 'treatment', exposures: 20, conversions: 10 },
      ],
      2_000,
    )
    expect(analysis.decision).toBe('insufficient-data')
    expect(analysis.winner).toBeNull()
  })

  it('calls a clear winner after guardrails pass', () => {
    const analysis = analyzeExperiment(
      {
        id: 'clear-test',
        variants,
        minimumExposuresPerVariant: 100,
        winnerProbability: 0.95,
      },
      [
        { variantId: 'control', exposures: 1_000, conversions: 80 },
        { variantId: 'treatment', exposures: 1_000, conversions: 140 },
      ],
      8_000,
    )
    expect(analysis.decision).toBe('winner')
    expect(analysis.winner).toBe('treatment')
    expect(
      analysis.variants.find((variant) => variant.variantId === 'treatment')?.probabilityBest,
    ).toBeGreaterThan(0.95)
  })
})
