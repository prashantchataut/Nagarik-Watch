import 'server-only'
import { ensureOperationalSchema } from '@/lib/ops-db'

/**
 * Check Better Auth `user.disabled` without going through getAuth(), so the
 * auth bootstrap / session hooks can reject disabled accounts safely.
 */
export async function isUserDisabledById(userId: string): Promise<boolean> {
  if (!userId.trim()) return false
  const pool = await ensureOperationalSchema('auth-disabled-check-v1', async (db) => {
    for (const table of ['"user"', 'user']) {
      try {
        await db.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS disabled boolean NOT NULL DEFAULT false`)
        break
      } catch {
        // Quoting differs by adapter.
      }
    }
  })
  if (!pool) return false
  for (const table of ['"user"', 'user']) {
    try {
      const result = await pool.query<{ disabled: boolean | null }>(
        `SELECT disabled FROM ${table} WHERE id = $1 LIMIT 1`,
        [userId],
      )
      return Boolean(result.rows[0]?.disabled)
    } catch {
      // Column may still be missing until migrate runs.
    }
  }
  return false
}
