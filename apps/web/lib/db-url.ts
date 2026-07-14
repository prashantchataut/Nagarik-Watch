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

/**
 * Aiven (and similar managed Postgres) presents a CA that Node's newer
 * `sslmode=require` → verify-full path rejects as "self-signed certificate in
 * certificate chain". Relax verification for those hosts unless the operator
 * explicitly opts into strict TLS via DATABASE_SSL_REJECT_UNAUTHORIZED=true.
 */
export function postgresSslConfig(url = resolveDatabaseUrl()): PoolConfig['ssl'] {
  if (!url) return undefined
  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true') return undefined
  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false') {
    return { rejectUnauthorized: false }
  }
  try {
    const host = new URL(url).hostname.toLowerCase()
    if (host.endsWith('.aivencloud.com') || host.endsWith('.aiven.io')) {
      return { rejectUnauthorized: false }
    }
  } catch {
    // Fall through — leave ssl undefined for malformed URLs.
  }
  return undefined
}

export function postgresPoolConfig(
  overrides: Omit<PoolConfig, 'connectionString' | 'ssl'> & { connectionString?: string } = {},
): PoolConfig | null {
  const connectionString = overrides.connectionString?.trim() || resolveDatabaseUrl()
  if (!connectionString) return null
  const { connectionString: _ignored, ...rest } = overrides
  return {
    connectionString,
    ssl: postgresSslConfig(connectionString),
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
        code: code || 'SSL',
        detail:
          'TLS rejected the database certificate. Aiven needs relaxed SSL (app fix) or sslmode=no-verify on DATABASE_URL.',
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
