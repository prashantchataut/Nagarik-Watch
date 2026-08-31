/**
 * SEO kit — metadata builders + JSON-LD structured data.
 * Used by the real route tree (repo deployment) and importable anywhere.
 * Canonical URLs come from NEXT_PUBLIC_SITE_URL (default nagarikwatch.com).
 */

import type { Story } from './data'
import { deskBySlug } from './data'

export const SITE = {
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nagarikwatch.com').replace(/\/+$/, ''),
  nameNe: 'नागरिक वाच',
  nameEn: 'Nagarik Watch',
  shortNe: 'नागरिक वाच',
  sloganNe: 'नेपालको डेवनागरी-प्रथम डिजिटल समाचार प्लेटफर्म',
  locale: 'ne_NP',
  twitter: '@nagarikwatch',
  publisherLogo: '/icon.svg',
  ogImage: '/og-image.jpg',
}

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path
  return `${SITE.url}${path.startsWith('/') ? path : `/${path}`}`
}

export function articlePath(story: Story): string {
  return `/${story.desk}/${story.slug}`
}

/** BS date → ISO-ish display for og:article:published_time we use the AD stamp. */
function isoDate(story: Story): string {
  return new Date(story.publishedAt).toISOString()
}

export function buildArticleTitle(story: Story): string {
  return `${story.titleNe} — ${SITE.nameNe}`
}

export function buildArticleDescription(story: Story): string {
  const plain = story.deckNe.replace(/\s+/g, ' ').trim()
  return plain.length > 170 ? plain.slice(0, 167) + '…' : plain
}

/* ------------------------------- JSON-LD -------------------------------- */

export function jsonLdOrganization() {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: SITE.nameNe,
    alternateName: SITE.nameEn,
    url: SITE.url,
    slogan: SITE.sloganNe,
    logo: {
      '@type': 'ImageObject',
      url: absoluteUrl(SITE.publisherLogo),
    },
    sameAs: [
      'https://www.facebook.com/nagarikwatch',
      'https://twitter.com/nagarikwatch',
      'https://www.youtube.com/@nagarikwatch',
    ],
    knowsLanguage: ['ne', 'en'],
    publishingPrinciples: absoluteUrl('/ethics'),
    diversityPolicy: absoluteUrl('/ethics'),
    masthead: absoluteUrl('/about'),
  }
}

export function jsonLdWebSite() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE.nameNe,
    alternateName: SITE.nameEn,
    url: SITE.url,
    inLanguage: ['ne', 'en'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function jsonLdNewsArticle(story: Story) {
  const desk = deskBySlug.get(story.desk)
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': absoluteUrl(articlePath(story)),
    },
    headline: story.titleNe,
    alternativeHeadline: story.titleEn || undefined,
    description: buildArticleDescription(story),
    articleSection: desk?.nameNe ?? story.desk,
    inLanguage: 'ne',
    isAccessibleForFree: story.premium ? false : true,
    datePublished: isoDate(story),
    dateModified: isoDate(story),
    image: [absoluteUrl(story.hero)],
    author: {
      '@type': 'Person',
      name: story.author,
      worksFor: { '@type': 'Organization', name: SITE.nameNe },
    },
    publisher: {
      '@type': 'Organization',
      name: SITE.nameNe,
      logo: { '@type': 'ImageObject', url: absoluteUrl(SITE.publisherLogo) },
    },
    keywords: story.tags.join(', '),
    contentLocation: {
      '@type': 'Place',
      name: story.location,
      address: { '@type': 'PostalAddress', addressCountry: 'NP' },
    },
  }
}

export function jsonLdBreadcrumb(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function jsonLdItemList(name: string, stories: Story[], listPath: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    itemListElement: stories.slice(0, 20).map((story, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: absoluteUrl(articlePath(story)),
      name: story.titleNe,
    })),
    url: absoluteUrl(listPath),
  }
}

/** Serialize JSON-LD objects into <script> tag bodies. */
export function jsonLdScript(data: object[]): string {
  return data.map((d) => JSON.stringify(d).replace(/</g, '\\u003c')).join('___SPLIT___')
}
