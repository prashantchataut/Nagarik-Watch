/**
 * Liveness vs readiness semantics for /api/health and the launch gate.
 * Liveness: the Node process can answer. Readiness: traffic should stay on this instance.
 */
export type ProbeCheckStatus = 'pass' | 'fail' | 'skip' | 'warn'

export type ProbeCheck = {
  status: ProbeCheckStatus
  detail: string
  latencyMs?: number
}

export type HealthOverall = 'ok' | 'ok-soft' | 'degraded'

export function healthOverallStatus(checks: Record<string, ProbeCheck>): HealthOverall {
  const failed = Object.values(checks).some((check) => check.status === 'fail')
  if (failed) return 'degraded'
  if (checks.configuration?.status === 'warn') return 'ok-soft'
  return 'ok'
}

export function isOriginReady(input: {
  databaseOk: boolean
  pendingMigrations: boolean
  payloadRequired: boolean
  payloadOk: boolean
  configurationFail: boolean
}): boolean {
  if (input.configurationFail) return false
  if (!input.databaseOk) return false
  if (input.pendingMigrations) return false
  if (input.payloadRequired && !input.payloadOk) return false
  return true
}
