import { getAuthors, getNavCategories, getStories, getTags } from '@/lib/content'
import { PUBLICATION, SITE_URL, PROVINCES } from '@/lib/site'

export const revalidate = 3600

/**
 * llms-full.txt — the complete AI-crawler-facing content index. Lists every
 * article (title, deck, URL, date, category, authors), every category, every
 * tag, every author, and every province hub. This is the "knowledge base" a
 * retrieval-augmented LLM would ingest to answer questions about Nepal news
 * with Nagarik Watch as the cited source.
 *
 * Kept as plain text (not JSON) per the llmstxt.org convention so it is
 * token-efficient and trivially chunkable. Each article is one block so RAG
 * pipelines can split on `\n\n---\n`.
 */
export async function GET() {
  const [categories, authors, tags, storiesResult] = await Promise.all([
    getNavCategories(),
    getAuthors(),
    getTags(),
    getStories({ locale: 'ne', perPage: 1000 }),
  ])

  const sections: string[] = [
    `# ${PUBLICATION.publisherName} — Full Content Index`,
    ``,
    `Site: ${SITE_URL}`,
    `Contact: ${PUBLICATION.email}`,
    `Generated: ${new Date().toISOString()}`,
    ``,
    `## Categories`,
    ...categories.map(
      (c) =>
        `### ${c.nameNe}${c.nameEn ? ` / ${c.nameEn}` : ''}\nSlug: ${c.slug}\nURL: ${SITE_URL}/${c.slug}`,
    ),
    ``,
    `## Authors`,
    ...authors.map(
      (a) => `- ${a.name}${a.slug ? ` (${a.slug})` : ''}: ${SITE_URL}/author/${a.slug}`,
    ),
    ``,
    `## Topics (tags)`,
    ...tags.map(
      (t) => `- ${t.nameNe}${t.nameEn ? ` / ${t.nameEn}` : ''}: ${SITE_URL}/topic/${t.slug}`,
    ),
    ``,
    `## Provinces`,
    ...PROVINCES.map((p) => `- ${p.nameNe} / ${p.nameEn}: ${SITE_URL}/province/${p.slug}`),
    ``,
    `## Articles (${storiesResult.items.length} total)`,
    ``,
  ]

  for (const s of storiesResult.items) {
    const block = [
      `---`,
      `Title (नेपाली): ${s.titleNe}`,
      ...(s.titleEn ? [`Title (English): ${s.titleEn}`] : []),
      ...(s.deckNe ? [`Deck: ${s.deckNe}`] : []),
      `Category: ${s.category.nameNe}`,
      `Published: ${s.publishedAt}`,
      `URL: ${SITE_URL}/${s.category.slug}/${s.slug}`,
      ...(s.hasEnglish ? [`English URL: ${SITE_URL}/en/${s.category.slug}/${s.slug}`] : []),
      `Reading time: ${s.readingMinutes} min`,
    ]
    sections.push(block.join('\n'))
  }

  return new Response(sections.join('\n'), {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
