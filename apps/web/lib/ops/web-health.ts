import { getEmailProviderState } from '@/lib/email-provider'
import { getOperationalPool, operationalStorageMode } from '@/lib/ops-db'
import { probeDatabase } from '@/lib/db-url'
import { getOpsMigrationStatus } from '@/lib/ops-migrations'
import { getPoolConnectionState } from '@/lib/pg-pool'
import {
  isPayloadCanonical,
  isPayloadSourceMisconfigured,
  payloadServerUrl,
} from '@/lib/content/payload-admin-client'
import { healthOverallStatus, isOriginReady, type ProbeCheck } from '@/lib/ops/probes'

export type WebHealthSnapshot = {
  status: 'ok' | 'ok-soft' | 'degraded'
  ready: boolean
  live: true
  service: 'nagarik-watch-web'
  contentMode: 'payload' | 'misconfigured' | 'soft-desk'
  launchStatus: string
  commit?: string
  checkedAt: string
  checks: Record<string, ProbeCheck>
}

function launchStatus(): string {
  return (process.env.NEXT_PUBLIC_LAUNCH_STATUS?.trim() || 'preview').toLowerCase()
}

function configurationCheck(contentSource: string, storage: string): ProbeCheck {
  if (isPayloadSourceMisconfigured()) {
    const hasPayloadUrl = Boolean(
      process.env.PAYLOAD_PUBLIC_SERVER_URL?.trim() || process.env.PAYLOAD_ADMIN_URL?.trim(),
    )
    return {
      status: 'fail',
      detail: hasPayloadUrl
        ? `launch=${launchStatus()} requires CONTENT_SOURCE=payload; got content=${contentSource}; shadow-store writes are blocked`
        : `content=${contentSource}; storage=${storage}; Payload URL missing (fail-closed)`,
    }
  }

  const status = launchStatus()
  if (status === 'live' && contentSource !== 'payload') {
    return {
      status: 'fail',
      detail: `launch=live requires CONTENT_SOURCE=payload; got content=${contentSource}; storage=${storage}`,
    }
  }

  if (contentSource === 'payload') {
    return {
      status: 'pass',
      detail: `mode=hard; content=payload; storage=${storage}; launch=${status}`,
    }
  }

  if (process.env.NODE_ENV === 'production' && storage !== 'postgres') {
    return {
      status: 'fail',
      detail: `content=${contentSource}; storage=${storage}; production requires Postgres`,
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return {
      status: 'warn',
      detail: `mode=soft-desk; content=${contentSource || 'json'}; storage=${storage}; launch=${status}; Payload cutover pending (ADR-014)`,
    }
  }

  return {
    status: 'pass',
    detail: `mode=dev; content=${contentSource || 'json'}; storage=${storage}`,
  }
}

async function timed(name: string, fn: () => Promise<string>): Promise<[string, ProbeCheck]> {
  const started = Date.now()
  try {
    const detail = await fn()
    return [name, { status: 'pass', detail, latencyMs: Date.now() - started }]
  } catch (error) {
    console.error(`[health] ${name} check failed`, error)
    const message = error instanceof Error ? error.message : String(error)
    return [
      name,
      {
        status: 'fail',
        detail: `${name} check failed: ${message.slice(0, 180)}`,
        latencyMs: Date.now() - started,
      },
    ]
  }
}

export async function collectWebHealth(): Promise<WebHealthSnapshot> {
  const contentSource =
    process.env.CONTENT_SOURCE?.trim() || process.env.PAYLOAD_CONTENT_SOURCE?.trim() || 'json'
  const checks: Record<string, ProbeCheck> = {}
  checks.configuration = configurationCheck(contentSource, operationalStorageMode())

  const databasePromise: Promise<[string, ProbeCheck]> =
    operationalStorageMode() === 'postgres'
      ? (async () => {
          const started = Date.now()
          const probe = await probeDatabase()
          return [
            'database',
            {
              status: probe.ok ? 'pass' : 'fail',
              detail: probe.detail,
              latencyMs: Date.now() - started,
            } satisfies ProbeCheck,
          ]
        })()
      : operationalStorageMode() === 'pglite'
        ? timed('database', async () => {
            const pool = await getOperationalPool()
            if (!pool) throw new Error('PGlite pool is unavailable')
            await pool.query('SELECT 1 AS ok')
            return 'PGlite reachable'
          })
        : Promise.resolve([
            'database',
            {
              status: process.env.NODE_ENV === 'production' ? 'fail' : 'skip',
              detail: 'Development memory storage',
            } satisfies ProbeCheck,
          ])

  const payloadRequired = isPayloadCanonical() || contentSource === 'payload'
  const payloadPromise: Promise<[string, ProbeCheck]> = payloadRequired
    ? timed('payload', async () => {
        const response = await fetch(`${payloadServerUrl()}/api/articles?limit=1&depth=0`, {
          headers: { accept: 'application/json' },
          cache: 'no-store',
          signal: AbortSignal.timeout(4_000),
        })
        if (!response.ok) throw new Error(`Payload returned ${response.status}`)
        return 'Payload public API reachable'
      })
    : Promise.resolve([
        'payload',
        { status: 'skip', detail: 'Payload source not selected (soft desk)' } satisfies ProbeCheck,
      ])

  const migrationsPromise = getOpsMigrationStatus()
    .then((ops) => {
      return [
        'migrations',
        {
          status:
            ops.storage === 'unavailable'
              ? process.env.NODE_ENV === 'production'
                ? 'fail'
                : 'warn'
              : ops.pending.length > 0
                ? process.env.NODE_ENV === 'production'
                  ? 'fail'
                  : 'warn'
                : 'pass',
          detail:
            ops.storage === 'unavailable'
              ? 'Ops migration storage unavailable'
              : ops.pending.length > 0
                ? `Pending ops migrations: ${ops.pending.join(', ')}`
                : `${ops.applied.length} ops migrations applied`,
        } satisfies ProbeCheck,
      ] as const
    })
    .catch(
      (error) =>
        [
          'migrations',
          {
            status: process.env.NODE_ENV === 'production' ? 'fail' : 'warn',
            detail: `Ops migration probe failed: ${error instanceof Error ? error.message : String(error)}`,
          } satisfies ProbeCheck,
        ] as const,
    )

  const [databaseResult, payloadResult, migrationsResult] = await Promise.all([
    databasePromise,
    payloadPromise,
    migrationsPromise,
  ])
  checks[databaseResult[0]] = databaseResult[1]
  checks[payloadResult[0]] = payloadResult[1]
  checks[migrationsResult[0]] = migrationsResult[1]

  const poolState = getPoolConnectionState()
  checks.pool = {
    status: poolState.connected ? 'pass' : poolState.coolingDown ? 'warn' : 'skip',
    detail: poolState.connected
      ? 'Shared Postgres pool is connected (max 1 per instance)'
      : poolState.lastError
        ? `Pool unavailable: ${poolState.lastError.message.slice(0, 160)}`
        : 'Shared pool has not been created in this isolate yet',
  }

  const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim())
  const hasR2PublicBase = Boolean(
    process.env.STORAGE_PUBLIC_BASE_URL?.trim() || process.env.R2_PUBLIC_BASE_URL?.trim(),
  )
  checks.mediaStorage = isPayloadCanonical()
    ? {
        status: 'skip',
        detail: 'Editorial media is owned by the Payload deployment in canonical mode',
      }
    : hasBlob || (process.env.CF_WORKERS === '1' && hasR2PublicBase)
      ? { status: 'pass', detail: hasBlob ? 'Vercel Blob configured' : 'Cloudflare R2 configured' }
      : {
          status: process.env.NODE_ENV === 'production' ? 'fail' : 'warn',
          detail: 'No durable media provider is configured for the web desk',
        }

  const email = getEmailProviderState()
  checks.email = {
    status: email.ready ? 'pass' : 'skip',
    detail: email.detail,
  }

  const overall = healthOverallStatus(checks)
  const ready = isOriginReady({
    databaseOk: checks.database?.status === 'pass',
    pendingMigrations: checks.migrations?.status === 'fail',
    payloadRequired,
    payloadOk: checks.payload?.status === 'pass',
    configurationFail: checks.configuration?.status === 'fail',
  })

  return {
    status: overall,
    ready,
    live: true,
    service: 'nagarik-watch-web',
    contentMode: isPayloadCanonical()
      ? 'payload'
      : isPayloadSourceMisconfigured()
        ? 'misconfigured'
        : 'soft-desk',
    launchStatus: launchStatus(),
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || undefined,
    checkedAt: new Date().toISOString(),
    checks,
  }
}
