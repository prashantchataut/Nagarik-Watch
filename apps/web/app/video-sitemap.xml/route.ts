import { getDistributionStories } from '@/lib/feeds/stories'
import { localizeHref } from '@/lib/i18n/locales'
import { SITE_URL } from '@/lib/site'
import { escapeXml } from '@/lib/xml'

export const dynamic = 'force-static'
export const revalidate = 600

export async function GET() {
  const items = (await getDistributionStories('ne', 200)).filter(
    (item) =>
      item.category.slug === 'video' ||
      item.tags?.some((tag) => tag.slug === 'video' || tag.slug === 'video-story'),
  )
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${items
  .map((item) => {
    const loc = `${SITE_URL}${localizeHref('ne', `/${item.category.slug}/${item.slug}`)}`
    const thumb = item.heroImage?.url
      ? item.heroImage.url.startsWith('http')
        ? item.heroImage.url
        : `${SITE_URL}${item.heroImage.url}`
      : `${SITE_URL}/opengraph-image.png`
    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <video:video>
      <video:thumbnail_loc>${escapeXml(thumb)}</video:thumbnail_loc>
      <video:title>${escapeXml(item.titleNe)}</video:title>
      <video:description>${escapeXml(item.deckNe || item.titleNe)}</video:description>
      <video:publication_date>${escapeXml(new Date(item.publishedAt).toISOString())}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
    </video:video>
  </url>`
  })
  .join('\n')}
</urlset>`
  return new Response(xml, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  })
}
