import type { Metadata } from 'next'
import Link from 'next/link'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getAuthors, getNavCategories, getStories, getTags } from '@/lib/content'
import { STATIC_HUBS, TRUST_PAGES } from '@/lib/site'

export const dynamic = 'force-static'

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale)
  const lang = locale === 'en' ? 'en' : 'ne'
  const [categories, authors, tags, recent] = await Promise.all([
    getNavCategories(),
    getAuthors(),
    getTags(),
    getStories({ locale, perPage: 24 }),
  ])

  return (
    <div className="mx-auto max-w-page px-4 py-8" lang={lang}>
      <h1 className="font-display text-display text-ink">
        {locale === 'en' ? 'Sitemap' : 'साइटम्याप'}
      </h1>
      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <section>
          <h2 className="font-display text-h2 text-ink">
            {locale === 'en' ? 'Sections' : 'विभाग'}
          </h2>
          <ul className="mt-3 space-y-2 text-body">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={localizeHref(locale, `/${c.slug}`)}>
                  {locale === 'en' && c.nameEn ? c.nameEn : c.nameNe}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-h2 text-ink">
            {locale === 'en' ? 'News hubs' : 'समाचार खण्ड'}
          </h2>
          <ul className="mt-3 space-y-2 text-body">
            {STATIC_HUBS.map((hub) => (
              <li key={hub.key}>
                <Link href={localizeHref(locale, hub.path)}>
                  {locale === 'en' ? hub.titleEn : hub.titleNe}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-h2 text-ink">
            {locale === 'en' ? 'Recent stories' : 'हालसालैका समाचार'}
          </h2>
          <ul className="mt-3 space-y-2 text-body">
            {recent.items.map((story) => (
              <li key={story.id}>
                <Link href={localizeHref(locale, `/${story.category.slug}/${story.slug}`)}>
                  {locale === 'en' && story.titleEn ? story.titleEn : story.titleNe}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-h2 text-ink">
            {locale === 'en' ? 'Authors and topics' : 'लेखक र विषय'}
          </h2>
          <ul className="mt-3 space-y-2 text-body">
            {authors.slice(0, 20).map((a) => (
              <li key={a.slug}>
                <Link href={localizeHref(locale, `/author/${a.slug}`)}>{a.name}</Link>
              </li>
            ))}
            {tags.slice(0, 20).map((t) => (
              <li key={t.slug}>
                <Link href={localizeHref(locale, `/topic/${t.slug}`)}>
                  {locale === 'en' && t.nameEn ? t.nameEn : t.nameNe}
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="md:col-span-2">
          <h2 className="font-display text-h2 text-ink">
            {locale === 'en' ? 'Trust and legal' : 'विश्वास र कानुनी'}
          </h2>
          <ul className="mt-3 grid gap-2 text-body sm:grid-cols-2">
            {TRUST_PAGES.map((page) => (
              <li key={page.path}>
                <Link href={localizeHref(locale, page.path)}>
                  {locale === 'en' ? page.titleEn : page.titleNe}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  return {
    title: locale === 'en' ? 'Sitemap' : 'साइटम्याप',
    alternates: { canonical: localizeHref(locale, '/sitemap') },
  }
}
