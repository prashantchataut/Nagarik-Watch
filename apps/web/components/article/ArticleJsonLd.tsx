import type { Article, Locale } from '@nagarikwatch/db'
import { publicShareImageUrl } from '@/lib/seo/share-image'

type JsonLdProps = {
  article: Article
  locale: Locale
  /** Absolute canonical URL of the article page. */
  url: string
  siteUrl: string
  siteName: string
}

/**
 * NewsArticle JSON-LD for an article page. Emitted as a <script type="application/ld+json">
 * so search engines get a machine-readable citation. Locale-aware: Nepali is the source of
 * truth; the English locale emits the English fields when the article has them.
 *
 * The author list is pulled from the article's authors; wire/aggregated pieces attribute
 * to the source name. Dates are emitted in ISO 8601 as schema requires.
 */
export function ArticleJsonLd({ article, locale, url, siteUrl, siteName }: JsonLdProps) {
  const title = locale === 'en' && article.titleEn ? article.titleEn : article.titleNe
  const description =
    locale === 'en' && article.seoDescriptionEn
      ? article.seoDescriptionEn
      : (article.seoDescriptionNe ?? article.deckNe)

  const authorNames = article.source
    ? [article.source.sourceName]
    : article.authors.map((a) => a.name)

  const authorObjs = (authorNames.length ? authorNames : [siteName]).map((name) => ({
    '@type': 'Person' as const,
    name,
  }))

  const image = [
    publicShareImageUrl(article.heroImage?.url, siteUrl, {
      width: article.heroImage?.width,
      height: article.heroImage?.height,
    }),
  ]

  const json = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description,
    image,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt ?? article.publishedAt,
    author: authorObjs,
    publisher: {
      '@type': 'Organization',
      name: siteName,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl.replace(/\/$/, '')}/icon.svg`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    inLanguage: locale === 'en' ? 'en' : 'ne-NP',
    articleSection:
      locale === 'en' && article.category.nameEn
        ? article.category.nameEn
        : article.category.nameNe,
  }

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  )
}
