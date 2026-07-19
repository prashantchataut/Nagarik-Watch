import type { Metadata } from 'next'
import Image from 'next/image'
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
import { ShareBar } from '@/components/article/ShareBar'
import { FontSizeControl } from '@/components/article/FontSizeControl'
import { ReadingProgress } from '@/components/article/ReadingProgress'
import { BookmarkButton } from '@/components/reader/BookmarkButton'
import { ReaderArticleControls } from '@/components/reader/ReaderArticleControls'
import { AdSlot } from '@/components/AdSlot'
import { CommentSection } from '@/components/article/CommentSection'
import { SpeculationRules } from '@/components/SpeculationRules'
import { getSession } from '@/lib/auth/session'
import { isPremiumSubscriber } from '@/lib/membership'
import { shouldShowPaywall } from '@/lib/paywall/decision'
import { PUBLICATION, SITE_URL } from '@/lib/site'
import { publicShareImageUrl } from '@/lib/seo/share-image'

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

export async function generateMetadata({ params }: { params: Promise<{ locale: string; category: string; slug: string }> }): Promise<Metadata> {
  const { locale: raw, category, slug } = await params
  const locale = asLocale(raw)
  const article = await getArticleBySlug(category, slug, locale)
  if (!article) return {}
  const title = locale === 'en' && article.seoTitleEn ? article.seoTitleEn : locale === 'en' && article.titleEn ? article.titleEn : article.seoTitleNe || article.titleNe
  const description = locale === 'en' && article.seoDescriptionEn ? article.seoDescriptionEn : article.seoDescriptionNe || (locale === 'en' ? article.deckEn : article.deckNe)
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

export default async function ArticlePage({ params }: { params: Promise<{ locale: string; category: string; slug: string }> }) {
  const { locale: raw, category, slug } = await params
  const locale = asLocale(raw)
  const english = locale === 'en'
  const article = await getArticleBySlug(category, slug, locale)
  if (!article || (english && !article.hasEnglish)) notFound()

  const session = await getSession()
  const premiumReader = await isPremiumSubscriber(session)
  // Server gate for marked-premium articles. Soft free-article meter stays client-side
  // (pass Infinity so non-premium articles are not hard-gated on the server).
  const canReadFull = !shouldShowPaywall({
    isMember: premiumReader,
    freeRemaining: Infinity,
    articlePremium: Boolean(article.premium),
  })
  const body = english && article.bodyEn ? article.bodyEn : article.bodyNe
  const visibleBody = canReadFull ? body : previewBlocks(body)
  const [openingBody, remainingBody] = splitAfterParagraphs(visibleBody)
  const title = english && article.titleEn ? article.titleEn : article.titleNe
  const deck = english && article.deckEn ? article.deckEn : article.deckNe
  const href = localizeHref(locale, `/${category}/${slug}`)
  const canonical = `${SITE_URL}${href}`
  const relatedPool = await getStories({ locale, limit: 40 })
  const related = relatedByContent(article, relatedPool.items, 5)
  const relatedHrefs = related.map((story) =>
    localizeHref(locale, `/${story.category.slug}/${story.slug}`),
  )

  return (
    <article className="pb-12">
      <ReadingProgress locale={locale} />
      <SpeculationRules prerenderUrls={relatedHrefs.slice(0, 2)} prefetchUrls={relatedHrefs} />
      <ArticleJsonLd article={article} locale={locale} url={canonical} siteUrl={SITE_URL} siteName={PUBLICATION.publisherName} />
      <header className="mx-auto max-w-[62rem] px-4 pb-7 pt-10 sm:pt-14" lang={english ? 'en' : 'ne'}>
        <div className="flex flex-wrap items-center gap-2">
          <CategoryLabel category={article.category} locale={locale} />
          {article.premium ? <span className="border border-ink bg-ink px-2 py-0.5 text-caption font-bold uppercase tracking-wide text-surface">{english ? 'Premium' : 'सदस्य'}</span> : null}
        </div>
        <h1 className="mt-5 max-w-[19ch] font-display text-[clamp(2.3rem,6vw,4.5rem)] font-black leading-[1.04] tracking-[-0.025em] text-ink">{title}</h1>
        {deck ? <p className="mt-5 max-w-[48rem] text-[1.2rem] leading-relaxed text-ink-soft sm:text-[1.4rem]">{deck}</p> : null}
        <div className="article-trust-ledger mt-6">
          <Byline authors={article.authors} locale={locale} publishedAt={article.publishedAt} source={article.source} />
          <div className="article-trust-ledger__facts">
            <span>{english ? `${article.readingMinutes} min read` : `${article.readingMinutes} मिनेट पढाइ`}</span>
            {article.updatedAt ? <span>{english ? 'Updated' : 'अद्यावधिक'}: {formatDate(article.updatedAt, locale)}</span> : null}
            {article.factCheckStatus === 'verified' ? <span className="text-up">{english ? 'Facts verified' : 'तथ्य प्रमाणित'}</span> : null}
            {article.source ? <span>{english ? 'Source-linked report' : 'स्रोत लिंक गरिएको समाचार'}</span> : <span>{english ? 'Nagarik Watch newsroom' : 'नागरिक वाच न्युजरुम'}</span>}
          </div>
          <div className="article-trust-ledger__tools">
            <div className="flex flex-wrap items-center gap-2"><BookmarkButton story={article} locale={locale} variant="pill" /><FontSizeControl locale={locale} /></div>
            <ShareBar url={canonical} title={title} locale={locale} articleSlug={slug} articleCategory={category} />
          </div>
        </div>
      </header>

      {article.heroImage ? (
        <figure className="mx-auto max-w-[76rem] px-0 sm:px-4">
          <div className="relative aspect-[16/9] overflow-hidden bg-surface-raised">
            <Image src={article.heroImage.url} alt={article.heroImage.alt} fill priority unoptimized={article.heroImage.url.startsWith('data:')} sizes="(min-width: 1280px) 1216px, 100vw" className="object-cover" />
          </div>
          {(article.heroCaptionNe || article.heroCredit) ? <figcaption className="px-4 pt-2 text-caption leading-relaxed text-ink-soft sm:px-0">{article.heroCaptionNe}{article.heroCaptionNe && article.heroCredit ? ' · ' : ''}{article.heroCredit}</figcaption> : null}
        </figure>
      ) : null}

      <div className="mx-auto mt-8 grid max-w-[76rem] gap-10 px-4 lg:grid-cols-[minmax(0,43rem)_18rem] lg:justify-center">
        <div>
          <ReaderArticleControls story={article} locale={locale} title={title} href={href} readingMinutes={article.readingMinutes} premiumReader={premiumReader} />
          <ArticleBody blocks={openingBody} locale={locale} source={article.source} className="mt-8" />
          <AdSlot locale={locale} placementKey="article-top-billboard" variant="billboard" />
          {remainingBody.length ? <ArticleBody blocks={remainingBody} locale={locale} className="mt-8" /> : null}
          <AdSlot locale={locale} placementKey="article-native-related" variant="native" />
          {!canReadFull ? <PaywallNotice locale={locale} /> : null}
          {article.corrections?.length ? <CorrectionNotice corrections={article.corrections} locale={locale} className="mt-8" /> : null}
          <TagRow tags={article.tags} locale={locale} className="mt-8 border-t border-rule pt-6" />
          <CommentSection articleSlug={article.slug} articleCategory={article.category.slug} locale={locale} commentsEnabled={article.commentsEnabled !== false} />
        </div>
        <aside className="hidden space-y-8 lg:block" aria-label={english ? 'Advertisement' : 'विज्ञापन'}><AdSlot locale={locale} placementKey="article-sidebar-top" variant="rail" /><div className="sticky top-24"><AdSlot locale={locale} placementKey="article-sidebar-sticky" variant="rail" /></div></aside>
      </div>
      <div className="mx-auto mt-14 max-w-page px-4"><RelatedStories stories={related} locale={locale} /></div>
    </article>
  )
}
