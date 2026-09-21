import { describe, expect, it } from 'vitest'
import { aksharaCount, foldNepaliSpelling, stemLatin, stemNepali, stemToken } from './stemmer'

describe('aksharaCount', () => {
  it('counts letters, not code points', () => {
    expect(aksharaCount('नेपाल')).toBe(3)
    expect(aksharaCount('कर')).toBe(2)
    expect(aksharaCount('मा')).toBe(1)
  })
})

describe('stemNepali', () => {
  it('collapses the case clitics onto one stem', () => {
    const forms = ['बजेट', 'बजेटमा', 'बजेटको', 'बजेटले', 'बजेटलाई', 'बजेटबाट', 'बजेटदेखि']
    for (const form of forms) expect(stemNepali(form)).toBe('बजेट')
  })

  it('strips plural and case in one word', () => {
    expect(stemNepali('नेपालहरूको')).toBe('नेपाल')
    expect(stemNepali('विद्यालयहरूमा')).toBe('विद्यालय')
  })

  it('folds the उ/ऊ plural spelling before stripping', () => {
    expect(stemNepali('विद्यालयहरुमा')).toBe(stemNepali('विद्यालयहरूमा'))
  })

  it('refuses to strip when too little of the word would survive', () => {
    // मामा is a word, not मा inflected; सीमा likewise.
    expect(stemNepali('मामा')).toBe('मामा')
    expect(stemNepali('सीमा')).toBe('सीमा')
  })

  it('leaves words whose ending merely looks like a suffix', () => {
    expect(stemNepali('प्राथमिकता')).toBe('प्राथमिकता')
    expect(stemNepali('समीक्षा')).toBe('समीक्षा')
  })

  it('merges the common participle forms of a verb', () => {
    expect(stemNepali('गर्ने')).toBe(stemNepali('गर्नु'))
  })

  it('normalizes candrabindu to anusvara so both spellings of काठमाडौं agree', () => {
    expect(stemNepali('काठमाडौँ')).toBe(stemNepali('काठमाडौं'))
  })
})

describe('foldNepaliSpelling', () => {
  it('drops zero-width joiners that keyboards insert', () => {
    expect(foldNepaliSpelling('बजे‌ट')).toBe('बजेट')
  })
})

describe('stemLatin', () => {
  it('strips plurals and possessives only', () => {
    expect(stemLatin('elections')).toBe('election')
    expect(stemLatin('policies')).toBe('policy')
    expect(stemLatin("nepal's")).toBe('nepal')
  })

  it('leaves singulars that happen to end in s', () => {
    expect(stemLatin('press')).toBe('press')
    expect(stemLatin('census')).toBe('census')
    expect(stemLatin('crisis')).toBe('crisis')
  })

  it('leaves short tokens alone', () => {
    expect(stemLatin('gas')).toBe('gas')
  })
})

describe('stemToken', () => {
  it('dispatches on script and passes through anything else', () => {
    expect(stemToken('बजेटमा')).toBe('बजेट')
    expect(stemToken('budgets')).toBe('budget')
    expect(stemToken('2082')).toBe('2082')
    expect(stemToken('')).toBe('')
  })
})
