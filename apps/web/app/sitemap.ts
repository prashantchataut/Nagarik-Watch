export const dynamic = 'force-static'
import type { MetadataRoute } from 'next'
import { getAuthors, getNavCategories, getStories, getTags } from '@/lib/content'
import { isPublicMembershipEnabled } from '@/lib/membership'
import { epaperEnabled } from '@/lib/epaper'
import { listLiveBlogs } from '@/lib/live-blog-admin'
import { listNewsletterIssues } from '@/lib/newsletter-admin'
import {
  DISTRICT_SLUGS,
  PROVINCES,
  SITE_URL,
  STATIC_HUBS,
  TRUST_PAGES,
  UTILITY_TOOL_SLUGS,
} from '@/lib/site'
import { newsSitemapPriority } from '@/lib/algorithms/product/seo-dist'

/**
 * Dynamic sitemap. Emits one <url> per locale (ne at root, en under /en) for every article,
 * category, author, and topic that the site can render, so crawlers discover the full
 * bilingual corpus. lastmod comes from the article's updatedAt/publishedAt where available.
 *
 * The article, category, and author lists are read through the content façade so this stays
 * correct when the source swaps from the local development store to Payload.
 */
const LOCALES = ['ne', 'en'] as const
type SLocale = (typeof LOCALES)[number]

/** Refresh discovery URLs periodically once Payload is the live source. */
export const revalidate = 3600

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

  // Static info pages. Linked from the footer and served
  // bilingually, so advertise both locales.
  const membershipPublic = isPublicMembershipEnabled()
  const STATIC_PAGES = [
    'about',
    'ethics',
    'privacy',
    'contact',
    'rss',
    'sitemap',
    // Reader-facing trust and utility surfaces that render but are not in a registry.
    'help',
    'cookies',
    'how-recommendations-work',
    'columns',
    'patro',
    'province',
    'newsletter/archive',
    ...PROVINCES.map((province) => `province/${province.slug}`),
    ...DISTRICT_SLUGS.map((slug) => `district/${slug}`),
    ...UTILITY_TOOL_SLUGS.map((tool) => `utilities/${tool}`),
    // The replica reader 404s its own editions when disabled; don't advertise it then.
    ...(epaperEnabled() ? ['epaper'] : []),
    ...STATIC_HUBS.filter((hub) => membershipPublic || hub.key !== 'membership').map((hub) =>
      hub.path.replace(/^\//, ''),
    ),
    ...TRUST_PAGES.map((page) => page.path.replace(/^\//, '')),
  ]
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
  const [categories, authors, tags] = await Promise.all([
    getNavCategories(),
    getAuthors(),
    getTags(),
  ])
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
  for (const s of all.items.filter((story) => story.noIndex !== true)) {
    const lastModified = new Date(s.publishedAt)
    const ageHours = (Date.now() - lastModified.getTime()) / 3_600_000
    // News-recency weighting keeps crawl priority honest for fresh/breaking
    // stories instead of a flat constant across the whole archive.
    const priority = 0.4 + newsSitemapPriority(ageHours, s.isBreaking, 0.8) * 0.5
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
        priority,
        alternates: { languages },
      })
    }
  }

  // Authors.
  for (const locale of LOCALES) {
    for (const a of authors) {
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
    for (const t of tags) {
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

  // Photo galleries. /photos/[slug] renders gallery stories on its own URL, so the
  // gallery gets a second indexable address alongside its article URL.
  const galleries = await getStories({ locale: 'ne', hasGallery: true, perPage: 200 }).catch(
    () => null,
  )
  for (const story of (galleries?.items ?? []).filter((s) => s.noIndex !== true)) {
    const languages: Record<string, string> = { ne: `${SITE_URL}/photos/${story.slug}` }
    if (story.hasEnglish) languages.en = `${SITE_URL}/en/photos/${story.slug}`
    for (const locale of LOCALES) {
      if (locale === 'en' && !story.hasEnglish) continue
      entries.push({
        url: `${SITE_URL}${prefix(locale)}/photos/${story.slug}`,
        lastModified: new Date(story.publishedAt),
        changeFrequency: 'weekly',
        priority: 0.5,
        alternates: { languages },
      })
    }
  }

  // Live blogs. Scheduled blogs are not public yet, so only live/closed are advertised.
  // A store read failure degrades to omitting them, never to a broken sitemap.
  const liveBlogs = (await listLiveBlogs().catch(() => [])).filter(
    (blog) => blog.status !== 'scheduled',
  )
  for (const blog of liveBlogs) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}${prefix(locale)}/live/${blog.slug}`,
        lastModified: new Date(blog.updatedAt),
        changeFrequency: blog.status === 'live' ? 'hourly' : 'monthly',
        priority: blog.status === 'live' ? 0.8 : 0.4,
        alternates: {
          languages: {
            ne: `${SITE_URL}/live/${blog.slug}`,
            en: `${SITE_URL}/en/live/${blog.slug}`,
          },
        },
      })
    }
  }

  // Newsletter issues. Only sent issues have a public archive page.
  const issues = (await listNewsletterIssues().catch(() => [])).filter(
    (issue) => issue.status === 'sent',
  )
  for (const issue of issues) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}${prefix(locale)}/newsletter/archive/${issue.id}`,
        lastModified: new Date(issue.updatedAt),
        changeFrequency: 'monthly',
        priority: 0.3,
        alternates: {
          languages: {
            ne: `${SITE_URL}/newsletter/archive/${issue.id}`,
            en: `${SITE_URL}/en/newsletter/archive/${issue.id}`,
          },
        },
      })
    }
  }

  // Some paths live in two registries at once (e.g. `video` and `photo-story` are both
  // STATIC_HUBS entries and nav categories). Emitting a URL twice is a sitemap defect,
  // so keep the first occurrence, which carries the more specific priority.
  const seen = new Set<string>()
  return entries.filter((entry) => {
    const url = String(entry.url)
    if (seen.has(url)) return false
    seen.add(url)
    return true
  })
}
