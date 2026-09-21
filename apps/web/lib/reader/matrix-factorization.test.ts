import { describe, expect, it } from 'vitest'
import {
  MF_MIN_READERS,
  factorizeInteractions,
  factorizedScores,
  foldInReader,
} from './matrix-factorization'
import type { InteractionMatrix } from '../engagement/interaction-matrix'

/**
 * Two reader cohorts with disjoint reading: politics readers p0..p11 read
 * pol-0..pol-5, sports readers s0..s11 read spo-0..spo-5. Nobody reads across.
 * A cohort member who has not seen `pol-5` should still be scored toward it.
 */
function cohortMatrix(readersPerCohort = MF_MIN_READERS): InteractionMatrix {
  const matrix: InteractionMatrix = {}
  for (let reader = 0; reader < readersPerCohort; reader += 1) {
    const politics: Record<string, number> = {}
    const sports: Record<string, number> = {}
    for (let item = 0; item < 6; item += 1) {
      // Every politics reader skips one story, a different one each time, so
      // the held-out pair below is not special-cased by the fit.
      if (item !== reader % 6) politics[`pol-${item}`] = 3
      if (item !== reader % 6) sports[`spo-${item}`] = 3
    }
    matrix[`p${reader}`] = politics
    matrix[`s${reader}`] = sports
  }
  return matrix
}

describe('factorizeInteractions', () => {
  it('refuses to fit below the volume floor', () => {
    const thin: InteractionMatrix = {}
    for (let reader = 0; reader < MF_MIN_READERS - 1; reader += 1) {
      thin[`r${reader}`] = { 'a-1': 1, 'a-2': 1, 'a-3': 1 }
    }
    expect(factorizeInteractions(thin)).toBeNull()
  })

  it('ignores a matrix with too few distinct articles', () => {
    const narrow: InteractionMatrix = {}
    for (let reader = 0; reader < MF_MIN_READERS + 4; reader += 1) {
      narrow[`r${reader}`] = { 'a-1': 1, 'a-2': 1 }
    }
    expect(factorizeInteractions(narrow)).toBeNull()
  })

  it('learns cohort taste and scores the unread story of the right cohort higher', () => {
    const model = factorizeInteractions(cohortMatrix())
    expect(model).not.toBeNull()
    if (!model) return

    // p0 skipped pol-0. Score it against its own unread story and the sports
    // cohort's stories, none of which it has read either.
    const scores = factorizedScores(model, model.readers.get('p0'), [
      'pol-0',
      'spo-0',
      'spo-1',
      'spo-2',
    ])
    const politics = scores.get('pol-0') ?? 0
    const sports = Math.max(scores.get('spo-0') ?? 0, scores.get('spo-1') ?? 0)
    expect(politics).toBeGreaterThan(sports)
  })

  it('is deterministic for the same matrix', () => {
    const first = factorizeInteractions(cohortMatrix())
    const second = factorizeInteractions(cohortMatrix())
    expect([...(first?.readers.get('p3') ?? [])]).toEqual([...(second?.readers.get('p3') ?? [])])
  })

  it('folds a reader it never saw into the fitted item space', () => {
    const model = factorizeInteractions(cohortMatrix())
    expect(model).not.toBeNull()
    if (!model) return

    const newcomer = foldInReader(model, { 'pol-1': 4, 'pol-2': 2 })
    const scores = factorizedScores(model, newcomer, ['pol-4', 'spo-4'])
    expect(scores.get('pol-4') ?? 0).toBeGreaterThan(scores.get('spo-4') ?? 0)
  })

  it('has nothing to say about a reader with no history', () => {
    const model = factorizeInteractions(cohortMatrix())
    if (!model) throw new Error('model expected')
    expect([...foldInReader(model, {})]).toEqual(Array(model.factors).fill(0))
    expect(factorizedScores(model, undefined, ['pol-1']).size).toBe(0)
  })
})
