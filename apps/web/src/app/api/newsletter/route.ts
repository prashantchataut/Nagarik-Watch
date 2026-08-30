import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validEmail } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string }
    const email = (body.email ?? '').trim().toLowerCase()
    if (!validEmail(email)) {
      return NextResponse.json({ error: 'इमेल ठेगाना मान्य छैन।' }, { status: 400 })
    }
    await db.newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: { email },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'सदस्यता लिन सकिएन।' }, { status: 500 })
  }
}
