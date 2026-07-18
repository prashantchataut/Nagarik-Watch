import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { StoryCard } from '@nagarikwatch/ui'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getCategory, getCategoryPage } from '@/lib/content'
import { Pagination } from '@/components/Pagination'
import { AdSlot } from '@/components/AdSlot'
import { canonicalAlternates } from '@/lib/seo/canonical'

function pageNumber(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number.parseInt(raw || '1', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; category: string }> }): Promise<Metadata> {
  const { locale: raw, category: slug } = await params
  const locale = asLocale(raw)
  const category = await getCategory(slug)
  if (!category) return {}
  const title = locale === 'en' ? category.nameEn : category.nameNe
  const description = locale === 'en' ? category.descriptionEn : category.descriptionNe
  return {
    title,
    description,
    alternates: canonicalAlternates(locale, `/${slug}`),
  }
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ locale: string; category: string }>; searchParams: Promise<{ page?: string | string[] }> }) {
  const { locale: raw, category: slug } = await params
  const locale = asLocale(raw)
  const english = locale === 'en'
  const page = pageNumber((await searchParams).page)
  const [category, result] = await Promise.all([getCategory(slug), getCategoryPage(slug, page, locale)])
  if (!category || !result || page > result.totalPages) notFound()
  const name = english ? category.nameEn : category.nameNe
  const description = english ? category.descriptionEn : category.descriptionNe

  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:py-12">
      <header className="max-w-3xl border-y border-rule py-7" lang={english ? 'en' : 'ne'}>
        <p className="text-caption font-bold uppercase tracking-[0.18em] text-brand-strong">{english ? 'News desk' : 'समाचार विभाग'}</p>
        <h1 className="mt-2 font-display text-display leading-tight text-ink">{name}</h1>
        {description ? <p className="mt-3 text-body-lg leading-relaxed text-ink-soft">{description}</p> : null}
      </header>
      {result.items.length ? (
        <>
          <div className="mt-6 border-b border-rule pb-5"><AdSlot locale={locale} placementKey="category-top" /></div>
          <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {result.items.map((story, index) => <StoryCard key={story.id} story={story} locale={locale} variant={index === 0 ? 'featured' : 'default'} priority={index === 0} className={index === 0 ? 'sm:col-span-2' : undefined} />)}
          </div>
          <AdSlot locale={locale} placementKey="category-inline" variant="inline" />
          <Pagination page={result.page} totalPages={result.totalPages} basePath={localizeHref(locale, `/${slug}`)} locale={locale} className="mt-10" />
        </>
      ) : (
        <p className="mt-10 max-w-body border-t border-rule pt-6 text-body-lg text-ink-soft" lang={english ? 'en' : 'ne'}>
          {english ? 'No reviewed stories are published in this desk yet.' : 'यस विभागमा सम्पादकीय समीक्षा पूरा भएको समाचार अझै प्रकाशित छैन।'}
        </p>
      )}
    </div>
  )
}
