import 'server-only'
import type { ExperimentDefinition } from './core'
import { parseExperimentDefinitions } from './definition-parser'
import { listHouseAdExperimentPlacementKeys, houseAdExperimentId } from '@/lib/house-ads'

export { parseExperimentDefinitions } from './definition-parser'

/** Built-in house-ad A/B shells — AdSlot only records when the placement has a challenger. */
function builtinHouseAdExperiments(): ExperimentDefinition[] {
  return listHouseAdExperimentPlacementKeys().map((key) => ({
    id: houseAdExperimentId(key),
    label: `House ad A/B · ${key}`,
    status: 'active' as const,
    variants: [
      { id: 'control', label: 'Control', weight: 1 },
      { id: 'challenger', label: 'Challenger', weight: 1 },
    ],
    primaryMetric: 'click',
    minimumExposuresPerVariant: 40,
    winnerProbability: 0.95,
  }))
}

export function getExperimentDefinitions(): ExperimentDefinition[] {
  const fromEnv = parseExperimentDefinitions(process.env.EXPERIMENTS_JSON)
  const builtins = builtinHouseAdExperiments()
  const seen = new Set(fromEnv.map((definition) => definition.id))
  return [...fromEnv, ...builtins.filter((definition) => !seen.has(definition.id))]
}

export function getExperimentDefinition(id: string): ExperimentDefinition | null {
  return getExperimentDefinitions().find((definition) => definition.id === id) ?? null
}
