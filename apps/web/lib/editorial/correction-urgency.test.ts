import { describe, expect, it } from 'vitest'
import {
  classifySeverity,
  matchCorrectionTarget,
  rankCorrectionRequests,
  type CorrectionRequest,
  type CorrectionTarget,
} from './correction-urgency'

const NOW = Date.parse('2026-06-22T12:00:00Z')

function request(overrides: Partial<CorrectionRequest> & { id: string }): CorrectionRequest {
  return {
    headline: 'बजेट समाचारमा सच्याउनुपर्ने कुरा',
    description: 'लेखमा उल्लेख गरिएको विवरण मिलेन।',
    createdAt: '2026-06-22T11:00:00Z',
    ...overrides,
  }
}

function target(overrides: Partial<CorrectionTarget> & { slug: string }): CorrectionTarget {
  return {
    categorySlug: 'politics',
    title: 'संघीय बजेट विनियोजन संसदमा पेश',
    publishedAt: '2026-06-21T09:00:00Z',
    readers: 100,
    ...overrides,
  }
}

describe('classifySeverity', () => {
  it('reads the Nepali words that mean a lawyer is next', () => {
    expect(classifySeverity('यो समाचार मानहानिजनक छ, फिर्ता लिनुहोस्')).toBe('retraction')
    expect(classifySeverity('Please retract this, it is fabricated')).toBe('retraction')
  })

  it('separates a wrong figure from a missing credit from a typo', () => {
    expect(classifySeverity('रकम गलत छ, ५ अर्ब होइन ५० अर्ब')).toBe('factual')
    expect(classifySeverity('तस्बिरको श्रेय दिइएन')).toBe('attribution')
    expect(classifySeverity('शीर्षकमा हिज्जे मिलेन')).toBe('typo')
  })

  it('treats an unclassifiable request as a clarification, not a typo', () => {
    // The reader still claims the story is wrong; the floor is not "typo".
    expect(classifySeverity('यसबारे मैले पठाएको कुरा हेर्नुहोला')).toBe('clarification')
  })
})

describe('matchCorrectionTarget', () => {
  const targets = [
    target({ slug: 'budget-2083' }),
    target({ slug: 'snowfall', categorySlug: 'weather', title: 'हिमाली क्षेत्रमा हिमपात' }),
  ]

  it('trusts a pasted URL over everything else', () => {
    const matched = matchCorrectionTarget(
      request({
        id: 'r1',
        headline: 'हिमपात',
        description: 'https://nagarikwatch.com/politics/budget-2083 मा गल्ती',
      }),
      targets,
    )
    expect(matched?.slug).toBe('budget-2083')
  })

  it('falls back to headline overlap', () => {
    const matched = matchCorrectionTarget(
      request({ id: 'r2', headline: 'संघीय बजेट विनियोजन संसदमा पेश', description: 'रकम गलत' }),
      targets,
    )
    expect(matched?.slug).toBe('budget-2083')
  })

  it('returns null rather than guessing', () => {
    expect(
      matchCorrectionTarget(
        request({ id: 'r3', headline: 'नमस्कार', description: 'केही सोध्नु थियो' }),
        targets,
      ),
    ).toBeNull()
  })
})

describe('rankCorrectionRequests', () => {
  const targets = [
    target({ slug: 'budget-2083', readers: 20_000 }),
    target({ slug: 'ward-notice', readers: 40, title: 'वडा कार्यालयको सूचना' }),
  ]

  it('puts a defamation claim on a read story at the top', () => {
    const ranked = rankCorrectionRequests(
      [
        request({
          id: 'typo',
          headline: 'वडा कार्यालयको सूचना',
          description: 'हिज्जे मिलेन',
        }),
        request({
          id: 'defam',
          headline: 'संघीय बजेट विनियोजन संसदमा पेश',
          description: 'यो मानहानिजनक छ, फिर्ता लिनुहोस्',
        }),
      ],
      targets,
      NOW,
    )
    expect(ranked[0]?.id).toBe('defam')
    expect(ranked[0]?.reasons).toContain('severe')
    expect(ranked[0]?.reasons).toContain('high-reach')
  })

  it('escalates a small request that nobody answered', () => {
    const fresh = rankCorrectionRequests(
      [request({ id: 'fresh', description: 'हिज्जे मिलेन', createdAt: '2026-06-22T11:00:00Z' })],
      targets,
      NOW,
    )
    const forgotten = rankCorrectionRequests(
      [
        request({
          id: 'forgotten',
          description: 'हिज्जे मिलेन',
          createdAt: '2026-06-18T11:00:00Z',
        }),
      ],
      targets,
      NOW,
    )
    expect(forgotten[0]!.urgency).toBeGreaterThan(fresh[0]!.urgency)
    expect(forgotten[0]!.reasons).toContain('overdue')
  })

  it('does not let one runaway story flatten the rest to zero', () => {
    const ranked = rankCorrectionRequests(
      [
        request({ id: 'big', headline: 'संघीय बजेट विनियोजन संसदमा पेश' }),
        request({ id: 'small', headline: 'वडा कार्यालयको सूचना' }),
      ],
      targets,
      NOW,
    )
    const small = ranked.find((entry) => entry.id === 'small')!
    expect(small.reach).toBeGreaterThan(0.3)
    expect(small.reach).toBeLessThan(ranked.find((entry) => entry.id === 'big')!.reach)
  })

  it('falls back to recency when no story has telemetry', () => {
    const untracked = [
      target({ slug: 'today', readers: 0, publishedAt: '2026-06-22T06:00:00Z' }),
      target({
        slug: 'old',
        readers: 0,
        publishedAt: '2026-01-01T06:00:00Z',
        title: 'वडा कार्यालयको सूचना',
      }),
    ]
    const ranked = rankCorrectionRequests(
      [
        request({ id: 'today', headline: 'संघीय बजेट विनियोजन संसदमा पेश' }),
        request({ id: 'old', headline: 'वडा कार्यालयको सूचना' }),
      ],
      untracked,
      NOW,
    )
    const byId = new Map(ranked.map((entry) => [entry.id, entry]))
    expect(byId.get('today')!.reach).toBeGreaterThan(byId.get('old')!.reach)
    expect(byId.get('today')!.reasons).toContain('no-telemetry')
  })

  it('marks an unmatched request instead of dropping it', () => {
    const ranked = rankCorrectionRequests(
      [request({ id: 'orphan', headline: 'नमस्कार', description: 'केही सोध्नु थियो' })],
      targets,
      NOW,
    )
    expect(ranked[0]?.target).toBeNull()
    expect(ranked[0]?.reasons).toContain('unmatched')
  })

  it('handles an empty desk', () => {
    expect(rankCorrectionRequests([], [], NOW)).toEqual([])
  })
})
