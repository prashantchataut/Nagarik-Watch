import { describe, expect, it } from 'vitest'
import { romanize, romanizedKeys, skeleton } from './romanize'

describe('romanize', () => {
  it('attaches a matra to the consonant before it', () => {
    // The failure mode this guards: treating ने as न followed by a stray े.
    expect(romanize('ने')).toBe('ne')
    expect(romanize('नेपाल')).toBe('nepal')
    expect(romanize('पोखरा')).toBe('pokhara')
  })

  it('deletes the word-final inherent vowel, as Nepali does', () => {
    expect(romanize('नेपाल')).toBe('nepal')
    expect(romanize('बजेट')).toBe('bajet')
    expect(romanize('दाहाल')).toBe('dahal')
  })

  it('keeps the inherent vowel on a one-letter word', () => {
    // Dropping it would leave `k`, which is not a word anyone types.
    expect(romanize('क')).toBe('ka')
    expect(romanize('मा')).toBe('ma')
  })

  it('suppresses the inherent vowel at a virama', () => {
    expect(romanize('नेप्से')).toBe('nepse')
    expect(romanize('स्वास्थ्य')).toBe('svasthy')
    expect(romanize('प्रधानमन्त्री')).toBe('pradhanamantri')
  })

  it('folds vowel length, since readers do not type it consistently', () => {
    expect(romanize('गीत')).toBe(romanize('गित'))
    expect(romanize('सूचना')).toBe(romanize('सुचना'))
  })

  it('folds the retroflex and dental series onto one Latin letter', () => {
    expect(romanize('टाट')).toBe(romanize('तात'))
  })

  it('writes anusvara as n between letters and drops it at the end', () => {
    // Medial is what readers type; a trailing n only adds an edit, because
    // they move the nasal (`kathmandu`, not `kathmadaun`).
    expect(romanize('संसद')).toBe('sansad')
    expect(romanize('कांग्रेस')).toBe('kangres')
    expect(romanize('काठमाडौं')).toBe('kathamadau')
  })

  it('maps Devanagari digits to ASCII', () => {
    // Headlines write the Bikram Sambat year as २०८२; readers type 2082.
    expect(romanize('२०८२')).toBe('2082')
    expect(romanize('कक्षा१०')).toBe('kaksha10')
  })

  it('returns empty for a token with no Devanagari', () => {
    expect(romanize('budget')).toBe('')
    expect(romanize('2026')).toBe('')
  })
})

describe('skeleton', () => {
  it('reaches the spellings that are outside fuzzy range', () => {
    // `kathmandu` is three edits from `kathamadau`; fuzzy expansion caps at two.
    expect(skeleton(romanize('काठमाडौं'))).toBe(skeleton('kathmandu'))
    expect(skeleton('katmandu')).toBe(skeleton('kathmandu'))
  })

  it('folds the v/w/b variants that Nepali writes both ways', () => {
    expect(skeleton(romanize('विराटनगर'))).toBe(skeleton(romanize('बिराटनगर')))
    expect(skeleton('swasthya')).toBe(skeleton('svasthya'))
  })

  it('collapses a doubled consonant', () => {
    expect(skeleton('sarbochcha')).toBe(skeleton(romanize('सर्वोच्च')))
  })

  it('refuses a skeleton too short to identify a word', () => {
    // These have exact romanizations already; a two-consonant key would match
    // a large slice of the corpus for no recall it does not already have.
    expect(skeleton('nepal')).toBe('')
    expect(skeleton('gandaki')).toBe('')
  })
})

describe('romanizedKeys', () => {
  it('yields the romanization and, when distinctive, the skeleton', () => {
    expect(romanizedKeys('काठमाडौं')).toEqual({ roman: 'kathamadau', skeleton: 'ktmd' })
  })

  it('yields no skeleton when the romanization is already the reachable key', () => {
    expect(romanizedKeys('नेपाल')).toEqual({ roman: 'nepal', skeleton: '' })
  })

  it('is null for a Latin token', () => {
    expect(romanizedKeys('nepal')).toBeNull()
  })
})
