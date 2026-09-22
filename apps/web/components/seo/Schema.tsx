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
export function BreadcrumbJsonLd({ crumbs, locale }: { crumbs: Crumb[]; locale: Locale }) {
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
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
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
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  )
}

/**
 * FAQ JSON-LD. The question and answer text must be the text the page already
 * shows — `lib/seo/structured-content.ts` derives it from the body blocks being
 * rendered, so the markup and the visible page cannot drift apart. Renders
 * nothing when there are no pairs: an empty FAQPage is invalid.
 */
export function FaqJsonLd({ faqs }: { faqs: { question: string; answer: string }[] }) {
  if (faqs.length === 0) return null
  const json = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  }
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  )
}

/**
 * HowTo JSON-LD, for an article that walks a reader through a procedure —
 * registering to vote, filing a right-to-information request. Same rule as the
 * FAQ above: the steps come from the ordered list the page renders.
 */
export function HowToJsonLd({ name, steps, url }: { name: string; steps: string[]; url: string }) {
  if (steps.length === 0) return null
  const json = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    url,
    step: steps.map((text, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      text,
    })),
  }
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
  )
}
