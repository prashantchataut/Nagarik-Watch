import type { StoryCardData } from '@nagarikwatch/db'
import { describe, expect, it } from 'vitest'
import { findSeriesContinuation, findSeriesPrevious, parseSeriesPart } from './series'

function story(titleNe: string, slug = titleNe.slice(0, 12)): StoryCardData {
  return {
    id: slug,
    slug,
    category: {
      id: 'investigation',
      slug: 'investigation',
      nameNe: 'खोज',
      nameEn: 'Investigation',
    },
    categoryLabel: 'खोज',
    titleNe,
    byline: 'नागरिक वाच',
    authors: [],
    publishedAt: '2026-06-22T09:00:00Z',
    hasEnglish: false,
    isBreaking: false,
  } as StoryCardData
}

describe('parseSeriesPart', () => {
  it('reads Devanagari and Arabic numerals after the marker', () => {
    expect(parseSeriesPart('बालुवाटारको जग्गा प्रकरण (भाग २)')?.part).toBe(2)
    expect(parseSeriesPart('बालुवाटारको जग्गा प्रकरण — भाग 3')?.part).toBe(3)
    expect(parseSeriesPart('Melamchi files: Part 4')?.part).toBe(4)
  })

  it('reads the ordinal word form the desk also uses', () => {
    expect(parseSeriesPart('सुनचाँदी काण्ड: दोस्रो भाग')?.part).toBe(2)
    expect(parseSeriesPart('सुनचाँदी काण्ड: तेस्रो भाग')?.part).toBe(3)
  })

  it('gives the same base for every installment so they group', () => {
    const one = parseSeriesPart('बालुवाटारको जग्गा प्रकरण (भाग १)')
    const two = parseSeriesPart('बालुवाटारको जग्गा प्रकरण — भाग २')
    const three = parseSeriesPart('बालुवाटारको जग्गा प्रकरण: तेस्रो भाग')
    expect(one?.base).toBe(two?.base)
    expect(two?.base).toBe(three?.base)
  })

  it('does not invent a series out of an ordinary headline', () => {
    expect(parseSeriesPart('संघीय बजेट संसदमा पेश')).toBeNull()
    expect(parseSeriesPart('Part of the ministry denied the claim')).toBeNull()
    expect(parseSeriesPart('')).toBeNull()
  })

  it('rejects a part number that is not one', () => {
    expect(parseSeriesPart('काण्ड (भाग ०)')).toBeNull()
  })
})

describe('findSeriesContinuation', () => {
  const series = [
    story('बालुवाटारको जग्गा प्रकरण (भाग १)', 'baluwatar-1'),
    story('बालुवाटारको जग्गा प्रकरण (भाग २)', 'baluwatar-2'),
    story('बालुवाटारको जग्गा प्रकरण (भाग ४)', 'baluwatar-4'),
    story('संघीय बजेट संसदमा पेश', 'budget'),
  ]

  it('points at the next installment, not at the closest story', () => {
    const next = findSeriesContinuation(
      { titleNe: 'बालुवाटारको जग्गा प्रकरण (भाग १)', slug: 'baluwatar-1' },
      series,
    )
    expect(next?.slug).toBe('baluwatar-2')
  })

  it('skips a gap rather than dead-ending when a part is unpublished', () => {
    const next = findSeriesContinuation(
      { titleNe: 'बालुवाटारको जग्गा प्रकरण (भाग २)', slug: 'baluwatar-2' },
      series,
    )
    expect(next?.slug).toBe('baluwatar-4')
  })

  it('returns null at the end of the series and for a standalone story', () => {
    expect(
      findSeriesContinuation(
        { titleNe: 'बालुवाटारको जग्गा प्रकरण (भाग ४)', slug: 'baluwatar-4' },
        series,
      ),
    ).toBeNull()
    expect(
      findSeriesContinuation({ titleNe: 'संघीय बजेट संसदमा पेश', slug: 'budget' }, series),
    ).toBeNull()
  })

  it('does not cross between two different series', () => {
    const next = findSeriesContinuation(
      { titleNe: 'बालुवाटारको जग्गा प्रकरण (भाग १)', slug: 'baluwatar-1' },
      [story('मेलम्ची अनियमितता (भाग २)', 'melamchi-2')],
    )
    expect(next).toBeNull()
  })

  it('finds the preceding installment for the back link', () => {
    const prev = findSeriesPrevious(
      { titleNe: 'बालुवाटारको जग्गा प्रकरण (भाग ४)', slug: 'baluwatar-4' },
      series,
    )
    expect(prev?.slug).toBe('baluwatar-2')
  })
})
