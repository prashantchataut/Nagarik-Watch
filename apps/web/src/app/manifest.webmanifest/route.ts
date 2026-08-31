import { SITE } from '@/lib/news/seo'

export function GET() {
  const manifest = {
    name: 'नागरिक वाच — Nagarik Watch',
    short_name: 'नागरिक वाच',
    description: 'नेपालको डेवनागरी-प्रथम डिजिटल समाचार पोर्टल।',
    start_url: '/',
    display: 'standalone',
    background_color: '#F4F1EC',
    theme_color: '#C02A2A',
    lang: 'ne',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  }
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'content-type': 'application/manifest+json; charset=utf-8' },
  })
}
