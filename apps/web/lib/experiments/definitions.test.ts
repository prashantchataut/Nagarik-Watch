import { describe, expect, it } from 'vitest'
import { parseExperimentDefinitions } from './definition-parser'

describe('experiment definitions', () => {
  it('returns an empty list for invalid input', () => {
    expect(parseExperimentDefinitions(undefined)).toEqual([])
    expect(parseExperimentDefinitions('{bad json')).toEqual([])
    expect(parseExperimentDefinitions('{}')).toEqual([])
  })

  it('sanitizes valid definitions and guardrails', () => {
    const definitions = parseExperimentDefinitions(
      JSON.stringify([
        {
          id: 'headline-test',
          label: 'Headline test',
          status: 'active',
          variants: [
            { id: 'control', label: 'Control', weight: 1 },
            { id: 'treatment', label: 'Treatment', weight: 1 },
          ],
          minimumExposuresPerVariant: 1,
          winnerProbability: 2,
        },
      ]),
    )
    expect(definitions).toHaveLength(1)
    expect(definitions[0]?.minimumExposuresPerVariant).toBe(20)
    expect(definitions[0]?.winnerProbability).toBe(0.999)
  })

  it('drops definitions without two usable variants', () => {
    const definitions = parseExperimentDefinitions(
      JSON.stringify([
        {
          id: 'broken',
          status: 'active',
          variants: [{ id: 'only', weight: 1 }],
        },
      ]),
    )
    expect(definitions).toEqual([])
  })
})

