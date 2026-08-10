import { tokenSet } from './tokenize'

/**
 * Bilingual keyword lexicon for topic classification. Small and transparent —
 * a manual taxonomy backstop, not a statistical classifier. Extend this table
 * as new desks need coverage; it stays in sync with the catalog's
 * `topic-classification` capability (apps/web/lib/algorithms/capabilities/local-nlp.ts).
 */
export const TOPIC_KEYWORDS: Record<string, string[]> = {
  disaster: ['बाढी', 'flood', 'भूकम्प', 'landslide', 'पहिरो', 'disaster'],
  politics: ['सरकार', 'government', 'संसद', 'मन्त्री', 'election', 'निर्वाचन'],
  sports: ['खेलकुद', 'sports', 'खेल', 'match', 'क्रिकेट', 'cricket'],
  business: ['व्यापार', 'business', 'बजार', 'market', 'अर्थतन्त्र', 'economy'],
}

export type TopicClassification = {
  topic: string
  score: number
}

/** Keyword-overlap topic classifier: highest keyword-hit ratio wins, `general` when nothing matches. */
export function classifyTopic(text: string): TopicClassification {
  const tokens = tokenSet(text)
  let best = 'general'
  let bestScore = 0
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const hits = keywords.filter((keyword) => tokens.has(keyword.toLowerCase())).length
    const score = hits / keywords.length
    if (score > bestScore) {
      bestScore = score
      best = topic
    }
  }
  return { topic: best, score: bestScore }
}

/** Multi-topic ranking for journalist assist — returns every topic with a non-zero hit. */
export function classifyTopics(
  text: string,
  limit = 5,
): Array<TopicClassification & { matched?: string[] }> {
  const tokens = tokenSet(text)
  const hits: Array<TopicClassification & { matched: string[] }> = []
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    const matched = keywords.filter((keyword) => tokens.has(keyword.toLowerCase()))
    if (matched.length === 0) continue
    hits.push({ topic, score: matched.length / keywords.length, matched })
  }
  hits.sort((a, b) => b.score - a.score)
  return hits.slice(0, limit)
}
