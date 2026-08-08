import { NextResponse } from 'next/server'
import { requireNewsroomSession } from '@/lib/auth/session'
import { canEdit } from '@/lib/admin-roles'
import { getCutoverStatus } from '@/lib/content/cutover-status'
import { getPayloadCutoverChecklist } from '@/lib/content/payload-cutover'

export const dynamic = 'force-dynamic'

/** GET /api/admin/cutover/status — desk corpus + Payload cutover readiness. */
export async function GET() {
  let session
  try {
    session = await requireNewsroomSession()
  } catch {
    return NextResponse.json({ error: 'लगइन आवश्यक।' }, { status: 401 })
  }
  if (!canEdit(session.newsroomRole)) {
    return NextResponse.json({ error: 'अनुमति छैन।' }, { status: 403 })
  }

  const [status, checklist] = await Promise.all([
    getCutoverStatus(),
    Promise.resolve(getPayloadCutoverChecklist()),
  ])

  return NextResponse.json({ status, checklist })
}
