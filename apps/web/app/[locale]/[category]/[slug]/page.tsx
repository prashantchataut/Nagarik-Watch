import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { Byline, CategoryLabel } from '@nagarikwatch/ui'
import { formatDate, type ArticleBlock } from '@nagarikwatch/db'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getArticleBySlug, getStories } from '@/lib/content'
import { resolveSlugRedirect } from '@/lib/content/slug-redirects'
import { relatedByContent } from '@/lib/ranking'
import { ArticleBody, CorrectionNotice, TagRow } from '@/components/article/ArticleBody'
import { ArticleJsonLd } from '@/components/article/ArticleJsonLd'
import { PaywallNotice } from '@/components/article/PaywallNotice'
import { RelatedStories } from '@/components/article/RelatedStories'
import { ReadingProgress } from '@/components/article/ReadingProgress'
import { ReaderArticleControls } from '@/components/reader/ReaderArticleControls'
import { DenseStoryItem } from '@/components/home/DenseStoryItem'
import { AdSlot } from '@/components/AdSlot'
import { CommentSection } from '@/components/article/CommentSection'
import { SpeculationRules } from '@/components/SpeculationRules'
import { SpeakableJsonLd } from '@/components/seo/Schema'
import { DocumentLang } from '@/components/DocumentLang'
import { PrintButton } from '@/components/article/PrintButton'
import { ReactionBar } from '@/components/article/ReactionBar'
import { ShareBar } from '@/components/article/ShareBar'
import { NextStoryNavigator } from '@/components/article/NextStoryNavigator'
import { getSession } from '@/lib/auth/session'
import { isPremiumSubscriber, isPublicMembershipEnabled } from '@/lib/membership'
import { shouldShowPaywall } from '@/lib/paywall/decision'
import { PUBLICATION, SITE_URL } from '@/lib/site'
import { publicShareImageUrl } from '@/lib/seo/share-image'

import { staticArticleParams } from '@/lib/static-export-params'

// Must be a string literal — Next rejects ConditionalExpression segment config.
export const revalidate = 60

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
  const useEnglish = locale === 'en' && Boolean(article.hasEnglish)
  const titleRaw =
    useEnglish && article.seoTitleEn
      ? article.seoTitleEn
      : useEnglish && article.titleEn
        ? article.titleEn
        : article.seoTitleNe || article.titleNe
  const title = titleRaw.trim() || (useEnglish ? 'Article' : 'लेख')
  const description =
    useEnglish && article.seoDescriptionEn
      ? article.seoDescriptionEn
      : article.seoDescriptionNe || (useEnglish ? article.deckEn : article.deckNe)
  const canonical = `${SITE_URL}${localizeHref(useEnglish ? 'en' : 'ne', `/${category}/${slug}`)}`
  const shareImage = publicShareImageUrl(article.heroImage?.url, SITE_URL, {
    width: article.heroImage?.width,
    height: article.heroImage?.height,
  })
  const nePath = `/${category}/${slug}`
  const enPath = `/en/${category}/${slug}`
  return {
    title: { absolute: `${title} | Nagarik Watch` },
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
      locale: useEnglish ? 'en_NP' : 'ne_NP',
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
  if (!article) {
    const dest = await resolveSlugRedirect(category, slug).catch(() => null)
    if (dest) {
      permanentRedirect(localizeHref(locale, `/${dest.category}/${dest.slug}`))
    }
    notFound()
  }
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
  const showAds = !article.adFree
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
    <article className="pb-10 print:pb-0" lang={readingEnglish ? 'en' : 'ne'}>
      {englishMissing ? <DocumentLang lang="ne" /> : null}
      <SpeculationRules prerenderUrls={relatedHrefs.slice(0, 2)} prefetchUrls={relatedHrefs} />
      <ArticleJsonLd
        article={article}
        locale={readingLocale}
        url={canonical}
        siteUrl={SITE_URL}
        siteName={PUBLICATION.publisherName}
      />
      <SpeakableJsonLd url={canonical} cssSelectors={['article h1', 'article .article-deck']} />

      <div className="mx-auto max-w-page px-3 pt-4 sm:px-4 sm:pt-5">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(16rem,18rem)] lg:items-start lg:gap-x-8">
          <div className="min-w-0">
            <header
              className="max-w-body border-b border-rule pb-5"
              lang={readingEnglish ? 'en' : 'ne'}
            >
              {englishMissing ? (
                <p
                  className="mb-4 border border-rule bg-surface-raised px-3 py-2 text-meta text-ink-soft print:hidden"
                  lang="en"
                  role="status"
                >
                  An English translation is not available for this story yet. Showing the Nepali
                  edition.{' '}
                  <Link
                    href={`/${category}/${slug}`}
                    className="font-bold text-brand-strong underline-offset-2 hover:underline"
                  >
                    Open Nepali URL
                  </Link>
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <CategoryLabel category={article.category} locale={readingLocale} />
                {membershipPublic && article.premium ? (
                  <span className="rounded-sm bg-ink px-2 py-0.5 text-caption font-bold text-paper">
                    {readingEnglish ? 'Member' : 'सदस्य'}
                  </span>
                ) : null}
                <PrintButton locale={readingLocale} className="ml-auto print:hidden" />
              </div>
              <h1 className="mt-3 text-pretty font-display text-[clamp(2.05rem,4.5vw,3.25rem)] font-black leading-[1.12] tracking-[-0.025em] text-ink">
                {title}
              </h1>
              {deck ? (
                <p className="article-deck mt-3 max-w-[44rem] text-body leading-relaxed text-ink-soft sm:text-body-lg sm:leading-relaxed">
                  {deck}
                </p>
              ) : null}
              <div className="article-trust-ledger mt-4">
                <Byline
                  authors={article.authors}
                  locale={readingLocale}
                  publishedAt={article.publishedAt}
                  source={article.source}
                />
                <dl className="article-trust-ledger__facts mt-3">
                  <div>
                    <dt className="sr-only">{readingEnglish ? 'Reading time' : 'पढाइ समय'}</dt>
                    <dd>
                      {readingEnglish
                        ? `${article.readingMinutes} min read`
                        : `${article.readingMinutes} मिनेट पढाइ`}
                    </dd>
                  </div>
                  {article.updatedAt ? (
                    <div>
                      <dt className="sr-only">{readingEnglish ? 'Updated' : 'अद्यावधिक'}</dt>
                      <dd>
                        {readingEnglish ? 'Updated' : 'अद्यावधिक'}:{' '}
                        {formatDate(article.updatedAt, readingLocale)}
                      </dd>
                    </div>
                  ) : null}
                  {article.factCheckStatus === 'verified' ? (
                    <div>
                      <dt className="sr-only">{readingEnglish ? 'Fact check' : 'तथ्य जाँच'}</dt>
                      <dd className="text-up">
                        {readingEnglish ? 'Facts verified' : 'तथ्य प्रमाणित'}
                      </dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="sr-only">{readingEnglish ? 'Source' : 'स्रोत'}</dt>
                    <dd>
                      {article.source
                        ? readingEnglish
                          ? 'Source-linked report'
                          : 'स्रोत लिंक गरिएको समाचार'
                        : readingEnglish
                          ? 'Nagarik Watch newsroom'
                          : 'नागरिक वाच न्युजरुम'}
                    </dd>
                  </div>
                </dl>
              </div>
            </header>

            {article.heroImage ? (
              <figure className="mt-4 max-w-body">
                <div className="relative aspect-[16/9] overflow-hidden bg-surface-raised">
                  <Image
                    src={article.heroImage.url}
                    alt={article.heroImage.alt}
                    fill
                    priority
                    unoptimized={article.heroImage.url.startsWith('data:')}
                    sizes="(min-width: 1024px) 680px, 100vw"
                    className="object-cover"
                  />
                </div>
                {article.heroCaptionNe || article.heroCredit ? (
                  <figcaption className="mt-1.5 text-caption leading-relaxed text-ink-soft">
                    {article.heroCaptionNe}
                    {article.heroCaptionNe && article.heroCredit ? ', ' : ''}
                    {article.heroCredit}
                  </figcaption>
                ) : null}
              </figure>
            ) : null}

            <div id="article-reading-column" className="mt-4 max-w-body min-w-0">
              <div className="sticky top-[4.25rem] z-30 -mx-1 mb-4 border-b border-rule bg-surface px-1 py-1.5 print:hidden sm:top-[5rem]">
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
              <ReadingProgress locale={readingLocale} targetId="article-reading-column" />
              {deck ? (
                <div className="my-5 rounded-lg border border-brand/30 bg-brand-tint/40 p-4 sm:p-5">
                  <div className="flex items-center gap-2 font-display font-extrabold text-body text-brand-strong mb-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-paper text-xs">
                      📌
                    </span>
                    <span>{readingEnglish ? 'Key Takeaways' : 'मुख्य बुँदाहरू'}</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1.5 text-body text-ink leading-relaxed">
                    <li>{deck}</li>
                  </ul>
                </div>
              ) : null}
              <ArticleBody
                blocks={openingBody}
                locale={readingLocale}
                source={article.source}
                className="mt-2"
                suppressAds={!showAds}
              />
              {showAds ? (
                <AdSlot
                  locale={readingLocale}
                  placementKey="article-top-billboard"
                  variant="billboard"
                  className="print:hidden"
                />
              ) : null}
              {remainingBody.length ? (
                <ArticleBody
                  blocks={remainingBody}
                  locale={readingLocale}
                  className="mt-8"
                  suppressAds={!showAds}
                />
              ) : null}
              <ReactionBar locale={readingLocale} articleSlug={slug} articleCategory={category} />
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-5 print:hidden">
                <ShareBar
                  url={canonical}
                  title={title}
                  locale={readingLocale}
                  articleSlug={slug}
                  articleCategory={category}
                  variant="compact"
                />
              </div>
              {showAds ? (
                <AdSlot
                  locale={readingLocale}
                  placementKey="article-native-related"
                  variant="native"
                  className="print:hidden"
                />
              ) : null}
              {membershipPublic && !canReadFull ? <PaywallNotice locale={readingLocale} /> : null}
              {article.corrections?.length ? (
                <CorrectionNotice
                  corrections={article.corrections}
                  locale={readingLocale}
                  className="mt-8"
                />
              ) : null}
              <p
                className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-meta text-ink-soft print:hidden"
                lang={readingEnglish ? 'en' : 'ne'}
              >
                <span>{readingEnglish ? 'See an error?' : 'त्रुटि देख्नुभयो?'}</span>
                <Link
                  href={localizeHref(readingLocale, '/contact')}
                  className="font-semibold text-brand-strong underline-offset-2 hover:underline"
                >
                  {readingEnglish ? 'Request a correction' : 'सच्याइ अनुरोध गर्नुहोस्'}
                </Link>
                <Link
                  href={localizeHref(readingLocale, '/corrections-policy')}
                  className="font-semibold text-brand-strong underline-offset-2 hover:underline"
                >
                  {readingEnglish ? 'Corrections policy' : 'सच्याइ नीति'}
                </Link>
              </p>
              <TagRow
                tags={article.tags}
                locale={readingLocale}
                className="mt-8 border-t border-rule pt-6"
              />
              <NextStoryNavigator
                nextStory={related[0]}
                prevStory={related[1]}
                locale={readingLocale}
              />
              <div className="print:hidden">
                <CommentSection
                  articleSlug={article.slug}
                  articleCategory={article.category.slug}
                  locale={readingLocale}
                  commentsEnabled={article.commentsEnabled !== false}
                />
              </div>
            </div>
          </div>

          <aside
            className="mt-8 hidden space-y-5 print:hidden lg:mt-0 lg:block"
            aria-label={readingEnglish ? 'Related and ads' : 'सम्बन्धित र विज्ञापन'}
          >
            {related.length > 0 ? (
              <div>
                <p
                  className="mb-2 text-meta font-extrabold text-brand-strong"
                  lang={readingEnglish ? 'en' : 'ne'}
                >
                  {readingEnglish ? 'Also read' : 'यो पनि पढ्नुहोस्'}
                </p>
                <span className="mb-2 block h-0.5 w-10 bg-brand" aria-hidden="true" />
                <ul className="divide-y divide-rule border-y border-rule">
                  {related.slice(0, 6).map((story) => (
                    <li key={story.id} className="py-2">
                      <DenseStoryItem
                        story={story}
                        locale={readingLocale}
                        thumb="sm"
                        showDeck={false}
                        showMeta
                        showDateline={false}
                        compact
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {showAds ? (
              <div className="space-y-5">
                <AdSlot locale={readingLocale} placementKey="article-sidebar-top" variant="rail" />
                <div className="sticky top-24 space-y-5">
                  <AdSlot
                    locale={readingLocale}
                    placementKey="article-sidebar-sticky"
                    variant="rail"
                  />
                </div>
              </div>
            ) : null}
          </aside>
        </div>

        <div className="mt-8 border-t border-rule pt-6 print:hidden">
          <RelatedStories stories={related} locale={readingLocale} />
        </div>
      </div>
    </article>
  )
}
