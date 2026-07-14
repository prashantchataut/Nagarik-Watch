import 'server-only'

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

export type DatabaseProbe = {
  ok: boolean
  host: string | null
  detail: string
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
    }
  }

  try {
    const { Pool } = await import('pg')
    const pool = new Pool({
      connectionString: url,
      max: 1,
      connectionTimeoutMillis: 4_000,
      idleTimeoutMillis: 1_000,
    })
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
    if (code === 'ENOTFOUND') {
      return {
        ok: false,
        host,
        detail: host
          ? `DNS lookup failed for ${host}. Update DATABASE_URL in Vercel to a live Postgres host.`
          : 'DNS lookup failed for DATABASE_URL host.',
      }
    }
    return {
      ok: false,
      host,
      detail: 'Postgres connection failed. Check credentials, SSL mode, and that the instance is online.',
    }
  }
}
