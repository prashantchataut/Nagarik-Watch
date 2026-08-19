/**
 * Soft-desk → Payload cutover status for /admin/launch.
 * Counts nw_articles and reports whether operators marked migration complete.
 * Does not flip CONTENT_SOURCE.
 */
import 'server-only'
import { getOperationalPool, type Queryable } from '@/lib/ops-db'
import { getPayloadCutoverChecklist } from '@/lib/content/payload-cutover'
import { isPayloadCanonical } from '@/lib/content/payload-admin-client'

export type CutoverStatus = {
  contentSource: string
  payloadCanonical: boolean
  checklistReady: boolean
  currentlyCanonical: boolean
  desk: {
    tablePresent: boolean
    total: number
    published: number
    submitted: number
    draftish: number
  }
  migrationMarkedComplete: boolean
  nextSteps: string[]
}

async function ensureArticlesReadable(pool: Queryable): Promise<boolean> {
  try {
    await pool.query(`SELECT 1 FROM nw_articles LIMIT 1`)
    return true
  } catch {
    return false
  }
}

export async function getCutoverStatus(): Promise<CutoverStatus> {
  const contentSource =
    process.env.CONTENT_SOURCE?.trim() || process.env.PAYLOAD_CONTENT_SOURCE?.trim() || 'json'
  const checklist = getPayloadCutoverChecklist()
  const migrationMarkedComplete =
    process.env.DESK_TO_PAYLOAD_MIGRATED?.trim().toLowerCase() === 'true' ||
    process.env.DESK_TO_PAYLOAD_MIGRATED?.trim() === '1'

  const desk = {
    tablePresent: false,
    total: 0,
    published: 0,
    submitted: 0,
    draftish: 0,
  }

  const pool = await getOperationalPool()
  if (pool) {
    desk.tablePresent = await ensureArticlesReadable(pool)
    if (desk.tablePresent) {
      const totals = await pool.query<{
        total: string
        published: string
        submitted: string
        draftish: string
      }>(`
        SELECT
          COUNT(*)::text AS total,
          COUNT(*) FILTER (WHERE workflow_stage IN ('published', 'updated'))::text AS published,
          COUNT(*) FILTER (WHERE workflow_stage = 'submitted')::text AS submitted,
          COUNT(*) FILTER (
            WHERE workflow_stage NOT IN ('published', 'updated', 'submitted', 'archived', 'retracted')
          )::text AS draftish
        FROM nw_articles
      `)
      const row = totals.rows[0]
      desk.total = Number(row?.total ?? 0)
      desk.published = Number(row?.published ?? 0)
      desk.submitted = Number(row?.submitted ?? 0)
      desk.draftish = Number(row?.draftish ?? 0)
    }
  }

  const nextSteps: string[] = []
  if (isPayloadCanonical()) {
    nextSteps.push('Payload is already canonical. Publish only in Payload CMS.')
  } else {
    if (!checklist.ready) {
      nextSteps.push(
        'Complete Payload cutover checklist gates on this page (URL, token, secret, revalidate, media).',
      )
    }
    if (desk.published > 0 && !migrationMarkedComplete) {
      nextSteps.push(
        'Dry-run then apply: pnpm migrate:desk-to-payload && pnpm migrate:desk-to-payload -- --apply',
      )
      nextSteps.push(
        'After verifying Payload inventory, set DESK_TO_PAYLOAD_MIGRATED=true on Vercel.',
      )
    }
    if (checklist.ready && (migrationMarkedComplete || desk.published === 0)) {
      nextSteps.push(
        'Staging: set CONTENT_SOURCE=payload, prove publish → public ≤60s, then redeploy.',
      )
    }
    if (desk.published === 0) {
      nextSteps.push(
        'Publish real soft-desk stories before cutover, or accept an empty Payload corpus.',
      )
    }
  }

  return {
    contentSource,
    payloadCanonical: isPayloadCanonical(),
    checklistReady: checklist.ready,
    currentlyCanonical: checklist.currentlyCanonical,
    desk,
    migrationMarkedComplete,
    nextSteps,
  }
}
