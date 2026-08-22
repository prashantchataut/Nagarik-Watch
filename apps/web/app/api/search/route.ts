import { NextResponse } from 'next/server'
import type { Locale } from '@nagarikwatch/db'
import { getStories } from '@/lib/content'
import type { SearchableStory } from '@/lib/search'

const MAX_QUERY = 120
const MAX_RESULTS = 48

export async function GET(request: Request) {
  const url = new URL(request.url)
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, MAX_QUERY)
  const locale: Locale = url.searchParams.get('locale') === 'en' ? 'en' : 'ne'

  if (q.length < 2) return NextResponse.json({ items: [], total: 0 })

  try {
    const result = await getStories({
      q,
      locale,
      page: 1,
      perPage: MAX_RESULTS,
      limit: MAX_RESULTS,
    })
    const items: SearchableStory[] = result.items.map((story) => ({
      id: story.id,
      slug: story.slug,
      category: story.category,
      categoryLabel: story.categoryLabel,
      titleNe: story.titleNe,
      titleEn: story.titleEn,
      deckNe: story.deckNe,
      deckEn: story.deckEn,
      byline: story.byline,
      publishedAt: story.publishedAt,
      hasEnglish: story.hasEnglish,
      isBreaking: story.isBreaking,
      authors: story.authors.map((author) => ({ name: author.name, slug: author.slug })),
      heroImage: story.heroImage ? { url: story.heroImage.url, alt: story.heroImage.alt } : null,
    }))

    return NextResponse.json(
      { items, total: result.total },
      { headers: { 'Cache-Control': 'private, max-age=30' } },
    )
  } catch {
    return NextResponse.json({ items: [], total: 0, unavailable: true }, { status: 503 })
  }
}
