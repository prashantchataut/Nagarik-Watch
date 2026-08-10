/**
 * Local NLP capabilities: gazetteer/lexicon-based NER, topic classification,
 * sentiment, keyword extraction, LDA-lite topic grouping, clustering, and
 * semantic search (local embeddings). Deterministic, no external model call.
 */
import type { CapabilitySpec } from '../types'
import { str, tokenSet, jaccard, okLocal, okAdapter, fail } from '../handlers/utils'
import { embed, cosineSimilarity } from '../product/local-embeddings'
import { extractEntities as extractGazetteerEntities } from '../../nlp/gazetteer'
import { classifyTopic } from '../../nlp/topics'
import { sentimentOf } from '../../nlp/sentiment'
import { extractKeywords } from '../../nlp/keywords'
import { surfaceFor } from './surface'

/**
 * The catalog's NER capability historically ran a tiny inline gazetteer
 * (place/org/person_title). It now delegates to the real, tested Nepal civic
 * gazetteer in `lib/nlp/gazetteer.ts` so both the algorithm catalog and the
 * journalist AI route share one entity list.
 */
function extractEntities(text: string): { type: string; token: string }[] {
  return extractGazetteerEntities(text).map((entity) => ({
    type:
      entity.type === 'organization' ? 'org' : entity.type === 'person' ? 'person_title' : 'place',
    token: entity.matched,
  }))
}

function ldaLite(documents: string[], topicCount = 2): { topic: number; terms: string[] }[] {
  const docTerms = documents.map((doc) => extractKeywords(doc, 4).map((k) => k.term))
  const topics: { topic: number; terms: string[] }[] = []
  for (let t = 0; t < Math.min(topicCount, docTerms.length); t++) {
    const seedTerms = new Set<string>()
    for (let i = t; i < docTerms.length; i += topicCount) {
      for (const term of docTerms[i] ?? []) seedTerms.add(term)
    }
    topics.push({ topic: t, terms: [...seedTerms].slice(0, 6) })
  }
  return topics
}

function clusterDocuments(documents: string[], threshold = 0.15): string[][] {
  const sets = documents.map((d) => tokenSet(d))
  const clusters: number[][] = []
  const assigned = new Array(documents.length).fill(-1)
  for (let i = 0; i < documents.length; i++) {
    if (assigned[i] !== -1) continue
    const cluster = [i]
    assigned[i] = clusters.length
    for (let j = i + 1; j < documents.length; j++) {
      if (assigned[j] !== -1) continue
      if (jaccard(sets[i]!, sets[j]!) >= threshold) {
        cluster.push(j)
        assigned[j] = clusters.length
      }
    }
    clusters.push(cluster)
  }
  return clusters.map((idxs) => idxs.map((i) => documents[i]!))
}

export const LOCAL_NLP_CAPABILITIES: CapabilitySpec[] = [
  {
    id: 'named-entity-recognition',
    surface: surfaceFor('named-entity-recognition'),
    mode: 'local',
    run: (input) => {
      const text = str(input, 'text', '')
      if (!text) return fail('local', 'text is required for NER')
      const entities = extractEntities(text)
      return okLocal(`gazetteerNER entities=${entities.length}`, {
        score: entities.length,
        outputs: { entities },
      })
    },
  },
  {
    id: 'topic-classification',
    surface: surfaceFor('topic-classification'),
    mode: 'local',
    run: (input) => {
      const text = str(input, 'text', '')
      if (!text) return fail('local', 'text is required for topic classification')
      const { topic, score } = classifyTopic(text)
      return okLocal(`keywordTopic=${topic} score=${score.toFixed(3)}`, {
        score,
        outputs: { topic },
      })
    },
  },
  {
    id: 'sentiment-analysis',
    surface: surfaceFor('sentiment-analysis'),
    mode: 'local',
    run: (input) => {
      const text = str(input, 'text', '')
      if (!text) return fail('local', 'text is required for sentiment analysis')
      const { polarity, positive, negative } = sentimentOf(text)
      return okLocal(`lexiconSentiment=${polarity.toFixed(3)} pos=${positive} neg=${negative}`, {
        score: polarity,
      })
    },
  },
  {
    id: 'keyword-extraction',
    surface: surfaceFor('keyword-extraction'),
    mode: 'local',
    run: (input) => {
      const text = str(input, 'text', '')
      if (!text) return fail('local', 'text is required for keyword extraction')
      const keywords = extractKeywords(text)
      return okLocal(`keywords=${keywords.map((k) => k.term).join(',') || 'none'}`, {
        score: keywords.length,
        outputs: { keywords },
      })
    },
  },
  {
    id: 'topic-modeling-lda',
    surface: surfaceFor('topic-modeling-lda'),
    mode: 'local',
    run: (input) => {
      const documents = (input.documents as string[]) ?? []
      if (documents.length === 0)
        return fail('local', 'documents array is required for topic modeling')
      const topics = ldaLite(documents)
      return okLocal(`ldaLite topics=${topics.length}`, {
        score: topics.length,
        outputs: { topics },
      })
    },
  },
  {
    id: 'clustering',
    surface: surfaceFor('clustering'),
    mode: 'local',
    run: (input) => {
      const documents = (input.documents as string[]) ?? []
      if (documents.length === 0) return fail('local', 'documents array is required for clustering')
      const clusters = clusterDocuments(documents)
      return okLocal(`jaccardClusters=${clusters.length} docs=${documents.length}`, {
        score: clusters.length,
        outputs: { clusterSizes: clusters.map((c) => c.length) },
      })
    },
  },
  {
    id: 'semantic-search',
    surface: surfaceFor('semantic-search'),
    mode: 'adapter-disabled',
    run: (input) => {
      const query = str(input, 'query', '')
      const text = str(input, 'text', '')
      if (!query || !text)
        return fail('adapter-disabled', 'query and text are required for semantic search')
      const score = cosineSimilarity(embed(query), embed(text))
      return okAdapter(
        'adapter-disabled',
        `localSemanticCosine=${score.toFixed(3)} (no vector-DB vendor configured)`,
        {
          score,
        },
      )
    },
  },
]
