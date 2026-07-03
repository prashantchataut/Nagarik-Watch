import type { Locale } from '@nagarikwatch/db'
import { SITE_URL } from '@/lib/site'

type Crumb = {
  name: string
  /** Locale-relative path, e.g. "/politics" or "/en/politics". */
  path: string
  lang?: string
}

/**
 * BreadcrumbList JSON-LD. Emits the breadcrumb trail so search engines render
 * it inline in the SERP (e.g. नागरिक वाच › राजनीति › article title) and so AI
 * crawlers understand the site hierarchy.
 *
 * The home crumb is always first; pass additional crumbs in order. Paths are
 * resolved against SITE_URL.
 */
export function BreadcrumbJsonLd({
  crumbs,
  locale,
}: {
  crumbs: Crumb[]
  locale: Locale
}) {
  const prefix = locale === 'en' ? '/en' : ''
  const fullCrumbs: Crumb[] = [
    { name: locale === 'en' ? 'Home' : 'गृहपृष्ठ', path: prefix || '/', lang: locale },
    ...crumbs,
  ]

  const json = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: fullCrumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${SITE_URL}${c.path}`,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  )
}

/**
 * Speakable JSON-LD. Marks the parts of the page that are most useful for
 * text-to-speech and voice-assistant reads (the headline + deck). Makes the
 * site eligible for Google Assistant "read this" and other voice surfaces.
 */
export function SpeakableJsonLd({
  url,
  cssSelectors = ['article h1', 'article .deck'],
}: {
  url: string
  cssSelectors?: string[]
}) {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: cssSelectors,
    },
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  )
}

/**
 * FAQ JSON-LD. For pages that surface a Q&A block (fact-check methodology,
 * about, contact, election process). Pairs with visible FAQ markup so the Q&A
 * is both human- and machine-readable. Eligible for rich results + AI answers.
 */
export function FaqJsonLd({
  faqs,
}: {
  faqs: { questionNe: string; answerNe: string; questionEn?: string; answerEn?: string }[]
}) {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.questionNe,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answerNe,
      },
    })),
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  )
}
