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
    // Path-relative id so preview/custom hosts stay same-origin with the document.
    id: '/',
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
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
