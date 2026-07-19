import type { Metadata } from 'next'
import Link from 'next/link'
import { StoryCard } from '@nagarikwatch/ui'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getAuthors, getStories } from '@/lib/content'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  const en = locale === 'en'
  return {
    title: en ? 'Columns' : 'स्तम्भ',
    description: en
      ? 'Opinion and analysis from Nagarik Watch columnists.'
      : 'नागरिक वाच स्तम्भकारका विचार र विश्लेषण।',
    alternates: { canonical: `${SITE_URL}${localizeHref(locale, '/columns')}` },
  }
}

export default async function ColumnsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = asLocale((await params).locale)
  const en = locale === 'en'
  const [authors, stories] = await Promise.all([
    getAuthors(),
    getStories({ locale, category: 'opinion', perPage: 24 }),
  ])
  const columnists = authors.filter((author) => author.role === 'columnist' && author.isActive)
  const columnistSlugs = new Set(columnists.map((author) => author.slug))
  const items = stories.items.filter(
    (story) =>
      story.category.slug === 'opinion' ||
      story.authors.some((author) => columnistSlugs.has(author.slug)),
  )

  return (
    <div className="mx-auto max-w-page px-4 pb-16 pt-10">
      <header className="border-b border-rule pb-6">
        <p className="text-caption font-bold uppercase tracking-wide text-brand-strong">
          {en ? 'Columns' : 'स्तम्भ'}
        </p>
        <h1 className="mt-2 font-display text-[clamp(2rem,5vw,3.4rem)] font-black text-ink">
          {en ? 'Columnists and analysis' : 'स्तम्भकार र विश्लेषण'}
        </h1>
      </header>

      {columnists.length ? (
        <section className="mt-8" aria-labelledby="columnists-title">
          <h2 id="columnists-title" className="font-display text-h2 text-ink">
            {en ? 'Writers' : 'लेखक'}
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {columnists.map((author) => (
              <li key={author.slug} className="border border-rule p-4">
                <Link
                  href={localizeHref(locale, `/author/${author.slug}`)}
                  className="font-display text-body-lg font-bold text-ink hover:text-brand-strong"
                >
                  {author.name}
                </Link>
                <p className="mt-1 text-meta text-ink-soft">{en ? 'Columnist' : 'स्तम्भकार'}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {items.length === 0 ? (
        <p className="mt-10 border-y border-rule py-8 text-ink-soft">
          {en ? 'No column pieces are published yet.' : 'अहिले प्रकाशित स्तम्भ सामग्री छैन।'}
        </p>
      ) : (
        <ul className="mt-10 grid gap-8 md:grid-cols-2">
          {items.map((story) => (
            <li key={story.id}>
              <StoryCard story={story} locale={locale} variant="text-led" />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
