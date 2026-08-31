import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { fail, requireJournalist } from '@/lib/api'
import { buildObjectKey, getR2Config, putObject, validateImageUpload } from '@/lib/storage/r2'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Journalist/editor: upload a hero image to Cloudflare R2.
 * multipart/form-data: file=<image>, desk=<slug>
 * Returns {url} — the public CDN URL — or 501 with setup guidance when
 * R2 env vars are missing. Local dev falls back to guidance, never crashes.
 */
export async function POST(req: Request) {
  const guard = await requireJournalist()
  if ('error' in guard) return guard.error

  if (!getR2Config()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          'R2 सेटअप नभएको। Vercel/सर्भरमा यी परिवेश चर थप्नुहोस्: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL।',
        needsSetup: true,
      },
      { status: 501 },
    )
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return fail('फारम-डाटा पढ्न सकिएन।', 400)
  }

  const file = form.get('file')
  const desk = String(form.get('desk') ?? 'desk')
  if (!(file instanceof File)) return fail('फाइल चाहियो।', 422)

  const invalid = validateImageUpload({ type: file.type, size: file.size })
  if (invalid) return fail(invalid, 422)

  const buffer = Buffer.from(await file.arrayBuffer())
  const key = buildObjectKey(desk, file.name, file.type)

  try {
    const result = await putObject(key, buffer, file.type)
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    return fail(err instanceof Error ? err.message : 'अपलोड असफल।', 502)
  }
}

/** Status probe for the editor settings panel. */
export async function GET() {
  return NextResponse.json({ ok: true, configured: getR2Config() !== null })
}
