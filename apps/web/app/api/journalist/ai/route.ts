import { NextResponse, type NextRequest } from 'next/server'
import { CONTRIBUTOR_ROLES } from '@/lib/admin-roles'
import {
  draftFactCheckScaffold,
  draftHeadlines,
  draftSummary,
  draftTags,
} from '@/lib/ai'
import { getNewsroomSession } from '@/lib/auth/session'
import { blocksFromShorthand } from '@/lib/content/blocks'
import { enforceRateLimit } from '@/lib/rate-limit'
import { isTrustedWriteRequest } from '@/lib/security/origin'

export const dynamic = 'force-dynamic'

const ACTIONS = ['summary', 'headlines', 'tags', 'factCheck'] as const
type AssistanceAction = (typeof ACTIONS)[number]

function isAction(value: unknown): value is AssistanceAction {
  return ACTIONS.includes(value as AssistanceAction)
}

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }

  const limited = await enforceRateLimit(request, 'journalist-ai-assist', 30, 60_000)
  if (limited) return limited

  const session = await getNewsroomSession()
  if (!session || !CONTRIBUTOR_ROLES.has(session.newsroomRole)) {
    return NextResponse.json({ error: 'Journalist access required.' }, { status: 403 })
  }

  let input: Record<string, unknown>
  try {
    input = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  if (!isAction(input.action)) {
    return NextResponse.json({ error: 'Unknown assistance action.' }, { status: 400 })
  }

  const body = String(input.body ?? '').trim()
  const title = String(input.title ?? '').trim()
  if (!body) {
    return NextResponse.json({ error: 'Story body is required.' }, { status: 400 })
  }
  if (body.length > 100_000 || title.length > 200) {
    return NextResponse.json({ error: 'Story content is too long.' }, { status: 413 })
  }

  const article = {
    titleNe: title,
    deckNe: '',
    bodyNe: blocksFromShorthand(body),
  }

  const suggestion =
    input.action === 'summary'
      ? draftSummary(article)
      : input.action === 'headlines'
        ? draftHeadlines(article)
        : input.action === 'tags'
          ? draftTags(article)
          : draftFactCheckScaffold(article)

  // Assistance is returned only. This endpoint has no article-store dependency
  // and therefore cannot save or publish generated text.
  return NextResponse.json({ suggestion })
}
