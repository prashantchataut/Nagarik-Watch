import Image from 'next/image'
import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Byline, CategoryLabel } from '@nagarikwatch/ui'
import { getArticleBySlug, getStories } from '@/lib/content'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localePrefix } from '@/lib/i18n/locales'
import { ArticleBody, CorrectionNotice, TagRow } from '@/components/article/ArticleBody'
import { ShareBar } from '@/components/article/ShareBar'
import { ArticleJsonLd } from '@/components/article/ArticleJsonLd'
import { RelatedStories } from '@/components/article/RelatedStories'
import { ReadingProgress } from '@/components/article/ReadingProgress'
import { FontSizeControl } from '@/components/article/FontSizeControl'
import { ReaderArticleControls } from '@/components/reader/ReaderArticleControls'
import { BookmarkButton } from '@/components/reader/BookmarkButton'
import { BreadcrumbJsonLd, SpeakableJsonLd } from '@/components/seo/Schema'
import { CommentSection } from '@/components/article/CommentSection'
import { AdSlot } from '@/components/AdSlot'
import { SITE_URL } from '@/lib/site'
import { relatedByContent } from '@/lib/ranking'

type Params = { locale: string; category: string; slug: string }

/**
 * Article page. Reads the article by (category, slug, locale) and renders the hero image,
 * headline, deck, byline/dateline/attribution, the typed body, an inline share bar, a
 * corrections notice when present, tags, related stories from the same category, and the
 * NewsArticle JSON-LD. All content is locale-aware: Nepali is source of truth and the
 * English route shows reviewed English when available and clearly labels Nepali fallback
 * when a translation is still pending, so the language toggle never sends readers to a dead end.
 */
export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale, category, slug } = await params
  const locale: Locale = asLocale(rawLocale)

  const article = await getArticleBySlug(category, slug, locale)
  if (!article) notFound()

  const dict = getDictionary(locale)
  const title = locale === 'en' && article.titleEn ? article.titleEn : article.titleNe
  const deck = locale === 'en' ? article.deckEn : article.deckNe
  const body = locale === 'en' && article.bodyEn ? article.bodyEn : article.bodyNe
  const titleLang = locale === 'en' && article.titleEn ? 'en' : 'ne'

  const siteUrl = SITE_URL
  const prefix = localePrefix(locale)
  const url = `${siteUrl}${prefix}/${category}/${slug}`

  const relatedPool = await getStories({
    locale,
    exclude: [slug],
    perPage: 24,
  })
  const related = relatedByContent(article, relatedPool.items, 6)

  const readingLabel = dict.readingTime(article.readingMinutes)

  return (
    <article>
      <ReadingProgress locale={locale} />
      <ArticleJsonLd
        article={article}
        locale={locale}
        url={url}
        siteUrl={siteUrl}
        siteName={dict.siteName}
      />
      <BreadcrumbJsonLd
        locale={locale}
        crumbs={[
          {
            name: locale === 'en' && article.category.nameEn ? article.category.nameEn : article.category.nameNe,
            path: `${prefix}/${category}`,
          },
          { name: title, path: `/${category}/${slug}` },
        ]}
      />
      <SpeakableJsonLd url={url} />

      <header className="mx-auto max-w-body px-4 pt-8 sm:pt-12">
        {/* Visible breadcrumb trail — schema is emitted separately above. */}
        <nav aria-label="breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-caption text-mute sm:mb-6">
          <Link href={locale === 'en' ? '/en' : '/'} className="hover:text-brand-strong" lang={locale === 'en' ? 'en' : 'ne'}>
            {locale === 'en' ? 'Home' : 'गृह'}
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`${prefix}/${category}`}
            className="hover:text-brand-strong"
            lang={locale === 'en' && article.category.nameEn ? 'en' : 'ne'}
          >
            {locale === 'en' && article.category.nameEn ? article.category.nameEn : article.category.nameNe}
          </Link>
        </nav>

        <CategoryLabel category={article.category} locale={locale} as="span" className="mb-3" />
        <h1 className="font-display text-[clamp(2rem,9vw,3.35rem)] font-extrabold leading-[1.12] tracking-[-0.01em] text-ink" lang={titleLang}>
          {title}
        </h1>
        {deck && (
          <p className="mt-4 text-[1.08rem] leading-[1.85] text-ink-soft sm:mt-5 sm:text-[1.25rem]" lang={titleLang}>
            {deck}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-rule py-4 text-meta text-ink-soft">
          <Byline
            authors={article.authors}
            locale={locale}
            publishedAt={article.publishedAt}
            source={article.source}
          />
          <span aria-hidden="true" className="text-mute">·</span>
          <span lang={locale === 'en' ? 'en' : 'ne'}>{readingLabel}</span>
        </div>
        {locale === 'en' && !article.hasEnglish && (
          <p className="mt-4 rounded-lg border border-rule bg-surface-raised px-4 py-3 text-meta text-ink-soft" lang="en">
            This article is not available in English yet. Showing the Nepali edition so the language switch does not break the reading path.
          </p>
        )}
      </header>

      <div className="mx-auto mt-6 max-w-page px-4 sm:mt-8">
        <AdSlot locale={locale} placementKey="article-top-billboard" variant="billboard" />
      </div>

      {article.heroImage && (
        <figure className="mx-auto mt-7 max-w-[72rem] px-4 sm:mt-10">
          <div className="relative overflow-hidden rounded-lg aspect-[16/9]">
            <Image
              src={article.heroImage.url}
              alt={article.heroImage.alt}
              fill
              priority
              unoptimized={article.heroImage.url.startsWith('data:')}
              sizes="(min-width: 768px) 1280px, 100vw"
              className="object-cover"
            />
          </div>
          {(article.heroCaptionNe || article.heroCredit) && (
            <figcaption className="mt-2 text-caption text-ink-soft" lang={titleLang}>
              {locale === 'en' ? article.heroCaptionEn : article.heroCaptionNe}
              {article.heroCredit ? (
                <span className="text-mute">
                  {(locale === 'en' ? article.heroCaptionEn : article.heroCaptionNe) ? ' · ' : ''}
                  {article.heroCredit}
                </span>
              ) : null}
            </figcaption>
          )}
        </figure>
      )}

      <div className="mx-auto mt-7 max-w-page px-4 sm:mt-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,46rem)_300px] lg:items-start lg:justify-center">
          <div className="reading-scale min-w-0">
            <div className="grid gap-4 border-y border-rule py-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <ShareBar url={`${prefix}/${category}/${slug}`} title={title} locale={locale} />
              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                <BookmarkButton story={article} locale={locale} variant="pill" />
                <ReaderArticleControls
                  story={article}
                  locale={locale}
                  title={title}
                  href={`${prefix}/${category}/${slug}`}
                  readingMinutes={article.readingMinutes}
                />
                <FontSizeControl locale={locale} />
              </div>
            </div>

            {article.corrections && article.corrections.length > 0 && (
              <CorrectionNotice corrections={article.corrections} locale={locale} className="mt-6" />
            )}

            <ArticleBody blocks={body} locale={locale} source={article.source} className="mt-8" />

            {article.tags.length > 0 && (
              <TagRow tags={article.tags} locale={locale} className="mt-10" />
            )}

            <AdSlot locale={locale} placementKey="article-native-related" variant="native" className="mt-10" />

            <div className="mt-12">
              <CommentSection
                articleSlug={slug}
                articleCategory={category}
                locale={locale}
                commentsEnabled={article.commentsEnabled !== false}
              />
            </div>
          </div>

          <aside
            aria-label={locale === 'en' ? 'Article advertisements' : 'लेख विज्ञापन'}
            className="hidden gap-5 lg:grid lg:self-start"
          >
            <AdSlot locale={locale} placementKey="article-sidebar-top" variant="rail" />
            <div className="lg:sticky lg:top-24">
              <AdSlot locale={locale} placementKey="article-sidebar-sticky" variant="rail" />
            </div>
          </aside>
        </div>
      </div>

      {related.length > 0 && (
        <RelatedStories
          stories={related}
          locale={locale}
          className="mx-auto mt-16 max-w-page px-4"
        />
      )}

    </article>
  )
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale: rawLocale, category, slug } = await params
  const locale: Locale = asLocale(rawLocale)
  const article = await getArticleBySlug(category, slug, locale)
  const prefix = localePrefix(locale)
  const canonical = `${prefix}/${category}/${slug}`

  if (!article) {
    return { title: getDictionary(locale).notFoundHeading, robots: { index: false } }
  }

  const title = locale === 'en' && article.titleEn ? article.titleEn : article.titleNe
  const description =
    locale === 'en' && article.seoDescriptionEn
      ? article.seoDescriptionEn
      : (article.seoDescriptionNe ?? article.deckNe)

  return {
    title,
    description,
    alternates: {
      canonical: article.canonicalUrl ?? canonical,
      languages: { ne: `/${category}/${slug}`, en: `/en/${category}/${slug}` },
    },
    robots: article.noindex || (locale === 'en' && !article.hasEnglish) ? { index: false, follow: true } : undefined,
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      images: article.heroImage ? [{ url: article.heroImage.url }] : undefined,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: article.authors.map((a) => a.name),
      locale: locale === 'en' ? 'en_US' : 'ne_NP',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: article.heroImage ? [article.heroImage.url] : undefined,
    },
  }
}
