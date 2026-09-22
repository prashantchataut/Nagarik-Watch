import { describe, expect, it } from 'vitest'
import type { StoryCardData } from '@nagarikwatch/db'
import { editorialTrustScore, trustScoreFor } from './trust-score'

function story(partial: Partial<StoryCardData> = {}): StoryCardData {
  return {
    id: partial.id ?? '1',
    slug: partial.slug ?? 'slug',
    category: partial.category ?? {
      id: 'c',
      slug: 'politics',
      nameNe: 'राजनीति',
      nameEn: 'Politics',
    },
    categoryLabel: partial.categoryLabel ?? 'राजनीति',
    titleNe: partial.titleNe ?? 'शीर्षक',
    byline: partial.byline ?? '',
    authors: partial.authors ?? [],
    publishedAt: partial.publishedAt ?? '2026-06-01T00:00:00Z',
    hasEnglish: partial.hasEnglish ?? false,
    isBreaking: partial.isBreaking ?? false,
    ...partial,
  }
}

const AUTHOR = [{ id: 'a1', name: 'श्रीजना कार्की', slug: 'srijana-karki' }]

describe('editorialTrustScore', () => {
  it('returns the neutral baseline when nothing is recorded', () => {
    expect(trustScoreFor(story())).toBeCloseTo(0.5, 5)
  })

  it('stays inside [0, 1] under every combination', () => {
    const best = trustScoreFor(
      story({
        authors: AUTHOR,
        factCheckStatus: 'verified',
        exclusive: true,
        dataStory: true,
        editorPick: true,
        heroImage: { url: '/a.jpg', alt: 'a' },
        hasGallery: true,
        hasVideo: true,
        province: 'bagmati',
        district: 'kathmandu',
        tags: [
          { id: 't1', slug: 'a', nameNe: 'क' },
          { id: 't2', slug: 'b', nameNe: 'ख' },
        ],
        readingMinutes: 40,
      }),
      {
        editor: { name: 'ए', slug: 'a' },
        factChecker: { name: 'बी', slug: 'b' },
        sourceNotes: 'x',
      },
    )
    const worst = trustScoreFor(story({ factCheckStatus: 'false' }), {
      sponsored: true,
      source: { sourceType: 'wire' },
    })
    expect(best).toBeLessThanOrEqual(1)
    expect(best).toBeGreaterThan(0.8)
    expect(worst).toBeGreaterThanOrEqual(0)
    expect(worst).toBeLessThan(0.2)
  })

  it('values an attributable byline above a bare byline string', () => {
    const linked = trustScoreFor(story({ authors: AUTHOR, byline: 'श्रीजना कार्की' }))
    const bare = trustScoreFor(story({ byline: 'संवाददाता' }))
    expect(linked).toBeGreaterThan(bare)
  })

  it('pushes a debunked claim well below an ordinary story', () => {
    expect(trustScoreFor(story({ factCheckStatus: 'false' }))).toBeLessThan(0.3)
    expect(trustScoreFor(story({ factCheckStatus: 'verified' }))).toBeGreaterThan(0.65)
  })

  it('penalises aggregation less when the original is linked', () => {
    const linked = trustScoreFor(story(), {
      source: { sourceType: 'wire', sourceName: 'RSS', sourceUrl: 'https://example.org/x' },
    })
    const unlinked = trustScoreFor(story(), { source: { sourceType: 'wire', sourceName: 'RSS' } })
    expect(linked).toBeGreaterThan(unlinked)
  })

  it('does not punish a newsroom for publishing a correction', () => {
    const corrected = trustScoreFor(story({ authors: AUTHOR }), {
      corrections: [{ at: '2026-06-02T00:00:00Z', summaryNe: 'सच्याइएको' }],
    })
    expect(corrected).toBeCloseTo(trustScoreFor(story({ authors: AUTHOR })), 5)
  })

  it('caps production value so imagery cannot outweigh a byline', () => {
    const glossy = trustScoreFor(
      story({
        heroImage: { url: '/a.jpg', alt: 'a' },
        hasGallery: true,
        hasVideo: true,
        province: 'bagmati',
        district: 'kathmandu',
        tags: [
          { id: 't1', slug: 'a', nameNe: 'क' },
          { id: 't2', slug: 'b', nameNe: 'ख' },
        ],
      }),
    )
    const reported = trustScoreFor(story({ authors: AUTHOR }))
    expect(glossy).toBeLessThan(reported)
  })

  it('explains itself', () => {
    const { components } = editorialTrustScore(story({ authors: AUTHOR, exclusive: true }))
    const keys = components.map((component) => component.key)
    expect(keys).toContain('named-author')
    expect(keys).toContain('exclusive')
    for (const component of components) {
      expect(component.reason.length).toBeGreaterThan(0)
    }
  })
})
