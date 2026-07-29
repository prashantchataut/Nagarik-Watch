import { describe, expect, it } from 'vitest'
import type { HomepageData, StoryCardData } from '@nagarikwatch/db'
import { dedupeHomepage } from './homepage-dedup'

function story(id: string, slug = id): StoryCardData {
  return {
    id,
    slug,
    category: { id: 'society', slug: 'society', nameNe: 'समाज', nameEn: 'Society' },
    categoryLabel: 'समाज',
    titleNe: `Title ${id}`,
    byline: 'Desk',
    authors: [],
    publishedAt: '2026-07-01T00:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    premium: false,
    readingMinutes: 3,
  } as StoryCardData
}

describe('dedupeHomepage', () => {
  it('removes lead story from breaking and secondary modules', () => {
    const lead = story('lead')
    const homepage: HomepageData = {
      lead,
      featured: [lead, story('feat-1')],
      secondary: [lead, story('sec-1')],
      breaking: [lead, story('brk-1')],
      sections: [
        {
          category: lead.category,
          lead,
          items: [lead, story('sec-item-1')],
        },
      ],
    }

    const result = dedupeHomepage(homepage)

    expect(result.featured.map((s) => s.id)).toEqual(['feat-1'])
    expect(result.secondary.map((s) => s.id)).toEqual(['sec-1'])
    expect(result.breaking.map((s) => s.id)).toEqual(['brk-1'])
    expect(result.sections[0]?.lead).toBeUndefined()
    expect(result.sections[0]?.items.map((s) => s.id)).toEqual(['sec-item-1'])
  })
})
