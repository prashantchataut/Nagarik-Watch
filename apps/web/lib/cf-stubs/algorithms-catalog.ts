/** CF Workers Free stub — full catalog (~3k lines) exceeds the 3 MiB gzip Worker limit. */

export type AlgorithmStatus = 'live' | 'partial' | 'scaffold' | 'blocked' | 'planned'
export type AlgorithmCategory = string

export type AlgorithmEntry = {
  id: string
  name: string
  status: AlgorithmStatus
  category?: AlgorithmCategory
}

export const ALGORITHM_CATALOG: readonly AlgorithmEntry[] = []

export function algorithmsByStatus(_status: AlgorithmStatus): AlgorithmEntry[] {
  return []
}

export function algorithmsByCategory(_category: AlgorithmCategory): AlgorithmEntry[] {
  return []
}

export function rankAlgorithmsForShipping(_limit = 20): AlgorithmEntry[] {
  return []
}

export function algorithmCatalogStats() {
  return { total: 0, live: 0, partial: 0, scaffold: 0, blocked: 0, planned: 0 }
}

export function algorithmRoadmapNumberingStats() {
  return { total: 0 }
}

export const ACTIVE_ALGORITHM_REGISTRY: AlgorithmEntry[] = []
export const ALGORITHM_ROADMAP: string[] = []
