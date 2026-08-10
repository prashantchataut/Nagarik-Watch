import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { requireNewsroomSession } from '@/lib/auth/session'
import { canEdit } from '@/lib/admin-roles'
import { getEditorPreferences, upsertEditorPreferences } from '@/lib/editor-preferences'
import { enforceRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/** GET /api/newsroom/editor-preferences — current user's desk editor prefs. */
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
  const preferences = await getEditorPreferences(session.userId)
  return NextResponse.json({ preferences })
}

/** PUT /api/newsroom/editor-preferences — upsert desk editor prefs. */
export async function PUT(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }
  const limited = await enforceRateLimit(request, 'editor-preferences', 30, 60_000)
  if (limited) return limited

  let session
  try {
    session = await requireNewsroomSession()
  } catch {
    return NextResponse.json({ error: 'लगइन आवश्यक।' }, { status: 401 })
  }
  if (!canEdit(session.newsroomRole)) {
    return NextResponse.json({ error: 'अनुमति छैन।' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const preferences = await upsertEditorPreferences(session.userId, {
    defaultCategorySlug: body.defaultCategorySlug,
    autosaveSeconds: body.autosaveSeconds,
    density: body.density,
    showFormattingHints: body.showFormattingHints,
    preferredLocale: body.preferredLocale,
  })
  return NextResponse.json({ preferences })
}
