import 'server-only'
import { createHash } from 'node:crypto'
import { ensureOperationalSchema, isProductionRuntime, type Queryable } from '@/lib/ops-db'
import {
  scoreCredentialStuffing,
  type StuffingSignal,
  type StuffingWindow,
} from './credential-stuffing'

/**
 * The shared ledger behind credential-stuffing detection.
 *
 * Shared is the whole point. An in-process map would see one serverless
 * isolate's slice of a campaign that is spread across all of them — which is
 * exactly the blind spot stuffing exploits — so this uses the same Postgres
 * operational store the rate limiter does.
 *
 * Nothing identifying is written. The IP and the submitted username are each
 * salted and hashed before they leave this module, so the table can answer
 * "how many distinct accounts did this origin try" without being a list of who
 * logged in from where. That matters more than usual here: the accounts are
 * journalists, and a table of their login origins is itself a source-protection
 * risk.
 */

export const STUFFING_WINDOW_MINUTES = 15

/** Rows older than this are useless to the detector and are swept on write. */
const RETENTION_MINUTES = 24 * 60

export type AuthOutcome = 'success' | 'failure'

type WindowRow = {
  origin_failures: string | number
  origin_attempts: string | number
  origin_identifiers: string | number
  identifier_failures: string | number
  identifier_origins: string | number
}

function salt(): string {
  return (
    process.env.AUTH_ATTEMPT_SALT ||
    process.env.SUBMISSION_IP_SALT ||
    process.env.AUTH_SECRET ||
    'dev-auth-attempt-salt'
  )
}

function fingerprint(value: string): string {
  return createHash('sha256')
    .update(`${salt()}:${value.trim().toLowerCase()}`)
    .digest('hex')
    .slice(0, 32)
}

async function ensureSchema(): Promise<Queryable | null> {
  return ensureOperationalSchema('auth-attempts-v1', async (pool) => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nw_auth_attempts (
        id bigserial PRIMARY KEY,
        at timestamptz NOT NULL DEFAULT now(),
        origin_hash text NOT NULL,
        identifier_hash text NOT NULL,
        outcome text NOT NULL
      )
    `)
    await pool.query(`CREATE INDEX IF NOT EXISTS nw_auth_attempts_at_idx ON nw_auth_attempts(at)`)
    await pool.query(
      `CREATE INDEX IF NOT EXISTS nw_auth_attempts_origin_idx ON nw_auth_attempts(origin_hash, at)`,
    )
    await pool.query(
      `CREATE INDEX IF NOT EXISTS nw_auth_attempts_identifier_idx ON nw_auth_attempts(identifier_hash, at)`,
    )
  })
}

/**
 * Aggregate the window around one sign-in attempt. Returns null when the store
 * is unavailable, which the caller must treat as "no signal" rather than as a
 * clear verdict — failing closed on sign-in would lock the newsroom out of its
 * own CMS during a database blip, which is a worse outcome than a missed
 * detection.
 */
export async function readStuffingWindow(
  ip: string,
  identifier: string,
): Promise<StuffingWindow | null> {
  const pool = await ensureSchema()
  if (!pool) return null

  const originHash = fingerprint(ip)
  const identifierHash = fingerprint(identifier)

  try {
    const result = await pool.query<WindowRow>(
      `WITH recent AS (
         SELECT origin_hash, identifier_hash, outcome
         FROM nw_auth_attempts
         WHERE at > now() - ($3::int * interval '1 minute')
       )
       SELECT
         COUNT(*) FILTER (WHERE origin_hash = $1 AND outcome = 'failure') AS origin_failures,
         COUNT(*) FILTER (WHERE origin_hash = $1) AS origin_attempts,
         COUNT(DISTINCT identifier_hash) FILTER (WHERE origin_hash = $1) AS origin_identifiers,
         COUNT(*) FILTER (WHERE identifier_hash = $2 AND outcome = 'failure') AS identifier_failures,
         COUNT(DISTINCT origin_hash) FILTER (WHERE identifier_hash = $2 AND outcome = 'failure') AS identifier_origins
       FROM recent`,
      [originHash, identifierHash, STUFFING_WINDOW_MINUTES],
    )
    const row = result.rows[0]
    if (!row) return null
    return {
      windowMinutes: STUFFING_WINDOW_MINUTES,
      originFailures: Number(row.origin_failures),
      originAttempts: Number(row.origin_attempts),
      originIdentifiers: Number(row.origin_identifiers),
      identifierFailures: Number(row.identifier_failures),
      identifierOrigins: Number(row.identifier_origins),
    }
  } catch (error) {
    console.error(
      '[auth-attempts] window read failed',
      error instanceof Error ? error.message : error,
    )
    return null
  }
}

export async function recordAuthAttempt(
  ip: string,
  identifier: string,
  outcome: AuthOutcome,
): Promise<void> {
  const pool = await ensureSchema()
  if (!pool) return
  try {
    await pool.query(
      `INSERT INTO nw_auth_attempts (origin_hash, identifier_hash, outcome) VALUES ($1, $2, $3)`,
      [fingerprint(ip), fingerprint(identifier), outcome],
    )
    // Cheap opportunistic sweep: one delete per successful sign-in, not a cron.
    if (outcome === 'success') {
      await pool.query(
        `DELETE FROM nw_auth_attempts WHERE at < now() - ($1::int * interval '1 minute')`,
        [RETENTION_MINUTES],
      )
    }
  } catch (error) {
    console.error('[auth-attempts] write failed', error instanceof Error ? error.message : error)
  }
}

/**
 * Evaluate a sign-in before it is attempted. `null` means the detector had
 * nothing to work with — see `readStuffingWindow` on why that is not a pass.
 */
export async function evaluateSignIn(
  ip: string,
  identifier: string,
): Promise<(StuffingSignal & { window: StuffingWindow }) | null> {
  const window = await readStuffingWindow(ip, identifier)
  if (!window) return null
  return { ...scoreCredentialStuffing(window), window }
}

/** Newsroom-wide view for the security desk. */
export async function recentStuffingPressure(): Promise<{
  failures: number
  origins: number
  identifiers: number
  windowMinutes: number
} | null> {
  const pool = await ensureSchema()
  if (!pool) {
    if (isProductionRuntime()) {
      console.error('[auth-attempts] operational store unavailable in production')
    }
    return null
  }
  try {
    const result = await pool.query<{
      failures: string | number
      origins: string | number
      identifiers: string | number
    }>(
      `SELECT
         COUNT(*) FILTER (WHERE outcome = 'failure') AS failures,
         COUNT(DISTINCT origin_hash) FILTER (WHERE outcome = 'failure') AS origins,
         COUNT(DISTINCT identifier_hash) FILTER (WHERE outcome = 'failure') AS identifiers
       FROM nw_auth_attempts
       WHERE at > now() - ($1::int * interval '1 minute')`,
      [STUFFING_WINDOW_MINUTES],
    )
    const row = result.rows[0]
    if (!row) return null
    return {
      failures: Number(row.failures),
      origins: Number(row.origins),
      identifiers: Number(row.identifiers),
      windowMinutes: STUFFING_WINDOW_MINUTES,
    }
  } catch (error) {
    console.error(
      '[auth-attempts] pressure read failed',
      error instanceof Error ? error.message : error,
    )
    return null
  }
}
