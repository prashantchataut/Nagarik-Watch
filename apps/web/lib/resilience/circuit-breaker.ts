export type CircuitState = 'closed' | 'open' | 'half-open'

export type CircuitBreakerOptions = {
  failureThreshold?: number
  successThreshold?: number
  resetTimeoutMs?: number
}

type ResolvedCircuitBreakerOptions = Required<CircuitBreakerOptions>

type CircuitRecord = {
  state: CircuitState
  failures: number
  successes: number
  openedAt: number | null
  halfOpenProbeInFlight: boolean
  options: ResolvedCircuitBreakerOptions
}

const DEFAULT_OPTIONS: ResolvedCircuitBreakerOptions = {
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeoutMs: 30_000,
}

const circuits = new Map<string, CircuitRecord>()

export class CircuitOpenError extends Error {
  readonly circuitName: string

  constructor(circuitName: string) {
    super(`Circuit "${circuitName}" is open`)
    this.name = 'CircuitOpenError'
    this.circuitName = circuitName
  }
}

function resolveOptions(options?: CircuitBreakerOptions): ResolvedCircuitBreakerOptions {
  const resolved = { ...DEFAULT_OPTIONS, ...options }
  if (!Number.isInteger(resolved.failureThreshold) || resolved.failureThreshold < 1) {
    throw new RangeError('failureThreshold must be a positive integer')
  }
  if (!Number.isInteger(resolved.successThreshold) || resolved.successThreshold < 1) {
    throw new RangeError('successThreshold must be a positive integer')
  }
  if (!Number.isFinite(resolved.resetTimeoutMs) || resolved.resetTimeoutMs < 0) {
    throw new RangeError('resetTimeoutMs must be a non-negative number')
  }
  return resolved
}

function getOrCreateCircuit(name: string, options?: CircuitBreakerOptions): CircuitRecord {
  if (!name.trim()) throw new TypeError('Circuit name must not be empty')

  const existing = circuits.get(name)
  if (existing) {
    if (options) existing.options = resolveOptions({ ...existing.options, ...options })
    return existing
  }

  const circuit: CircuitRecord = {
    state: 'closed',
    failures: 0,
    successes: 0,
    openedAt: null,
    halfOpenProbeInFlight: false,
    options: resolveOptions(options),
  }
  circuits.set(name, circuit)
  return circuit
}

function transitionExpiredCircuit(circuit: CircuitRecord, now = Date.now()): void {
  if (
    circuit.state === 'open' &&
    circuit.openedAt !== null &&
    now - circuit.openedAt >= circuit.options.resetTimeoutMs
  ) {
    circuit.state = 'half-open'
    circuit.failures = 0
    circuit.successes = 0
    circuit.halfOpenProbeInFlight = false
  }
}

export function getCircuitState(
  name: string,
  options?: CircuitBreakerOptions,
): CircuitState {
  const circuit = getOrCreateCircuit(name, options)
  transitionExpiredCircuit(circuit)
  return circuit.state
}

export function recordSuccess(
  name: string,
  options?: CircuitBreakerOptions,
): CircuitState {
  const circuit = getOrCreateCircuit(name, options)
  transitionExpiredCircuit(circuit)

  if (circuit.state === 'closed') {
    circuit.failures = 0
  } else if (circuit.state === 'half-open') {
    circuit.successes += 1
    if (circuit.successes >= circuit.options.successThreshold) {
      circuit.state = 'closed'
      circuit.failures = 0
      circuit.successes = 0
      circuit.openedAt = null
    }
  }

  return circuit.state
}

export function recordFailure(
  name: string,
  options?: CircuitBreakerOptions,
): CircuitState {
  const circuit = getOrCreateCircuit(name, options)
  transitionExpiredCircuit(circuit)

  if (circuit.state === 'half-open') {
    circuit.state = 'open'
    circuit.failures = circuit.options.failureThreshold
    circuit.successes = 0
    circuit.openedAt = Date.now()
  } else if (circuit.state === 'closed') {
    circuit.failures += 1
    if (circuit.failures >= circuit.options.failureThreshold) {
      circuit.state = 'open'
      circuit.successes = 0
      circuit.openedAt = Date.now()
    }
  }

  return circuit.state
}

export function resetCircuit(name?: string): void {
  if (name === undefined) {
    circuits.clear()
    return
  }
  circuits.delete(name)
}

export async function execCircuit<T>(
  name: string,
  fn: () => Promise<T> | T,
  options?: CircuitBreakerOptions,
): Promise<T> {
  const circuit = getOrCreateCircuit(name, options)
  transitionExpiredCircuit(circuit)

  if (circuit.state === 'open' || circuit.halfOpenProbeInFlight) {
    throw new CircuitOpenError(name)
  }

  const isHalfOpenProbe = circuit.state === 'half-open'
  if (isHalfOpenProbe) circuit.halfOpenProbeInFlight = true

  try {
    const value = await fn()
    recordSuccess(name)
    return value
  } catch (error) {
    recordFailure(name)
    throw error
  } finally {
    if (isHalfOpenProbe) circuit.halfOpenProbeInFlight = false
  }
}
