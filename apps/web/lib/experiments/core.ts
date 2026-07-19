export type ExperimentVariant = {
  id: string
  label: string
  weight: number
}

export type ExperimentDefinition = {
  id: string
  label: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  variants: ExperimentVariant[]
  primaryMetric: string
  minimumExposuresPerVariant: number
  winnerProbability: number
}

export type VariantObservation = {
  variantId: string
  exposures: number
  conversions: number
}

export type BayesianVariantResult = VariantObservation & {
  posteriorAlpha: number
  posteriorBeta: number
  posteriorMean: number
  probabilityBest: number
}

export type ExperimentAnalysis = {
  variants: BayesianVariantResult[]
  winner: string | null
  decision: 'insufficient-data' | 'continue' | 'winner'
}

export type SequentialTestResult = {
  controlVariantId: string
  treatmentVariantId: string
  z: number
  decisive: boolean
  leadingVariantId: string | null
}

export type ExperimentAnalysisWithModes = ExperimentAnalysis & {
  /** Two-sided z-test on the first two variants; null unless exactly two exist. */
  sequential: SequentialTestResult | null
}

const DEFAULT_ALPHA = 1
const DEFAULT_BETA = 1

function fnv1a(value: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

function normalizedVariants(variants: ExperimentVariant[]): ExperimentVariant[] {
  return variants.filter(
    (variant) =>
      Boolean(variant.id.trim()) && Number.isFinite(variant.weight) && variant.weight > 0,
  )
}

/** Stable assignment: the same visitor + experiment always receives one weighted variant. */
export function assignVariant(
  experimentId: string,
  visitorKey: string,
  variants: ExperimentVariant[],
): ExperimentVariant | null {
  const eligible = normalizedVariants(variants)
  if (!experimentId.trim() || !visitorKey.trim() || eligible.length === 0) return null
  const totalWeight = eligible.reduce((sum, variant) => sum + variant.weight, 0)
  const bucket = (fnv1a(`${experimentId}:${visitorKey}`) / 0x1_0000_0000) * totalWeight
  let cursor = 0
  for (const variant of eligible) {
    cursor += variant.weight
    if (bucket < cursor) return variant
  }
  return eligible[eligible.length - 1] ?? null
}

export function posteriorFor(
  observation: VariantObservation,
  priorAlpha = DEFAULT_ALPHA,
  priorBeta = DEFAULT_BETA,
): Omit<BayesianVariantResult, 'probabilityBest'> {
  const exposures = Math.max(0, Math.floor(observation.exposures))
  const conversions = Math.min(exposures, Math.max(0, Math.floor(observation.conversions)))
  const posteriorAlpha = Math.max(0.001, priorAlpha) + conversions
  const posteriorBeta = Math.max(0.001, priorBeta) + exposures - conversions
  return {
    variantId: observation.variantId,
    exposures,
    conversions,
    posteriorAlpha,
    posteriorBeta,
    posteriorMean: posteriorAlpha / (posteriorAlpha + posteriorBeta),
  }
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 0x1_0000_0000
  }
}

/** Marsaglia–Tsang gamma sampler, used for deterministic beta posterior simulation. */
function sampleGamma(shape: number, random: () => number): number {
  if (shape < 1) {
    const u = Math.max(Number.EPSILON, random())
    return sampleGamma(shape + 1, random) * Math.pow(u, 1 / shape)
  }
  const d = shape - 1 / 3
  const c = 1 / Math.sqrt(9 * d)
  for (;;) {
    let x: number
    let v: number
    do {
      const u1 = Math.max(Number.EPSILON, random())
      const u2 = random()
      x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      v = 1 + c * x
    } while (v <= 0)
    v *= v * v
    const u = random()
    if (u < 1 - 0.0331 * x * x * x * x) return d * v
    if (Math.log(Math.max(Number.EPSILON, u)) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
      return d * v
    }
  }
}

function sampleBeta(alpha: number, beta: number, random: () => number): number {
  const x = sampleGamma(alpha, random)
  const y = sampleGamma(beta, random)
  return x / Math.max(Number.EPSILON, x + y)
}

export function analyzeExperiment(
  definition: Pick<
    ExperimentDefinition,
    'id' | 'variants' | 'minimumExposuresPerVariant' | 'winnerProbability'
  >,
  observations: VariantObservation[],
  simulations = 8_000,
): ExperimentAnalysis {
  const byVariant = new Map(observations.map((item) => [item.variantId, item]))
  const posteriors = definition.variants.map((variant) =>
    posteriorFor(
      byVariant.get(variant.id) ?? {
        variantId: variant.id,
        exposures: 0,
        conversions: 0,
      },
    ),
  )
  if (posteriors.length === 0) {
    return { variants: [], winner: null, decision: 'insufficient-data' }
  }

  const wins = new Array<number>(posteriors.length).fill(0)
  const random = mulberry32(fnv1a(definition.id || 'experiment'))
  const sampleCount = Math.max(500, Math.min(50_000, Math.floor(simulations)))
  for (let sample = 0; sample < sampleCount; sample += 1) {
    let bestIndex = 0
    let bestValue = -1
    for (let index = 0; index < posteriors.length; index += 1) {
      const posterior = posteriors[index]
      if (!posterior) continue
      const value = sampleBeta(posterior.posteriorAlpha, posterior.posteriorBeta, random)
      if (value > bestValue) {
        bestIndex = index
        bestValue = value
      }
    }
    wins[bestIndex] = (wins[bestIndex] ?? 0) + 1
  }

  const variants: BayesianVariantResult[] = posteriors.map((posterior, index) => ({
    ...posterior,
    probabilityBest: (wins[index] ?? 0) / sampleCount,
  }))
  const best = [...variants].sort(
    (a, b) => b.probabilityBest - a.probabilityBest || b.posteriorMean - a.posteriorMean,
  )[0]
  const enoughData = variants.every(
    (variant) => variant.exposures >= Math.max(1, definition.minimumExposuresPerVariant),
  )
  const hasWinner =
    enoughData && (best?.probabilityBest ?? 0) >= definition.winnerProbability

  return {
    variants,
    winner: hasWinner ? (best?.variantId ?? null) : null,
    decision: !enoughData ? 'insufficient-data' : hasWinner ? 'winner' : 'continue',
  }
}

/**
 * Two-proportion z-test (frequentist sequential monitoring). This is a
 * classic, honest supplement to the Bayesian decision above — it does not
 * apply alpha-spending correction for repeated looks, so callers should treat
 * `decisive` as directional evidence, not a formal stopping rule.
 */
export function sequentialZTest(
  control: VariantObservation,
  treatment: VariantObservation,
  zThreshold = 1.96,
): SequentialTestResult {
  const controlExposures = Math.max(0, Math.floor(control.exposures))
  const treatmentExposures = Math.max(0, Math.floor(treatment.exposures))
  const controlConversions = Math.min(controlExposures, Math.max(0, Math.floor(control.conversions)))
  const treatmentConversions = Math.min(
    treatmentExposures,
    Math.max(0, Math.floor(treatment.conversions)),
  )
  const rateControl = controlExposures > 0 ? controlConversions / controlExposures : 0
  const rateTreatment = treatmentExposures > 0 ? treatmentConversions / treatmentExposures : 0
  const pooled =
    (controlConversions + treatmentConversions) / Math.max(1, controlExposures + treatmentExposures)
  const standardError =
    Math.sqrt(
      pooled * (1 - pooled) * (1 / Math.max(1, controlExposures) + 1 / Math.max(1, treatmentExposures)),
    ) || 1
  const z = (rateTreatment - rateControl) / standardError
  const decisive = controlExposures > 0 && treatmentExposures > 0 && Math.abs(z) >= zThreshold

  return {
    controlVariantId: control.variantId,
    treatmentVariantId: treatment.variantId,
    z,
    decisive,
    leadingVariantId: decisive ? (z > 0 ? treatment.variantId : control.variantId) : null,
  }
}

/**
 * Runs both analysis modes against the same observations: the Bayesian
 * posterior/probability-of-best decision already used by the admin page, plus
 * a frequentist sequential z-test when the experiment has exactly two
 * variants (the shape the z-test requires). Single source of truth so the
 * admin page and any capability handler agree on one implementation.
 */
export function analyzeWithModes(
  definition: Pick<
    ExperimentDefinition,
    'id' | 'variants' | 'minimumExposuresPerVariant' | 'winnerProbability'
  >,
  observations: VariantObservation[],
  simulations = 8_000,
): ExperimentAnalysisWithModes {
  const bayesian = analyzeExperiment(definition, observations, simulations)
  const [first, second] = definition.variants

  let sequential: SequentialTestResult | null = null
  if (first && second && definition.variants.length === 2) {
    const byVariant = new Map(observations.map((item) => [item.variantId, item]))
    const control = byVariant.get(first.id) ?? {
      variantId: first.id,
      exposures: 0,
      conversions: 0,
    }
    const treatment = byVariant.get(second.id) ?? {
      variantId: second.id,
      exposures: 0,
      conversions: 0,
    }
    sequential = sequentialZTest(control, treatment)
  }

  return { ...bayesian, sequential }
}

