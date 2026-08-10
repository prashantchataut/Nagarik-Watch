import type { Metadata } from 'next'
import Link from 'next/link'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getAuthors, getNavCategories, getStories, getTags } from '@/lib/content'
import { HubIndexHeader } from '@/components/HubIndexHeader'
import { STATIC_HUBS, TRUST_PAGES } from '@/lib/site'
import { isPublicMembershipEnabled } from '@/lib/membership'

export const dynamic = 'force-static'

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale)
  const lang = locale === 'en' ? 'en' : 'ne'
  const membershipPublic = isPublicMembershipEnabled()
  const hubs = STATIC_HUBS.filter((hub) => membershipPublic || hub.key !== 'membership')
  const [categories, authors, tags, recent] = await Promise.all([
    getNavCategories(),
    getAuthors(),
    getTags(),
    getStories({ locale, perPage: 24 }),
  ])

  return (
    <div className="mx-auto max-w-page px-4 py-8" lang={lang}>
      <HubIndexHeader
        title={locale === 'en' ? 'Sitemap' : 'साइटम्याप'}
        lead={
          locale === 'en'
            ? 'A structured index of sections, desks, recent reporting, authors, topics and trust pages.'
            : 'विभाग, डेस्क, हालसालैका समाचार, लेखक, विषय र विश्वाससम्बन्धी पृष्ठहरूको संरचित सूची।'
        }
        lang={lang}
      />
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="font-display text-h2 text-ink">
            {locale === 'en' ? 'Sections' : 'विभाग'}
          </h2>
          <ul className="mt-3 grid gap-2 text-body">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={localizeHref(locale, `/${c.slug}`)}
                  className="text-ink-soft transition-colors hover:text-brand-strong"
                >
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
          <ul className="mt-3 grid gap-2 text-body">
            {hubs.map((hub) => (
              <li key={hub.key}>
                <Link
                  href={localizeHref(locale, hub.path)}
                  className="text-ink-soft transition-colors hover:text-brand-strong"
                >
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
          <ul className="mt-3 divide-y divide-rule border-y border-rule">
            {recent.items.map((story) => (
              <li key={story.id} className="py-3">
                <Link
                  href={localizeHref(locale, `/${story.category.slug}/${story.slug}`)}
                  className="font-display text-body-lg text-ink transition-colors hover:text-brand-strong"
                >
                  {locale === 'en' && story.titleEn ? story.titleEn : story.titleNe}
                </Link>
                <p className="mt-1 text-caption text-mute">
                  {locale === 'en' && story.category.nameEn
                    ? story.category.nameEn
                    : story.category.nameNe}
                </p>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="font-display text-h2 text-ink">
            {locale === 'en' ? 'Authors and topics' : 'लेखक र विषय'}
          </h2>
          <ul className="mt-3 grid gap-2 text-body">
            {authors.slice(0, 20).map((a) => (
              <li key={a.slug}>
                <Link
                  href={localizeHref(locale, `/author/${a.slug}`)}
                  className="text-ink-soft transition-colors hover:text-brand-strong"
                >
                  {a.name}
                </Link>
              </li>
            ))}
            {tags.slice(0, 20).map((t) => (
              <li key={t.slug}>
                <Link
                  href={localizeHref(locale, `/topic/${t.slug}`)}
                  className="text-ink-soft transition-colors hover:text-brand-strong"
                >
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
                <Link
                  href={localizeHref(locale, page.path)}
                  className="text-ink-soft transition-colors hover:text-brand-strong"
                >
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
