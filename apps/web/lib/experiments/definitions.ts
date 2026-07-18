import 'server-only'
import type { ExperimentDefinition } from './core'
import { parseExperimentDefinitions } from './definition-parser'

export { parseExperimentDefinitions } from './definition-parser'

export function getExperimentDefinitions(): ExperimentDefinition[] {
  return parseExperimentDefinitions(process.env.EXPERIMENTS_JSON)
}

export function getExperimentDefinition(id: string): ExperimentDefinition | null {
  return getExperimentDefinitions().find((definition) => definition.id === id) ?? null
}

