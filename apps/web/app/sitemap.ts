import type { MetadataRoute } from 'next'
import { getStories, getNavCategories } from '@/lib/content'
import { seedTags, seedAuthors } from '@/lib/content/seed-source'

/**
 * Dynamic sitemap. Emits one <url> per locale (ne at root, en under /en) for every article,
 * category, author, and topic that the site can render, so crawlers discover the full
 * bilingual corpus. lastmod comes from the article's updatedAt/publishedAt where available.
 *
 * The article, category, and author lists are read through the content façade so this stays
 * correct when the source swaps from seed to Payload. Tags and authors currently come from
 * the seed exports (the façade has no list-tags/list-authors method); this is fine for the
 * seed-backed demo and is the single place to update when those lists move to the CMS.
 */
const LOCALES = ['ne', 'en'] as const
type SLocale = (typeof LOCALES)[number]

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

function prefix(locale: SLocale): string {
  return locale === 'en' ? '/en' : ''
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  // Homepage, per locale.
  for (const locale of LOCALES) {
    entries.push({
      url: `${SITE_URL}${prefix(locale) || '/'}`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
      alternates: { languages: { ne: `${SITE_URL}/`, en: `${SITE_URL}/en` } },
    })
  }

  // Static info pages (about, ethics, privacy, contact). Linked from the footer and served
  // bilingually, so advertise both locales.
  const STATIC_PAGES = ['about', 'ethics', 'privacy', 'contact'] as const
  for (const locale of LOCALES) {
    for (const page of STATIC_PAGES) {
      entries.push({
        url: `${SITE_URL}${prefix(locale)}/${page}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.4,
        alternates: {
          languages: {
            ne: `${SITE_URL}/${page}`,
            en: `${SITE_URL}/en/${page}`,
          },
        },
      })
    }
  }

  // Categories (nav-visible). Locale-specific names resolve on the page itself.
  const categories = await getNavCategories()
  for (const locale of LOCALES) {
    for (const c of categories) {
      entries.push({
        url: `${SITE_URL}${prefix(locale)}/${c.slug}`,
        changeFrequency: 'daily',
        priority: 0.8,
        alternates: {
          languages: {
            ne: `${SITE_URL}/${c.slug}`,
            en: `${SITE_URL}/en/${c.slug}`,
          },
        },
      })
    }
  }

  // Articles. ne sees every story; fetch the full set once and emit per-locale URLs, gating
  // the English URL on hasEnglish so we never advertise a /en page that 404s (ADR-007).
  const all = await getStories({ locale: 'ne', perPage: 1000 })
  for (const s of all.items) {
    const lastModified = new Date(s.publishedAt)
    const languages: Record<string, string> = {
      ne: `${SITE_URL}/${s.category.slug}/${s.slug}`,
    }
    if (s.hasEnglish) {
      languages.en = `${SITE_URL}/en/${s.category.slug}/${s.slug}`
    }
    for (const locale of LOCALES) {
      if (locale === 'en' && !s.hasEnglish) continue
      entries.push({
        url: `${SITE_URL}${prefix(locale)}/${s.category.slug}/${s.slug}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.7,
        alternates: { languages },
      })
    }
  }

  // Authors.
  for (const locale of LOCALES) {
    for (const a of seedAuthors) {
      entries.push({
        url: `${SITE_URL}${prefix(locale)}/author/${a.slug}`,
        changeFrequency: 'weekly',
        priority: 0.5,
        alternates: {
          languages: {
            ne: `${SITE_URL}/author/${a.slug}`,
            en: `${SITE_URL}/en/author/${a.slug}`,
          },
        },
      })
    }
  }

  // Topics (tags).
  for (const locale of LOCALES) {
    for (const t of seedTags) {
      entries.push({
        url: `${SITE_URL}${prefix(locale)}/topic/${t.slug}`,
        changeFrequency: 'weekly',
        priority: 0.5,
        alternates: {
          languages: {
            ne: `${SITE_URL}/topic/${t.slug}`,
            en: `${SITE_URL}/en/topic/${t.slug}`,
          },
        },
      })
    }
  }

  return entries
}
