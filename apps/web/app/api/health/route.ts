import { NextResponse } from 'next/server'
import { getEmailProviderState } from '@/lib/email-provider'
import { getOperationalPool, operationalStorageMode } from '@/lib/ops-db'
import {
  isPayloadSourceMisconfigured,
  payloadServerUrl,
} from '@/lib/content/payload-admin-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Check = {
  status: 'pass' | 'fail' | 'skip'
  detail: string
  latencyMs?: number
}

async function timed(name: string, fn: () => Promise<string>): Promise<[string, Check]> {
  const started = Date.now()
  try {
    const detail = await fn()
    return [name, { status: 'pass', detail, latencyMs: Date.now() - started }]
  } catch (error) {
    console.error(`[health] ${name} check failed`, error)
    return [
      name,
      {
        status: 'fail',
        detail: `${name} check failed`,
        latencyMs: Date.now() - started,
      },
    ]
  }
}

function configurationCheck(contentSource: string, storage: string): Check {
  // Intentional desk path: json + Postgres is a valid production configuration.
  if (isPayloadSourceMisconfigured()) {
    return {
      status: 'fail',
      detail: `content=${contentSource}; storage=${storage}; Payload URL missing`,
    }
  }
  if (contentSource === 'payload') {
    return { status: 'pass', detail: `content=payload; storage=${storage}` }
  }
  if (process.env.NODE_ENV === 'production' && storage !== 'postgres') {
    return {
      status: 'fail',
      detail: `content=${contentSource}; storage=${storage}; production requires Postgres`,
    }
  }
  return {
    status: 'pass',
    detail: `content=${contentSource || 'json'}; storage=${storage}`,
  }
}

export async function GET() {
  const contentSource = process.env.CONTENT_SOURCE?.trim() || process.env.PAYLOAD_CONTENT_SOURCE?.trim() || 'json'
  const checks: Record<string, Check> = {}

  checks.configuration = configurationCheck(contentSource, operationalStorageMode())

  if (operationalStorageMode() === 'postgres' || operationalStorageMode() === 'pglite') {
    const [name, check] = await timed('database', async () => {
      const pool = await getOperationalPool()
      if (!pool) throw new Error('Operational database pool is unavailable')
      await pool.query('SELECT 1 AS ok')
      return operationalStorageMode() === 'pglite' ? 'PGlite reachable' : 'Postgres reachable'
    })
    checks[name] = check
  } else {
    checks.database = {
      status: process.env.NODE_ENV === 'production' ? 'fail' : 'skip',
      detail: 'Development memory storage',
    }
  }

  if (contentSource === 'payload') {
    const [name, check] = await timed('payload', async () => {
      const response = await fetch(`${payloadServerUrl()}/api/articles?limit=1&depth=0`, {
        headers: { accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(4_000),
      })
      if (!response.ok) throw new Error(`Payload returned ${response.status}`)
      return 'Payload public API reachable'
    })
    checks[name] = check
  } else {
    checks.payload = { status: 'skip', detail: 'Payload source not selected' }
  }

  const email = getEmailProviderState()
  checks.email = {
    status: email.ready ? 'pass' : 'skip',
    detail: email.detail,
  }

  const failed = Object.values(checks).some((check) => check.status === 'fail')
  return NextResponse.json(
    {
      status: failed ? 'degraded' : 'ok',
      service: 'nagarik-watch-web',
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || undefined,
      checkedAt: new Date().toISOString(),
      checks,
    },
    {
      status: failed ? 503 : 200,
      headers: { 'cache-control': 'no-store, max-age=0' },
    },
  )
}
