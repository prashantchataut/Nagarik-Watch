import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Byline, CategoryLabel } from '@nagarikwatch/ui'
import { formatDate, type ArticleBlock } from '@nagarikwatch/db'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getArticleBySlug, getStories } from '@/lib/content'
import { relatedByContent } from '@/lib/ranking'
import { ArticleBody, CorrectionNotice, TagRow } from '@/components/article/ArticleBody'
import { ArticleJsonLd } from '@/components/article/ArticleJsonLd'
import { PaywallNotice } from '@/components/article/PaywallNotice'
import { RelatedStories } from '@/components/article/RelatedStories'
import { ReadingProgress } from '@/components/article/ReadingProgress'
import { ReaderArticleControls } from '@/components/reader/ReaderArticleControls'
import { AdSlot } from '@/components/AdSlot'
import { CommentSection } from '@/components/article/CommentSection'
import { SpeculationRules } from '@/components/SpeculationRules'
import { SpeakableJsonLd } from '@/components/seo/Schema'
import { PrintButton } from '@/components/article/PrintButton'
import { ReactionBar } from '@/components/article/ReactionBar'
import { ShareBar } from '@/components/article/ShareBar'
import { getSession } from '@/lib/auth/session'
import { isPremiumSubscriber, isPublicMembershipEnabled } from '@/lib/membership'
import { shouldShowPaywall } from '@/lib/paywall/decision'
import { PUBLICATION, SITE_URL } from '@/lib/site'
import { publicShareImageUrl } from '@/lib/seo/share-image'


import { staticArticleParams } from '@/lib/static-export-params'
export const dynamic = 'force-static'

export function generateStaticParams() {
  return staticArticleParams()
}

function previewBlocks(blocks: ArticleBlock[]): ArticleBlock[] {
  let paragraphs = 0
  const preview: ArticleBlock[] = []
  for (const block of blocks) {
    if (block.type === 'paragraph') paragraphs += 1
    preview.push(block)
    if (paragraphs >= 3) break
  }
  return preview
}

function splitAfterParagraphs(blocks: ArticleBlock[], count = 3): [ArticleBlock[], ArticleBlock[]] {
  let paragraphs = 0
  const splitAt = blocks.findIndex((block) => {
    if (block.type === 'paragraph') paragraphs += 1
    return paragraphs >= count
  })
  if (splitAt < 0) return [blocks, []]
  return [blocks.slice(0, splitAt + 1), blocks.slice(splitAt + 1)]
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>
}): Promise<Metadata> {
  const { locale: raw, category, slug } = await params
  const locale = asLocale(raw)
  const article = await getArticleBySlug(category, slug, locale)
  if (!article) return {}
  const title =
    locale === 'en' && article.seoTitleEn
      ? article.seoTitleEn
      : locale === 'en' && article.titleEn
        ? article.titleEn
        : article.seoTitleNe || article.titleNe
  const description =
    locale === 'en' && article.seoDescriptionEn
      ? article.seoDescriptionEn
      : article.seoDescriptionNe || (locale === 'en' ? article.deckEn : article.deckNe)
  const canonical = `${SITE_URL}${localizeHref(locale, `/${category}/${slug}`)}`
  const shareImage = publicShareImageUrl(article.heroImage?.url, SITE_URL, {
    width: article.heroImage?.width,
    height: article.heroImage?.height,
  })
  const nePath = `/${category}/${slug}`
  const enPath = `/en/${category}/${slug}`
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: article.hasEnglish
        ? { ne: nePath, en: enPath, 'x-default': nePath }
        : { ne: nePath, 'x-default': nePath },
    },
    robots: article.noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'article',
      title,
      description,
      url: canonical,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      images: [{ url: shareImage, alt: article.heroImage?.alt || title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [shareImage],
    },
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ locale: string; category: string; slug: string }>
}) {
  const { locale: raw, category, slug } = await params
  const locale = asLocale(raw)
  const english = locale === 'en'
  const article = await getArticleBySlug(category, slug, locale)
  if (!article) notFound()
  // English locale without a reviewed translation: serve Nepali with an honest notice
  // and a one-click switch back to the Nepali URL, instead of a hard dead-end 404.
  const englishMissing = english && !article.hasEnglish
  const readingLocale = englishMissing ? 'ne' : locale
  const readingEnglish = readingLocale === 'en'

  const membershipPublic = isPublicMembershipEnabled()
  const session = membershipPublic ? await getSession() : null
  const premiumReader = membershipPublic ? await isPremiumSubscriber(session) : false
  // Option A: free-to-read. When membership is public, premium articles may soft-gate.
  const canReadFull = membershipPublic
    ? !shouldShowPaywall({
        isMember: premiumReader,
        freeRemaining: Infinity,
        articlePremium: Boolean(article.premium),
      })
    : true
  const body = readingEnglish && article.bodyEn ? article.bodyEn : article.bodyNe
  const visibleBody = canReadFull ? body : previewBlocks(body)
  const [openingBody, remainingBody] = splitAfterParagraphs(visibleBody)
  const title = readingEnglish && article.titleEn ? article.titleEn : article.titleNe
  const deck = readingEnglish && article.deckEn ? article.deckEn : article.deckNe
  const href = localizeHref(readingLocale, `/${category}/${slug}`)
  const canonical = `${SITE_URL}${href}`
  const relatedPool = await getStories({ locale: readingLocale, limit: 40 })
  const related = relatedByContent(article, relatedPool.items, 5)
  const relatedHrefs = related.map((story) =>
    localizeHref(readingLocale, `/${story.category.slug}/${story.slug}`),
  )

  return (
    <article className="pb-12 print:pb-0">
      <SpeculationRules prerenderUrls={relatedHrefs.slice(0, 2)} prefetchUrls={relatedHrefs} />
      <ArticleJsonLd
        article={article}
        locale={readingLocale}
        url={canonical}
        siteUrl={SITE_URL}
        siteName={PUBLICATION.publisherName}
      />
      <SpeakableJsonLd
        url={canonical}
        cssSelectors={['article h1', 'article .article-deck']}
      />
      <header
        className="mx-auto max-w-[43rem] px-4 pb-7 pt-10 sm:pt-14"
        lang={readingEnglish ? 'en' : 'ne'}
      >
        {englishMissing ? (
          <p
            className="mb-4 border border-rule bg-surface-raised px-3 py-2 text-meta text-ink-soft print:hidden"
            lang="en"
            role="status"
          >
            An English translation is not available for this story yet. Showing the Nepali edition.{' '}
            <Link href={`/${category}/${slug}`} className="font-bold text-brand-strong underline-offset-2 hover:underline">
              Open Nepali URL
            </Link>
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-2">
          <CategoryLabel category={article.category} locale={readingLocale} />
          {membershipPublic && article.premium ? (
            <span className="border border-ink bg-ink px-2 py-0.5 text-caption font-bold uppercase tracking-wide text-surface">
              {readingEnglish ? 'Premium' : 'सदस्य'}
            </span>
          ) : null}
          <PrintButton locale={readingLocale} className="ml-auto print:hidden" />
        </div>
        <h1 className="mt-5 max-w-[19ch] font-display text-[clamp(2.3rem,6vw,4.5rem)] font-black leading-[1.04] tracking-[-0.025em] text-ink">
          {title}
        </h1>
        {deck ? (
          <p className="article-deck mt-5 max-w-[48rem] text-[1.2rem] leading-relaxed text-ink-soft sm:text-[1.4rem]">
            {deck}
          </p>
        ) : null}
        <div className="article-trust-ledger mt-6">
          <Byline
            authors={article.authors}
            locale={readingLocale}
            publishedAt={article.publishedAt}
            source={article.source}
          />
          <ShareBar
            url={canonical}
            title={title}
            locale={readingLocale}
            articleSlug={slug}
            articleCategory={category}
            className="mt-4 print:hidden"
          />
          <details className="article-trust-ledger__facts mt-4 print:hidden">
            <summary className="cursor-pointer text-meta font-semibold text-ink-soft">
              {readingEnglish ? 'About this story' : 'यस समाचारबारे'}
            </summary>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-meta text-mute">
              <span>
                {readingEnglish
                  ? `${article.readingMinutes} min read`
                  : `${article.readingMinutes} मिनेट पढाइ`}
              </span>
              {article.updatedAt ? (
                <span>
                  {readingEnglish ? 'Updated' : 'अद्यावधिक'}: {formatDate(article.updatedAt, readingLocale)}
                </span>
              ) : null}
              {article.factCheckStatus === 'verified' ? (
                <span className="text-up">{readingEnglish ? 'Facts verified' : 'तथ्य प्रमाणित'}</span>
              ) : null}
              {article.source ? (
                <span>{readingEnglish ? 'Source-linked report' : 'स्रोत लिंक गरिएको समाचार'}</span>
              ) : (
                <span>{readingEnglish ? 'Nagarik Watch newsroom' : 'नागरिक वाच न्युजरुम'}</span>
              )}
            </div>
          </details>
        </div>
      </header>

      {article.heroImage ? (
        <figure className="mx-auto max-w-[76rem] px-0 sm:px-4">
          <div className="relative aspect-[16/9] overflow-hidden bg-surface-raised">
            <Image
              src={article.heroImage.url}
              alt={article.heroImage.alt}
              fill
              priority
              unoptimized={article.heroImage.url.startsWith('data:')}
              sizes="(min-width: 1280px) 1216px, 100vw"
              className="object-cover"
            />
          </div>
          {article.heroCaptionNe || article.heroCredit ? (
            <figcaption className="px-4 pt-2 text-caption leading-relaxed text-ink-soft sm:px-0">
              {article.heroCaptionNe}
              {article.heroCaptionNe && article.heroCredit ? ' · ' : ''}
              {article.heroCredit}
            </figcaption>
          ) : null}
        </figure>
      ) : null}

      <div className="mx-auto mt-8 grid max-w-[76rem] gap-10 px-4 lg:grid-cols-[minmax(0,43rem)_18rem] lg:justify-center">
        <div id="article-reading-column">
          <ReadingProgress locale={readingLocale} targetId="article-reading-column" />
          <ArticleBody
            blocks={openingBody}
            locale={readingLocale}
            source={article.source}
            className="mt-8"
          />
          <AdSlot locale={readingLocale} placementKey="article-top-billboard" variant="billboard" className="print:hidden" />
          {remainingBody.length ? (
            <ArticleBody blocks={remainingBody} locale={readingLocale} className="mt-8" />
          ) : null}
          <ReactionBar
            locale={readingLocale}
            articleSlug={slug}
            articleCategory={category}
          />
          <ShareBar
            url={canonical}
            title={title}
            locale={readingLocale}
            articleSlug={slug}
            articleCategory={category}
            className="mt-6 print:hidden"
          />
          <div className="mt-8 border-t border-rule pt-5 print:hidden">
            <ReaderArticleControls
              story={article}
              locale={readingLocale}
              title={title}
              href={href}
              shareUrl={canonical}
              articleSlug={slug}
              articleCategory={category}
              readingMinutes={article.readingMinutes}
              premiumReader={premiumReader}
              membershipPublic={membershipPublic}
            />
          </div>
          <AdSlot locale={readingLocale} placementKey="article-native-related" variant="native" className="print:hidden" />
          {membershipPublic && !canReadFull ? <PaywallNotice locale={readingLocale} /> : null}
          {article.corrections?.length ? (
            <CorrectionNotice corrections={article.corrections} locale={readingLocale} className="mt-8" />
          ) : null}
          <p className="mt-6 text-meta text-ink-soft print:hidden" lang={readingEnglish ? 'en' : 'ne'}>
            {readingEnglish ? 'See an error?' : 'त्रुटि देख्नुभयो?'}{' '}
            <Link
              href={localizeHref(readingLocale, '/contact')}
              className="font-semibold text-brand-strong underline-offset-2 hover:underline"
            >
              {readingEnglish ? 'Request a correction' : 'सच्याइ अनुरोध गर्नुहोस्'}
            </Link>
            {' · '}
            <Link
              href={localizeHref(readingLocale, '/corrections-policy')}
              className="font-semibold text-brand-strong underline-offset-2 hover:underline"
            >
              {readingEnglish ? 'Corrections policy' : 'सच्याइ नीति'}
            </Link>
          </p>
          <TagRow tags={article.tags} locale={readingLocale} className="mt-8 border-t border-rule pt-6" />
          <div className="print:hidden">
            <CommentSection
              articleSlug={article.slug}
              articleCategory={article.category.slug}
              locale={readingLocale}
              commentsEnabled={article.commentsEnabled !== false}
            />
          </div>
        </div>
        <aside
          className="hidden space-y-8 print:hidden lg:block"
          aria-label={readingEnglish ? 'Advertisement' : 'विज्ञापन'}
        >
          <AdSlot locale={readingLocale} placementKey="article-sidebar-top" variant="rail" />
          <div className="sticky top-24">
            <AdSlot locale={readingLocale} placementKey="article-sidebar-sticky" variant="rail" />
          </div>
        </aside>
      </div>
      <div className="mx-auto mt-14 max-w-page px-4 print:hidden">
        <RelatedStories stories={related} locale={readingLocale} />
      </div>
    </article>
  )
}
