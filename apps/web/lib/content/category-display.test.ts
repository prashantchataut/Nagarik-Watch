import { describe, expect, it } from 'vitest'
import { displayCategoryName } from './category-display'

describe('displayCategoryName', () => {
  it('keeps proper Devanagari CMS names', () => {
    expect(
      displayCategoryName({ slug: 'diaspora', nameNe: 'प्रवास', nameEn: 'Diaspora' }, 'ne'),
    ).toBe('प्रवास')
  })

  it('replaces Latin slug leaks with seed Nepali labels', () => {
    expect(
      displayCategoryName({ slug: 'diaspora', nameNe: 'diaspora', nameEn: 'diaspora' }, 'ne'),
    ).toBe('प्रवास')
  })

  it('uses English seed labels on /en when CMS is slugish', () => {
    expect(
      displayCategoryName({ slug: 'politics', nameNe: 'politics', nameEn: 'politics' }, 'en'),
    ).toBe('Politics')
  })
})
