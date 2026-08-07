import type { Metadata } from 'next'
import Link from 'next/link'
import type { CategoryRef, Locale } from '@nagarikwatch/db'
import { notFound } from 'next/navigation'
import { HubIndexHeader } from '@/components/HubIndexHeader'
import { CategoryDesk } from '@/components/category/CategoryDesk'
import { getStories, getTag } from '@/lib/content'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localizeHref, localePrefix } from '@/lib/i18n/locales'
import { Pagination } from '@/components/Pagination'
import { staticTopicParams } from '@/lib/static-export-params'

export const revalidate = 60

export function generateStaticParams() {
  return staticTopicParams()
}

type Params = { locale: string; slug: string }

/**
 * Topic (tag) landing. Same desk language as category indexes (lead + rail + list/grid).
 */
export default async function TopicPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale: rawLocale, slug } = await params
  const locale: Locale = asLocale(rawLocale)
  const sp = await searchParams
  const requested = Number.parseInt(sp.page ?? '1', 10)
  const page = Number.isFinite(requested) && requested > 0 ? requested : 1

  const data = await getTag(slug, locale)
  if (!data) notFound()

  const result = await getStories({ tag: slug, page, locale })
  const dict = getDictionary(locale)
  const { tag } = data
  const lang = locale === 'en' ? 'en' : 'ne'
  const name = locale === 'en' && tag.nameEn ? tag.nameEn : tag.nameNe
  const nameLang = locale === 'en' && tag.nameEn ? 'en' : 'ne'
  const description = locale === 'en' ? tag.descriptionEn : tag.descriptionNe
  const parentCategory = mostCommonCategory(result.items.map((s) => s.category))

  return (
    <div className="mx-auto max-w-page px-3 py-4 sm:px-4 sm:py-5">
      <div>
        <HubIndexHeader
          title={name}
          lead={
            description ||
            (locale === 'en'
              ? 'Reporting and analysis gathered around this topic.'
              : 'यस विषयमा प्रकाशित समाचार र विश्लेषण।')
          }
          lang={nameLang}
          kicker={dict.topicStories}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span
            className="inline-flex items-center rounded-sm bg-brand-tint px-2.5 py-1 text-meta font-bold text-brand-strong"
            lang={nameLang}
          >
            {dict.storyCountTopic(result.total)}
          </span>
          {parentCategory ? (
            <Link
              href={localizeHref(locale, `/${parentCategory.slug}`)}
              lang={lang}
              className="inline-flex items-center border-b border-rule pb-1 text-meta font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-strong"
            >
              {dict.topicBackToCategory}
            </Link>
          ) : null}
        </div>
      </div>

      {result.items.length === 0 ? (
        <div className="mt-6 border-y border-rule bg-brand-tint/35 px-4 py-8" lang={lang}>
          <p className="font-display text-h2 text-ink">
            {locale === 'en' ? 'No stories yet' : 'अझै समाचार छैन'}
          </p>
          <p className="mt-2 max-w-body text-body text-ink-soft">
            {locale === 'en'
              ? 'Published reporting on this topic will appear here once it is reviewed.'
              : 'सम्पादकीय समीक्षा पूरा भएका सामग्री प्रकाशित भएपछि यस विषयका समाचार यहाँ देखिनेछन्।'}
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <CategoryDesk
            stories={result.items}
            locale={locale}
            sideKicker={{ ne: 'यस विषयका अन्य', en: 'Also on this topic' }}
            moreHeading={{ ne: 'थप यस विषयमा', en: 'More on this topic' }}
          />
        </div>
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath={localizeHref(locale, `/topic/${slug}`)}
        locale={locale}
        className="mt-8"
      />
    </div>
  )
}

function mostCommonCategory(cats: CategoryRef[]): CategoryRef | null {
  if (cats.length === 0) return null
  const counts = new Map<string, { ref: CategoryRef; n: number }>()
  for (const c of cats) {
    const entry = counts.get(c.slug)
    if (entry) entry.n += 1
    else counts.set(c.slug, { ref: c, n: 1 })
  }
  let best: { ref: CategoryRef; n: number } | null = null
  for (const entry of counts.values()) {
    if (!best || entry.n > best.n) best = entry
  }
  return best?.ref ?? null
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<{ page?: string }>
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params
  const locale: Locale = asLocale(rawLocale)
  const sp = await searchParams
  const page = Number.parseInt(sp.page ?? '1', 10)
  const data = await getTag(slug, locale)
  const prefix = localePrefix(locale)
  const canonical = `${prefix}/topic/${slug}`

  if (!data) {
    return { title: getDictionary(locale).notFoundHeading, robots: { index: false } }
  }

  const name = locale === 'en' && data.tag.nameEn ? data.tag.nameEn : data.tag.nameNe
  return {
    title: name,
    alternates: {
      canonical,
      languages: { ne: `/topic/${slug}`, en: `/en/topic/${slug}` },
    },
    robots: page > 1 ? { index: false, follow: true } : { index: true, follow: true },
  }
}
