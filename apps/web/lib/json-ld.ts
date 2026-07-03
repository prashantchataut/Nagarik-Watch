/**
 * JSON-LD builders for the schema types Nagarik Watch emits beyond NewsArticle
 * and Organization/WebSite (those live in components/article/ArticleJsonLd.tsx
 * and components/SiteJsonLd.tsx).
 *
 * Each builder returns a plain schema.org object; callers wrap it in a
 * `<script type="application/ld+json">` tag (see the existing JsonLd components
 * for the pattern). Locale-aware: Nepali is the source of truth, English is
 * surfaced when available and the locale is `en`.
 *
 * Ported from an evaluation rebuild (formerly apps/portal/src/lib/seo.ts) and
 * adapted to this app's content model (types from @nagarikwatch/db).
 */
import type { Author, Locale } from '@nagarikwatch/db'
import { SITE_URL } from './site'

/** Absolute URL helper — keeps paths consistent with SITE_URL (no trailing slash). */
export function absolute(path: string): string {
  if (path.startsWith('http')) return path
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

/** BreadcrumbList — emit on any multi-level page (article, section, topic). */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absolute(it.path),
    })),
  }
}

/** Person — for author profile pages (/author/[slug]).
 *  Author.name is a single field (not locale-split); bio is locale-aware. */
export function personJsonLd(author: Author, locale: Locale) {
  const bio = locale === 'en' ? author.bioEn : author.bioNe
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    url: absolute(`/author/${author.slug}`),
    image: author.photo?.url,
    description: bio,
    jobTitle: author.role,
    knowsAbout: author.expertise,
    worksFor: { '@type': 'NewsMediaOrganization', name: 'Nagarik Watch' },
    sameAs: author.social ? Object.values(author.social).filter(Boolean) : undefined,
  }
}

/** FAQPage — for FAQ / explainer pages. */
export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

/**
 * Speakable — marks the parts of a page voice assistants should read aloud.
 * Pair with `data-speakable` attributes on the article headline + summary.
 */
export function speakableJsonLd(path: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url: absolute(path),
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['[data-speakable]', 'h1'],
    },
  }
}

/** ImageGallery — for photo-story pages. */
export function imageGalleryJsonLd(g: {
  title: string
  path: string
  description?: string
  images: { url: string; caption?: string }[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name: g.title,
    description: g.description,
    url: absolute(g.path),
    image: g.images.map((img) => ({
      '@type': 'ImageObject',
      contentUrl: absolute(img.url),
      caption: img.caption,
    })),
  }
}

/** LiveBlogPosting — for live coverage pages. */
export function liveBlogJsonLd(lb: {
  title: string
  path: string
  status: string
  startedAt?: string
  endedAt?: string
  updates: { body: string; createdAt: string; isKey?: boolean }[]
}) {
  const now = new Date().toISOString()
  return {
    '@context': 'https://schema.org',
    '@type': 'LiveBlogPosting',
    headline: lb.title,
    url: absolute(lb.path),
    datePublished: lb.startedAt ?? now,
    dateModified: lb.updates[0]?.createdAt ?? now,
    coverageEndTime: lb.endedAt,
    liveBlogUpdate: lb.updates.map((u) => ({
      '@type': 'BlogPosting',
      datePublished: u.createdAt,
      articleBody: u.body,
    })),
  }
}

/** VideoObject — for video articles / embeds. */
export function videoObjectJsonLd(v: {
  title: string
  description?: string
  thumbnailUrl?: string
  uploadDate: string
  contentUrl?: string
  embedUrl?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: v.title,
    description: v.description,
    thumbnailUrl: v.thumbnailUrl,
    uploadDate: v.uploadDate,
    contentUrl: v.contentUrl,
    embedUrl: v.embedUrl,
  }
}
