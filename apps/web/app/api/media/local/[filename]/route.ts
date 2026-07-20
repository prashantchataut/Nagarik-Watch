import { NextResponse, type NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/media/local/[filename]
 *
 * Development / E2E only. On Vercel this is a stub — local disk media must never
 * be file-traced into the serverless bundle (process.cwd() NFT blow-ups exceed 250MB).
 * Production uploads use Vercel Blob / object storage URLs directly.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  const { filename } = await params
  const { readLocalMediaFile } = await import('@/lib/storage/local-media-store')
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
