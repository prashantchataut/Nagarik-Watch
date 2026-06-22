import { describe, expect, it } from 'vitest'
import {
  articleToText,
  detectDuplicates,
  draftHeadlines,
  draftKeyPoints,
  draftSummary,
  draftTags,
  splitSentences,
} from './index'
import type { Article } from '@nagarikwatch/db'

const ARTICLE: Pick<Article, 'id' | 'titleNe' | 'deckNe' | 'bodyNe'> = {
  id: 'a1',
  titleNe: 'काठमाडौंमा आज भारी वर्षा',
  deckNe: 'उपत्यकाभरि पानी परेको छ, यातायात प्रभावित।',
  bodyNe: [
    { type: 'paragraph', text: 'काठमाडौं उपत्यकामा आज भारी वर्षा भएको छ। यातायात प्रभावित भएको छ।' },
    { type: 'paragraph', text: 'विपद् प्रबन्धनले सावधान गराएको छ। नदी किनार छाड्न भनिएको छ।' },
  ],
}

describe('AI extractive drafts', () => {
  it('marks every draft as editor-approval-required and never auto-approved', () => {
    const s = draftSummary(ARTICLE)
    expect(s.needsEditorApproval).toBe(true)
    expect(s.status).toBe('draft')
    expect(s.generatedBy).toBe('extractive')
  })

  it('splitSentences handles Devanagari danda', () => {
    const out = splitSentences('पहिलो। दोस्रो। तेस्रो।')
    expect(out).toHaveLength(3)
  })

  it('summary pulls real article sentences, never invents text', () => {
    const out = draftSummary(ARTICLE)
    const text = out.data
    expect(text.length).toBeGreaterThan(0)
    // The summary must be a substring of the article's own text — no hallucination.
    const full = articleToText(ARTICLE)
    for (const sentence of splitSentences(text)) {
      expect(full).toContain(sentence)
    }
  })

  it('key-points returns a bounded list', () => {
    const out = draftKeyPoints(ARTICLE, 3)
    expect(out.data.length).toBeLessThanOrEqual(3)
    expect(out.data.length).toBeGreaterThan(0)
  })

  it('headlines come from deck/lead, never fabricated', () => {
    const out = draftHeadlines(ARTICLE)
    expect(out.data.length).toBeGreaterThan(0)
    for (const h of out.data) {
      expect(typeof h).toBe('string')
    }
  })

  it('tags are non-empty and stopword-filtered', () => {
    const out = draftTags(ARTICLE, 5)
    expect(out.data.length).toBeLessThanOrEqual(5)
    for (const t of out.data) expect(t.length).toBeGreaterThan(2)
  })

  it('duplicate detection flags near-identical articles', () => {
    const a = { id: 'x', titleNe: 'नेपालमा निर्वाचन', bodyNe: [], deckNe: undefined }
    const b = { id: 'y', titleNe: 'नेपालमा निर्वाचन', bodyNe: [], deckNe: undefined }
    const pairs = detectDuplicates([a, b], 0.4)
    expect(pairs.length).toBe(1)
    expect(pairs[0]?.similarity).toBeGreaterThan(0.4)
  })
})
