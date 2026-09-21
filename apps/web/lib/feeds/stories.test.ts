import type { StoryCardData } from '@nagarikwatch/db'
import { describe, expect, it } from 'vitest'
import { distributionStory } from './stories'

function story(overrides: Partial<StoryCardData> = {}): StoryCardData {
  return {
    id: 'a1',
    slug: 'budget-2083',
    category: { id: 'politics', slug: 'politics', nameNe: 'राजनीति', nameEn: 'Politics' },
    categoryLabel: 'राजनीति',
    titleNe: 'संघीय बजेट संसदमा पेश',
    deckNe: 'अर्थमन्त्रीले विनियोजन विधेयक पेश गरे।',
    byline: 'नागरिक वाच',
    authors: [],
    publishedAt: '2026-06-22T09:00:00Z',
    hasEnglish: false,
    isBreaking: false,
    ...overrides,
  } as StoryCardData
}

describe('distributionStory', () => {
  it('carries no correction note when there is nothing to correct', () => {
    const feed = distributionStory(story(), 'ne')
    expect(feed.correctionNote).toBeUndefined()
    expect(feed.updatedAt).toBeUndefined()
  })

  it('repeats the newest correction so it travels with the feed item', () => {
    const feed = distributionStory(
      story({
        corrections: [
          { at: '2026-06-22T10:00:00Z', summaryNe: 'रकम ५ अर्ब होइन ५० अर्ब हो।' },
          { at: '2026-06-23T10:00:00Z', summaryNe: 'मन्त्रीको नाम सच्याइयो।' },
        ],
      }),
      'ne',
    )
    expect(feed.correctionNote).toBe('सच्याइएको: मन्त्रीको नाम सच्याइयो।')
  })

  it('uses the English summary in the English feed and falls back when absent', () => {
    const corrections = [
      { at: '2026-06-23T10:00:00Z', summaryNe: 'नाम सच्याइयो।', summaryEn: 'Name corrected.' },
    ]
    expect(distributionStory(story({ corrections }), 'en').correctionNote).toBe(
      'Correction: Name corrected.',
    )
    expect(
      distributionStory(
        story({ corrections: [{ ...corrections[0]!, summaryEn: undefined }] }),
        'en',
      ).correctionNote,
    ).toBe('Correction: नाम सच्याइयो।')
  })

  it('reports updatedAt only when it differs from publication', () => {
    expect(distributionStory(story({ updatedAt: '2026-06-22T09:00:00Z' }), 'ne').updatedAt).toBe(
      undefined,
    )
    expect(distributionStory(story({ updatedAt: '2026-06-23T09:00:00Z' }), 'ne').updatedAt).toBe(
      '2026-06-23T09:00:00.000Z',
    )
  })
})
