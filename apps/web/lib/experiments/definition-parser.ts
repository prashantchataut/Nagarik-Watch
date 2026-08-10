import type { ExperimentDefinition, ExperimentVariant } from './core'

function cleanVariants(value: unknown): ExperimentVariant[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const variants: ExperimentVariant[] = []
  for (const candidate of value) {
    if (!candidate || typeof candidate !== 'object') continue
    const row = candidate as Record<string, unknown>
    const id = String(row.id ?? '')
      .trim()
      .slice(0, 80)
    const label = String(row.label ?? id)
      .trim()
      .slice(0, 120)
    const weight = Number(row.weight)
    if (!id || seen.has(id) || !Number.isFinite(weight) || weight <= 0) continue
    seen.add(id)
    variants.push({ id, label: label || id, weight })
  }
  return variants.slice(0, 8)
}

export function parseExperimentDefinitions(raw: string | undefined): ExperimentDefinition[] {
  if (!raw?.trim()) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  const seen = new Set<string>()
  const definitions: ExperimentDefinition[] = []
  for (const candidate of parsed) {
    if (!candidate || typeof candidate !== 'object') continue
    const row = candidate as Record<string, unknown>
    const id = String(row.id ?? '')
      .trim()
      .slice(0, 80)
    const variants = cleanVariants(row.variants)
    const status = row.status
    if (
      !id ||
      seen.has(id) ||
      variants.length < 2 ||
      (status !== 'draft' && status !== 'active' && status !== 'paused' && status !== 'completed')
    ) {
      continue
    }
    seen.add(id)
    definitions.push({
      id,
      label:
        String(row.label ?? id)
          .trim()
          .slice(0, 140) || id,
      status,
      variants,
      primaryMetric: String(row.primaryMetric ?? 'conversion')
        .trim()
        .slice(0, 80),
      minimumExposuresPerVariant: Math.max(
        20,
        Math.min(1_000_000, Math.floor(Number(row.minimumExposuresPerVariant) || 200)),
      ),
      winnerProbability: Math.max(0.8, Math.min(0.999, Number(row.winnerProbability) || 0.95)),
    })
  }
  return definitions.slice(0, 30)
}
