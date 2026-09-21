/**
 * CLI-only half of the operational migration runner: `.env` loading and a
 * dedicated one-connection pool. Imported by `scripts/migrate-ops.ts` and
 * `scripts/ops-retention.ts` only — never from the Next.js module graph, so
 * its dynamic filesystem reads stay out of the serverless trace.
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import type { MigrationQueryable } from './ops-migrations-runner'

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function resolveDatabaseUrl(): string | undefined {
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

function shouldRelaxSsl(url: string): boolean {
  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true') return false
  if (process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'false') return true
  try {
    const host = new URL(url).hostname.toLowerCase()
    return host.endsWith('.aivencloud.com') || host.endsWith('.aiven.io')
  } catch {
    return false
  }
}

function normalizeUrl(url: string): string {
  if (!shouldRelaxSsl(url)) return url
  const question = url.indexOf('?')
  if (question < 0) return `${url}?sslmode=no-verify`
  const base = url.slice(0, question)
  const kept = url
    .slice(question + 1)
    .split('&')
    .filter((part) => {
      const key = part.split('=', 1)[0]?.toLowerCase()
      return key !== 'sslmode' && key !== 'ssl' && key !== 'uselibpqcompat'
    })
    .filter(Boolean)
  const join = kept.length ? `${base}?${kept.join('&')}&` : `${base}?`
  return `${join}sslmode=no-verify`
}

/** Load `.env` then `.env.local` from package root and monorepo root without dotenv. */
export async function loadOpsMigrationEnv(cwd = PACKAGE_ROOT): Promise<void> {
  const roots = [cwd, path.resolve(cwd, '../..')]
  for (const root of roots) {
    for (const name of ['.env', '.env.local']) {
      const file = path.join(root, name)
      try {
        const text = await fs.readFile(file, 'utf8')
        for (const line of text.split(/\r?\n/)) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith('#')) continue
          const eq = trimmed.indexOf('=')
          if (eq <= 0) continue
          const key = trimmed.slice(0, eq).trim()
          if (!key || process.env[key] !== undefined) continue
          let val = trimmed.slice(eq + 1).trim()
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1)
          }
          process.env[key] = val
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
      }
    }
  }
}

/** Open a dedicated CLI pool, run work on one client, then close. */
export async function withCliMigrationClient<T>(
  fn: (client: MigrationQueryable) => Promise<T>,
): Promise<T> {
  const raw = resolveDatabaseUrl()
  if (!raw) {
    throw new Error('DATABASE_URL is required to apply operational migrations.')
  }
  const require = createRequire(import.meta.url)
  const { Pool } = require('pg') as typeof import('pg')
  const pool = new Pool({
    connectionString: normalizeUrl(raw),
    ssl: shouldRelaxSsl(raw) ? { rejectUnauthorized: false } : undefined,
    max: 1,
  })
  const client = await pool.connect()
  try {
    return await fn(client)
  } finally {
    client.release()
    await pool.end().catch(() => undefined)
  }
}
