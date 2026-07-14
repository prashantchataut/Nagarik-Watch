import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const manifest = {
    name: 'Nagarik Watch',
    short_name: 'Nagarik Watch',
    description: 'Verified Nepali news, fact-checks and public utilities.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f7f2ef',
    theme_color: '#8d1f17',
    id: `${origin}/`,
    categories: ['news', 'magazines'],
    lang: 'ne',
    dir: 'ltr',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
    ],
  }

  return Response.json(manifest, {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
