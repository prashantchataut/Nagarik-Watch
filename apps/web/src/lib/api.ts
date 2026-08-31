import 'server-only'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { currentUser, type Me } from '@/lib/auth'
import { clientIp, rateLimit } from '@/lib/rate-limit'

/* ---------- tiny json helpers ---------- */

export function ok<T extends object>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init)
}

export function fail(error: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error, ...extra }, { status })
}

/* ---------- body parsing ---------- */

export async function parseBody<S extends z.ZodTypeAny>(
  req: Request,
  schema: S,
): Promise<{ data: z.infer<S>; error: null } | { data: null; error: NextResponse }> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return { data: null, error: fail('अमान्य अनुरोध।') }
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return {
      data: null,
      error: fail(first?.message ?? 'अमान्य विवरण।', 422),
    }
  }
  return { data: parsed.data, error: null }
}

/* ---------- auth guards ---------- */

export type Reader = Extract<Me, { kind: 'reader' }>
export type Journalist = Extract<Me, { kind: 'journalist' }> & { role: string }

export async function requireReader(): Promise<{ reader: Reader } | { error: NextResponse }> {
  const me = await currentUser()
  if (!me || me.kind !== 'reader') {
    return { error: fail('पाठक लगइन आवश्यक छ।', 401) }
  }
  return { reader: me }
}

export async function requireJournalist(): Promise<{ journalist: Journalist } | { error: NextResponse }> {
  const me = await currentUser()
  if (!me || me.kind !== 'journalist') {
    return { error: fail('पत्रकार लगइन आवश्यक छ।', 401) }
  }
  const fresh = await import('@/lib/db').then(({ db }) =>
    db.journalist.findUnique({ where: { id: me.id }, select: { role: true } }),
  )
  return { journalist: { ...me, role: fresh?.role ?? 'reporter' } }
}

export async function requireEditor(): Promise<{ journalist: Journalist } | { error: NextResponse }> {
  const guard = await requireJournalist()
  if ('error' in guard) return guard
  if (guard.journalist.role !== 'editor') {
    return { error: fail('यो कार्य सम्पादकहरूका लागि मात्र हो।', 403) }
  }
  return guard
}

/* ---------- rate-limit guard ---------- */

export function limitOr429(
  req: Request,
  bucket: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const result = rateLimit(bucket, clientIp(req), limit, windowMs)
  if (result.ok) return null
  return NextResponse.json(
    { ok: false, error: `धेरै प्रयास भयो — ${result.retryAfterSec} सेकेन्डपछि पुनः प्रयास गर्नुहोस्।` },
    { status: 429, headers: { 'Retry-After': String(result.retryAfterSec) } },
  )
}
