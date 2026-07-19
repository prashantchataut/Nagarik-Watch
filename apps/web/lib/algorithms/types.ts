/**
 * Capability-contract types for the algorithm runtime.
 *
 * Every catalog id resolves to a `CapabilitySpec` whose `run` function
 * returns an honest `CapabilityResult` — `ok` can be `false`, and a
 * `reason` is required whenever it is.
 */

export type AlgorithmMode = 'production' | 'local' | 'adapter-ready' | 'adapter-disabled'

export type CapabilityResult = {
  ok: boolean
  mode: AlgorithmMode
  score?: number
  detail: string
  outputs?: Record<string, unknown>
  surface?: string
  /** Required when ok:false — explains why the capability could not complete honestly. */
  reason?: string
}

export type CapabilityHandler = (input: Record<string, unknown>) => CapabilityResult

export type CapabilitySpec = {
  id: string
  surface: string
  mode: AlgorithmMode
  run: CapabilityHandler
}
