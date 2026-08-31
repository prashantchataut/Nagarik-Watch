import { ok, requireEditor } from '@/lib/api'
import { getLaunchChecks, summarize } from '@/lib/news/launch-check'

export const dynamic = 'force-dynamic'

/** Editor: the लन्च चेक readiness report (score, checks, next actions). */
export async function GET() {
  const guard = await requireEditor()
  if ('error' in guard) return guard.error

  const checks = await getLaunchChecks()
  const summary = summarize(checks)
  return ok({ score: summary.score, summary, checks })
}
