import 'server-only'
import type { PoolConfig } from 'pg'

/**
 * Resolve the Postgres URL used by auth and operational stores.
 * Accepts common Vercel/Neon aliases so a renamed env still boots.
 */
export function resolveDatabaseUrl(): string | undefined {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.NEON_DATABASE_URL,
  ]
  for (const candidate of candidates) {
    const value = candidate?.trim()
    if (value && /^postgres(?:ql)?:\/\//i.test(value)) return value
  }
  return undefined
}

export function databaseHostHint(url = resolveDatabaseUrl()): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }
}

/**
 * Aiven ships a CA that Node's newer pg treats as verify-full when the URL
 * contains sslmode=require. That rejects with "self-signed certificate in
 * certificate chain" unless we both (1) neutralize sslmode on the URL and
 * (2) pass ssl.rejectUnauthorized=false.
 */
export function shouldRelaxPostgresSsl(url = resolveDatabaseUrl()): boolean {
  if (!url) return false
  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true') return false
  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false') return true
  const host = hostOf(url)
  return Boolean(host && (host.endsWith('.aivencloud.com') || host.endsWith('.aiven.io')))
}

/** Strip sslmode / ssl query flags without mangling password special chars via URL(). */
function stripSslQueryParams(url: string): string {
  const question = url.indexOf('?')
  if (question < 0) return url
  const base = url.slice(0, question)
  const query = url.slice(question + 1)
  if (!query) return base
  const kept = query
    .split('&')
    .filter((part) => {
      const key = part.split('=', 1)[0]?.toLowerCase()
      return key !== 'sslmode' && key !== 'ssl' && key !== 'uselibpqcompat'
    })
    .filter(Boolean)
  return kept.length ? `${base}?${kept.join('&')}` : base
}

export function normalizeDatabaseUrl(url: string): string {
  if (!shouldRelaxPostgresSsl(url)) return url
  const cleaned = stripSslQueryParams(url)
  const join = cleaned.includes('?') ? '&' : '?'
  // no-verify is the explicit "encrypt but don't validate CA" mode in modern pg.
  return `${cleaned}${join}sslmode=no-verify`
}

export function postgresSslConfig(url = resolveDatabaseUrl()): PoolConfig['ssl'] {
  if (!url || !shouldRelaxPostgresSsl(url)) return undefined
  return { rejectUnauthorized: false }
}

export function postgresPoolConfig(
  overrides: Omit<PoolConfig, 'connectionString' | 'ssl'> & { connectionString?: string } = {},
): PoolConfig | null {
  const raw = overrides.connectionString?.trim() || resolveDatabaseUrl()
  if (!raw) return null
  const connectionString = normalizeDatabaseUrl(raw)
  const { connectionString: _ignored, ...rest } = overrides
  return {
    connectionString,
    ssl: postgresSslConfig(raw),
    max: Number(process.env.NW_DB_POOL_MAX ?? 5),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ...rest,
  }
}

export type DatabaseProbe = {
  ok: boolean
  host: string | null
  detail: string
  code?: string
}

/** Lightweight reachability check for operator surfaces (admin login). */
export async function probeDatabase(): Promise<DatabaseProbe> {
  const url = resolveDatabaseUrl()
  const host = databaseHostHint(url)
  if (!url) {
    return {
      ok: false,
      host: null,
      detail: 'DATABASE_URL (or POSTGRES_URL) is not set in this deployment.',
      code: 'MISSING',
    }
  }

  try {
    const { Pool } = await import('pg')
    const config = postgresPoolConfig({
      connectionString: url,
      max: 1,
      connectionTimeoutMillis: 4_000,
      idleTimeoutMillis: 1_000,
    })
    if (!config) {
      return { ok: false, host, detail: 'DATABASE_URL is not set in this deployment.', code: 'MISSING' }
    }
    const pool = new Pool(config)
    try {
      await pool.query('SELECT 1 AS ok')
    } finally {
      await pool.end().catch(() => undefined)
    }
    return { ok: true, host, detail: 'Postgres is reachable.' }
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code?: unknown }).code ?? '')
        : ''
    const message = error instanceof Error ? error.message : String(error)

    if (code === 'ENOTFOUND') {
      return {
        ok: false,
        host,
        code,
        detail: host
          ? `DNS lookup failed for ${host}. The database host is not resolving yet.`
          : 'DNS lookup failed for DATABASE_URL host.',
      }
    }

    if (/self-signed certificate|certificate/i.test(message) || code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
      return {
        ok: false,
        host,
        code: 'SSL',
        detail: `Still failing TLS after relax (${message.slice(0, 120)}). Check Aiven "Public Access" and that DATABASE_URL password is current.`,
      }
    }

    return {
      ok: false,
      host,
      code: code || 'CONNECT',
      detail: `Postgres connection failed (${code || 'error'}): ${message.slice(0, 180)}`,
    }
  }
}
