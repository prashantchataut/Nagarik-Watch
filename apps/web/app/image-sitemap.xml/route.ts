import { getDistributionStories } from '@/lib/feeds/stories'
import { localizeHref } from '@/lib/i18n/locales'
import { SITE_URL } from '@/lib/site'
import { escapeXml } from '@/lib/xml'

export const dynamic = 'force-static'
export const revalidate = 600

export async function GET() {
  const items = (await getDistributionStories('ne', 200)).filter((item) => item.heroImage?.url)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${items
  .map((item) => {
    const loc = `${SITE_URL}${localizeHref('ne', `/${item.category.slug}/${item.slug}`)}`
    const imageUrl = item.heroImage!.url.startsWith('http')
      ? item.heroImage!.url
      : `${SITE_URL}${item.heroImage!.url}`
    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${escapeXml(item.titleNe)}</image:title>
    </image:image>
  </url>`
  })
  .join('\n')}
</urlset>`
  return new Response(xml, {
    headers: { 'content-type': 'application/xml; charset=utf-8' },
  })
}
