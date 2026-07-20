import { NextResponse, type NextRequest } from 'next/server'
import { readLocalMediaFile } from '@/lib/storage/local-media-store'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** GET /api/media/local/[filename] — serve locally stored newsroom uploads. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params
  const file = await readLocalMediaFile(decodeURIComponent(filename))
  if (!file) return NextResponse.json({ error: 'Not found.' }, { status: 404 })

  return new NextResponse(new Uint8Array(file.buffer), {
    status: 200,
    headers: {
      'content-type': file.contentType,
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
}
