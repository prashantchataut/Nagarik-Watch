import type { StoryCardData } from '@nagarikwatch/db'
import { describe, expect, it } from 'vitest'
import { auditLinkGraph, authorityGini, buildRelatedGraph, pageRank } from './link-graph'

function story(
  id: string,
  titleNe: string,
  options: { category?: string; noIndex?: boolean } = {},
): StoryCardData {
  const category = options.category ?? 'news'
  return {
    id,
    slug: id,
    category: { id: category, slug: category, nameNe: category, nameEn: category },
    categoryLabel: category,
    titleNe,
    byline: 'नागरिक वाच',
    authors: [{ id: 'a', name: 'रीमा श्रेष्ठ', slug: 'reema-shrestha' }],
    publishedAt: '2026-06-22T00:00:00Z',
    hasEnglish: false,
    isBreaking: false,
    ...(options.noIndex === undefined ? {} : { noIndex: options.noIndex }),
  }
}

/** A cluster of related budget stories plus one unrelated outlier. */
const CORPUS = [
  story('a', 'संघीय बजेट विनियोजन संसदमा पेश'),
  story('b', 'संघीय बजेट विनियोजन विधेयक पारित'),
  story('c', 'बजेट विनियोजनमा सांसदको प्रश्न'),
  story('d', 'बजेट कार्यान्वयनको अनुगमन'),
  story('e', 'हिमाली क्षेत्रमा हिमपात', { category: 'weather' }),
  story('f', 'हिमपातले सडक अवरुद्ध', { category: 'weather' }),
]

describe('buildRelatedGraph', () => {
  it('mirrors the links the article page renders', () => {
    const graph = buildRelatedGraph(CORPUS, 2)
    expect(graph.outbound.size).toBe(CORPUS.length)
    for (const [slug, targets] of graph.outbound) {
      expect(targets).toHaveLength(2)
      // A story never links to itself; that is `relatedByContent`'s contract.
      expect(targets).not.toContain(slug)
    }
    // Inbound is the transpose: every outbound edge is someone's inbound edge.
    const inboundTotal = [...graph.inbound.values()].reduce((sum, list) => sum + list.length, 0)
    expect(inboundTotal).toBe(CORPUS.length * 2)
  })

  it('handles a single-story window without crashing', () => {
    const graph = buildRelatedGraph([story('solo', 'एक्लो समाचार')])
    expect(graph.outbound.get('solo')).toEqual([])
  })
})

describe('pageRank', () => {
  it('stays a probability distribution', () => {
    const rank = pageRank(buildRelatedGraph(CORPUS, 2))
    const total = [...rank.values()].reduce((sum, value) => sum + value, 0)
    expect(total).toBeCloseTo(1, 6)
  })

  it('does not leak rank through a dangling node', () => {
    // A story with no outbound links would otherwise drain the whole graph.
    const graph = buildRelatedGraph(CORPUS, 2)
    graph.outbound.set('e', [])
    const total = [...pageRank(graph).values()].reduce((sum, value) => sum + value, 0)
    expect(total).toBeCloseTo(1, 6)
  })

  it('ranks a linked-to story above one nothing points at', () => {
    const outbound = new Map([
      ['hub', ['spoke']],
      ['x', ['hub']],
      ['y', ['hub']],
      ['spoke', ['hub']],
      ['orphan', ['hub']],
    ])
    const inbound = new Map<string, string[]>([
      ['hub', ['x', 'y', 'spoke', 'orphan']],
      ['spoke', ['hub']],
      ['x', []],
      ['y', []],
      ['orphan', []],
    ])
    const rank = pageRank({ outbound, inbound })
    expect(rank.get('hub')!).toBeGreaterThan(rank.get('orphan')!)
  })

  it('returns nothing for an empty graph', () => {
    expect(pageRank({ outbound: new Map(), inbound: new Map() }).size).toBe(0)
  })
})

describe('authorityGini', () => {
  it('is zero when authority is spread evenly', () => {
    expect(
      authorityGini(
        new Map([
          ['a', 0.25],
          ['b', 0.25],
          ['c', 0.25],
          ['d', 0.25],
        ]),
      ),
    ).toBeCloseTo(0, 6)
  })

  it('rises as authority pools in one story', () => {
    const even = authorityGini(
      new Map([
        ['a', 0.5],
        ['b', 0.5],
      ]),
    )
    const skewed = authorityGini(
      new Map([
        ['a', 0.99],
        ['b', 0.01],
      ]),
    )
    expect(skewed).toBeGreaterThan(even)
  })

  it('survives an empty or zero-weight graph', () => {
    expect(authorityGini(new Map())).toBe(0)
    expect(authorityGini(new Map([['a', 0]]))).toBe(0)
  })
})

describe('auditLinkGraph', () => {
  it('counts nodes and edges from the indexable corpus only', () => {
    const audit = auditLinkGraph([...CORPUS, story('z', 'नछापिने', { noIndex: true })])
    // The no-index story is excluded: being unlinked is its intent, not a defect.
    expect(audit.nodes).toBe(CORPUS.length)
    expect(audit.orphans.every((entry) => entry.slug !== 'z')).toBe(true)
    // Five links each, and with six stories every other story is a candidate.
    expect(audit.edges).toBe(CORPUS.length * 5)
  })

  it('reports orphans and hubs', () => {
    const audit = auditLinkGraph(CORPUS)
    expect(audit.hubs[0]?.authority).toBeGreaterThan(0)
    for (const orphan of audit.orphans) {
      expect(orphan.inbound).toBe(0)
    }
    expect(audit.meanInbound).toBeGreaterThan(0)
  })

  it('reports an empty archive as empty rather than dividing by zero', () => {
    expect(auditLinkGraph([])).toMatchObject({ nodes: 0, edges: 0, meanInbound: 0, gini: 0 })
  })
})
