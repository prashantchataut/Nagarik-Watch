import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CircuitOpenError,
  execCircuit,
  getCircuitState,
  resetCircuit,
} from './circuit-breaker'

const options = {
  failureThreshold: 2,
  successThreshold: 1,
  resetTimeoutMs: 1_000,
}

describe('circuit breaker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-18T00:00:00Z'))
    resetCircuit()
  })

  afterEach(() => {
    vi.useRealTimers()
    resetCircuit()
  })

  it('opens after the configured number of failures', async () => {
    const failure = new Error('upstream failed')

    await expect(execCircuit('weather', () => Promise.reject(failure), options)).rejects.toBe(
      failure,
    )
    expect(getCircuitState('weather')).toBe('closed')

    await expect(execCircuit('weather', () => Promise.reject(failure), options)).rejects.toBe(
      failure,
    )
    expect(getCircuitState('weather')).toBe('open')
  })

  it('fails fast without calling the operation while open', async () => {
    const operation = vi.fn().mockRejectedValue(new Error('upstream failed'))

    await expect(execCircuit('forex', operation, options)).rejects.toThrow('upstream failed')
    await expect(execCircuit('forex', operation, options)).rejects.toThrow('upstream failed')
    await expect(execCircuit('forex', operation, options)).rejects.toBeInstanceOf(CircuitOpenError)

    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('moves to half-open after the timeout and closes after a successful probe', async () => {
    const failure = new Error('upstream failed')
    await expect(execCircuit('aqi', () => Promise.reject(failure), options)).rejects.toBe(failure)
    await expect(execCircuit('aqi', () => Promise.reject(failure), options)).rejects.toBe(failure)

    vi.advanceTimersByTime(options.resetTimeoutMs)
    expect(getCircuitState('aqi')).toBe('half-open')

    await expect(execCircuit('aqi', async () => 'recovered', options)).resolves.toBe('recovered')
    expect(getCircuitState('aqi')).toBe('closed')
  })
})
