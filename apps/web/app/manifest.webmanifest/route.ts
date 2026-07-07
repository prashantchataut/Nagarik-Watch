import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-static'

export function GET() {
  const manifest = {
    name: 'Nagarik Watch',
    short_name: 'Nagarik Watch',
    description: 'Verified Nepali news, fact-checks and public utilities.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f7f2ef',
    theme_color: '#8d1f17',
    id: SITE_URL,
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
    ],
  }

  return Response.json(manifest, {
    headers: {
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
