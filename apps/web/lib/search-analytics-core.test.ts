import { describe, expect, it } from 'vitest'
import {
  normalizeSearchQuery,
  sanitizeSearchQuery,
  validSearchResultCount,
} from './search-analytics-core'

describe('search analytics privacy', () => {
  it('normalizes whitespace and casing', () => {
    expect(normalizeSearchQuery('  Nepal   BUDGET ')).toBe('nepal budget')
  })

  it('scrubs common accidental identifiers', () => {
    expect(sanitizeSearchQuery('person@example.com')).toBe('[email]')
    expect(sanitizeSearchQuery('+977 9812345678')).toBe('[number]')
    expect(sanitizeSearchQuery('https://example.com/private')).toBe('[url]')
  })

  it('bounds result counts', () => {
    expect(validSearchResultCount(-4)).toBe(0)
    expect(validSearchResultCount(17.8)).toBe(17)
    expect(validSearchResultCount(99_999)).toBe(10_000)
  })
})
