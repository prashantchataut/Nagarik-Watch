import { describe, expect, it } from 'vitest'
import { extractEntities } from './gazetteer'

describe('Nepal civic gazetteer', () => {
  it('extracts bilingual civic entities in reading order', () => {
    const entities = extractEntities('Election Commission Nepal met रामचन्द्र पौडेल in काठमाडौं.')

    expect(entities.map(({ canonical, type }) => ({ canonical, type }))).toEqual([
      { canonical: 'निर्वाचन आयोग', type: 'organization' },
      { canonical: 'रामचन्द्र पौडेल', type: 'person' },
      { canonical: 'काठमाडौं', type: 'place' },
    ])
    expect(entities[0]?.matched).toBe('Election Commission Nepal')
  })

  it('does not match aliases inside longer words', () => {
    expect(extractEntities('Kathmanduites gathered elsewhere.')).toEqual([])
  })

  it('deduplicates overlapping aliases and preserves offsets', () => {
    const text = 'नेपाल राष्ट्र बैंकले होइन, Nepal Rastra Bank ले सूचना दियो।'
    const entities = extractEntities(text)

    expect(entities).toHaveLength(2)
    expect(
      entities.every((entity) => text.slice(entity.start, entity.end) === entity.matched),
    ).toBe(true)
    expect(entities.map((entity) => entity.canonical)).toEqual([
      'नेपाल राष्ट्र बैंक',
      'नेपाल राष्ट्र बैंक',
    ])
  })
})
