import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { getStories } from '@/lib/content'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { SearchView } from '@/components/search/SearchView'
import type { SearchableStory } from '@/lib/search'

type Params = { locale: string }

/**
 * Search route. The page is a server component: it loads the full story corpus once (capped for search breadth) and maps the cards onto the SearchableStory shape that
 * lib/search expects. All interactivity — input, debounce, keyboard nav, recents — lives in the
 * client SearchView, which receives the corpus as a prop.
 */
export default async function SearchPage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)

  // No locale filter here so a Nepali query still surfaces English-headlined stories and vice
  // versa; the SearchView renders whichever title matches.
  const { items } = await getStories({ perPage: 500, limit: 500 })

  const corpus: SearchableStory[] = items.map((s) => ({
    id: s.id,
    slug: s.slug,
    category: s.category,
    categoryLabel: s.categoryLabel,
    titleNe: s.titleNe,
    titleEn: s.titleEn,
    deckNe: s.deckNe,
    deckEn: s.deckEn,
    byline: s.byline,
    publishedAt: s.publishedAt,
    hasEnglish: s.hasEnglish,
    isBreaking: s.isBreaking,
    authors: s.authors.map((a) => ({ name: a.name, slug: a.slug })),
    heroImage: s.heroImage ? { url: s.heroImage.url, alt: s.heroImage.alt } : null,
  }))

  return <SearchView locale={locale} corpus={corpus} corpusCap={500} />
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const dict = getDictionary(locale)
  const opposite = locale === 'en' ? '' : '/en'
  return {
    title: dict.search,
    alternates: {
      canonical: localizeHref(locale, '/search'),
      languages: { ne: '/search', en: `${opposite}/search` },
    },
    robots: { index: false, follow: true },
  }
}

export const dynamic = 'force-static'
