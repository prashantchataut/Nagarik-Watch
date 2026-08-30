import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/** Journalist desk: list own pitches (submitted stories). */
export async function GET() {
  const me = await currentUser()
  if (!me || me.kind !== 'journalist') {
    return NextResponse.json({ error: 'पत्रकार लगइन आवश्यक छ।' }, { status: 401 })
  }
  const pitches = await db.deskPitch.findMany({
    where: { journalistId: me.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      headline: true,
      desk: true,
      summary: true,
      status: true,
      editorNote: true,
      createdAt: true,
    },
  })
  return NextResponse.json({ pitches })
}

/** Journalist desk: submit a new story pitch. */
export async function POST(req: Request) {
  const me = await currentUser()
  if (!me || me.kind !== 'journalist') {
    return NextResponse.json({ error: 'पत्रकार लगइन आवश्यक छ।' }, { status: 401 })
  }
  try {
    const body = (await req.json()) as { headline?: string; desk?: string; summary?: string; body?: string }
    const headline = (body.headline ?? '').trim()
    const desk = (body.desk ?? me.desk).trim()
    const summary = (body.summary ?? '').trim()
    const storyBody = (body.body ?? '').trim()

    if (headline.length < 5) {
      return NextResponse.json({ error: 'शीर्षक कम्तीमा ५ अक्षरको हुनुपर्छ।' }, { status: 400 })
    }
    if (summary.length < 10) {
      return NextResponse.json({ error: 'सारांश कम्तीमा १० अक्षरको हुनुपर्छ।' }, { status: 400 })
    }

    const pitch = await db.deskPitch.create({
      data: { journalistId: me.id, headline, desk, summary, body: storyBody, status: 'submitted' },
    })
    return NextResponse.json({ ok: true, pitch: { id: pitch.id, headline: pitch.headline, status: pitch.status } })
  } catch {
    return NextResponse.json({ error: 'पिच पठाउन सकिएन।' }, { status: 500 })
  }
}
