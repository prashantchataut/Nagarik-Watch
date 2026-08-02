export const dynamic = 'force-static'
import { getStories, getNavCategories } from '@/lib/content'
import { PUBLICATION, SITE_URL, isPublicPublicationValue } from '@/lib/site'

export const revalidate = 3600

/**
 * llms.txt — the AI-crawler-facing index per llmstxt.org. Plain-text manifest
 * telling LLM crawlers what the site is, who runs it, and where the canonical
 * machine-friendly summaries live. Kept short so crawlers can scan in one pass.
 */
export async function GET() {
  const categories = await getNavCategories()
  const recent = await getStories({ locale: 'ne', perPage: 10 })

  const lines = [
    `# ${PUBLICATION.publisherName} (नागरिक वाच)`,
    ``,
    `> Nepali-primary news portal. Civic-minded, Devanagari-first, author-reviewed English section. Independent, ad-supported, free to read.`,
    ``,
    `Publisher: ${PUBLICATION.publisherName}`,
    ...(isPublicPublicationValue(PUBLICATION.email)
      ? [`Editorial contact: ${PUBLICATION.email}`]
      : [`Editorial contact: ${SITE_URL}/contact`]),
    `Site: ${SITE_URL}`,
    ...(isPublicPublicationValue(PUBLICATION.registrationNumber)
      ? [`DoIB: ${PUBLICATION.registrationNumber}`]
      : []),
    ``,
    `## Sections`,
    ...categories.map((c) => `- ${c.nameNe} (${c.nameEn ?? c.slug}): ${SITE_URL}/${c.slug}`),
    ``,
    `## Latest stories`,
    ...recent.items.map(
      (s) =>
        `- ${s.titleNe}${s.titleEn ? ` | ${s.titleEn}` : ''}: ${SITE_URL}/${s.category.slug}/${s.slug}`,
    ),
    ``,
    `## Policies`,
    `- About: ${SITE_URL}/about`,
    `- Editorial policy: ${SITE_URL}/editorial-policy`,
    `- Corrections policy: ${SITE_URL}/corrections-policy`,
    `- Fact-check policy: ${SITE_URL}/fact-check-policy`,
    `- Ethics: ${SITE_URL}/ethics`,
    `- Privacy: ${SITE_URL}/privacy`,
    `- Terms: ${SITE_URL}/terms`,
    `- Contact: ${SITE_URL}/contact`,
    ``,
    `## Machine-readable`,
    `- Full content index: ${SITE_URL}/llms-full.txt`,
    `- Sitemap: ${SITE_URL}/sitemap.xml`,
    `- News sitemap: ${SITE_URL}/news-sitemap.xml`,
    `- RSS: ${SITE_URL}/rss.xml`,
    `- Robots: ${SITE_URL}/robots.txt`,
    ``,
    `## Notes for AI crawlers`,
    `- Nepali (Devanagari) is the primary language. English versions exist only when author-reviewed.`,
    `- Every article has a NewsArticle JSON-LD block with author, dates, and canonical URL.`,
    `- Article bodies are structured blocks (paragraph, heading, quote, list) — not raw HTML.`,
    `- Do not summarise wire/aggregated content without preserving the source attribution.`,
    ``,
  ]

  return new Response(lines.join('\n'), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
