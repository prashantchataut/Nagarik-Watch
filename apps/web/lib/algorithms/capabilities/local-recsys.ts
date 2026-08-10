/**
 * Local recommender-systems capabilities without a dedicated production
 * library yet: matrix factorization (baseline-predictor heuristic),
 * embedding similarity (local hashing-trick vectors), and sequential
 * (Markov) next-item prediction.
 */
import type { CapabilitySpec } from '../types'
import { str, okLocal, okAdapter, fail } from '../handlers/utils'
import { textSimilarity } from '../product/local-embeddings'
import { surfaceFor } from './surface'

function baselinePredict(matrix: Record<string, Record<string, number>>, targetUser: string) {
  const users = Object.keys(matrix)
  const items = new Set<string>()
  for (const row of Object.values(matrix)) for (const item of Object.keys(row)) items.add(item)

  let total = 0
  let count = 0
  for (const row of Object.values(matrix)) {
    for (const v of Object.values(row)) {
      total += v
      count += 1
    }
  }
  const globalMean = count > 0 ? total / count : 0

  const userBias: Record<string, number> = {}
  for (const u of users) {
    const row = matrix[u] ?? {}
    const vals = Object.values(row)
    userBias[u] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length - globalMean : 0
  }

  const itemBias: Record<string, number> = {}
  for (const item of items) {
    const vals = users
      .map((u) => matrix[u]?.[item])
      .filter((v): v is number => typeof v === 'number')
    itemBias[item] =
      vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length - globalMean : 0
  }

  const seen = new Set(Object.keys(matrix[targetUser] ?? {}))
  const predictions = [...items]
    .filter((item) => !seen.has(item))
    .map((item) => ({
      item,
      predicted: globalMean + (userBias[targetUser] ?? 0) + (itemBias[item] ?? 0),
    }))
    .sort((a, b) => b.predicted - a.predicted)

  return { globalMean, predictions, itemCount: items.size, userCount: users.length }
}

function markovNext(history: string[]): {
  predicted: string | null
  probability: number
  states: number
} {
  if (history.length < 2) return { predicted: null, probability: 0, states: 0 }
  const transitions = new Map<string, Map<string, number>>()
  for (let i = 0; i < history.length - 1; i++) {
    const from = history[i]!
    const to = history[i + 1]!
    if (!transitions.has(from)) transitions.set(from, new Map())
    const row = transitions.get(from)!
    row.set(to, (row.get(to) ?? 0) + 1)
  }
  const last = history[history.length - 1]!
  const row = transitions.get(last)
  if (!row || row.size === 0) return { predicted: null, probability: 0, states: transitions.size }
  const total = [...row.values()].reduce((a, b) => a + b, 0)
  let bestTo: string | null = null
  let bestCount = 0
  for (const [to, count] of row) {
    if (count > bestCount) {
      bestCount = count
      bestTo = to
    }
  }
  return {
    predicted: bestTo,
    probability: total > 0 ? bestCount / total : 0,
    states: transitions.size,
  }
}

export const LOCAL_RECSYS_CAPABILITIES: CapabilitySpec[] = [
  {
    id: 'matrix-factorization',
    surface: surfaceFor('matrix-factorization'),
    mode: 'local',
    run: (input) => {
      const matrix = (input.matrix as Record<string, Record<string, number>>) ?? {}
      const targetUser = str(input, 'readerId', 'target')
      if (Object.keys(matrix).length === 0) {
        return fail('local', 'matrix input is empty', { detail: 'no rating matrix supplied' })
      }
      const { predictions, globalMean, itemCount, userCount } = baselinePredict(matrix, targetUser)
      const top = predictions[0]
      return okLocal(
        `baselinePredictor top=${top?.item ?? 'none'} score=${(top?.predicted ?? globalMean).toFixed(3)} users=${userCount} items=${itemCount}`,
        {
          score: top?.predicted ?? globalMean,
          outputs: { predictions: predictions.slice(0, 5) },
        },
      )
    },
  },
  {
    id: 'embedding-similarity',
    surface: surfaceFor('embedding-similarity'),
    mode: 'adapter-disabled',
    run: (input) => {
      const a = str(input, 'text', '')
      const b = str(input, 'other', '')
      if (!a || !b)
        return fail('adapter-disabled', 'text and other are both required for similarity')
      const score = textSimilarity(a, b)
      return okAdapter(
        'adapter-disabled',
        `localEmbeddingCosine=${score.toFixed(3)} (no vector-DB vendor configured)`,
        {
          score,
        },
      )
    },
  },
  {
    id: 'sequential-prediction',
    surface: surfaceFor('sequential-prediction'),
    mode: 'local',
    run: (input) => {
      const history = (input.history as string[]) ?? []
      const { predicted, probability, states } = markovNext(history)
      if (!predicted) {
        return fail('local', 'history too short to build a Markov transition table', {
          detail: `insufficient history (${history.length} events)`,
        })
      }
      return okLocal(`markovNext=${predicted} p=${probability.toFixed(3)} states=${states}`, {
        score: probability,
        outputs: { predicted },
      })
    },
  },
]
