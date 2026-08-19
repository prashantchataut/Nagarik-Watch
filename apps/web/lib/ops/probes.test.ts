import { describe, expect, it } from 'vitest'
import { healthOverallStatus, isOriginReady } from './probes'

describe('health probes', () => {
  it('marks configuration warn as ok-soft, not all-green', () => {
    expect(
      healthOverallStatus({
        configuration: { status: 'warn', detail: 'soft-desk' },
        database: { status: 'pass', detail: 'ok' },
      }),
    ).toBe('ok-soft')
  })

  it('is degraded when any check fails', () => {
    expect(
      healthOverallStatus({
        configuration: { status: 'pass', detail: 'ok' },
        database: { status: 'fail', detail: 'down' },
      }),
    ).toBe('degraded')
  })

  it('is not ready when ops migrations are pending', () => {
    expect(
      isOriginReady({
        databaseOk: true,
        pendingMigrations: true,
        payloadRequired: false,
        payloadOk: false,
        configurationFail: false,
      }),
    ).toBe(false)
  })

  it('is ready when database is up, migrations applied, and payload is not required', () => {
    expect(
      isOriginReady({
        databaseOk: true,
        pendingMigrations: false,
        payloadRequired: false,
        payloadOk: false,
        configurationFail: false,
      }),
    ).toBe(true)
  })
})
