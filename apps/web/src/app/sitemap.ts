import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { stories, desks, provinces } from '@/lib/news/data'
import { SITE } from '@/lib/news/seo'

/**
 * Full sitemap — every article, desk, province, tool and info page,
 * plus live CMS articles (when the database is reachable at build time).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified: now, changeFrequency: 'hourly', priority: 1 },
    { url: `${SITE.url}/en`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE.url}/disaster`, lastModified: now, changeFrequency: 'hourly', priority: 0.95 },
    { url: `${SITE.url}/fact-check`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE.url}/feed`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE.url}/subscribe`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE.url}/patro`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE.url}/nepse`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE.url}/rashifal`, changeFrequency: 'daily', priority: 0.6 },
    { url: `${SITE.url}/scores`, changeFrequency: 'hourly', priority: 0.6 },
    { url: `${SITE.url}/tools`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE.url}/tools/preeti`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE.url}/tools/date`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${SITE.url}/province`, changeFrequency: 'daily', priority: 0.6 },
    { url: `${SITE.url}/api/rss`, lastModified: now, changeFrequency: 'hourly', priority: 0.7 },
  ]

  for (const d of desks) {
    if (d.slug === 'disaster' || d.slug === 'fact-check') continue
    entries.push({ url: `${SITE.url}/${d.slug}`, lastModified: now, changeFrequency: 'daily', priority: 0.8 })
  }
  for (const p of provinces) {
    entries.push({ url: `${SITE.url}/province/${p.slug}`, lastModified: now, changeFrequency: 'daily', priority: 0.6 })
  }
  for (const s of stories) {
    entries.push({
      url: `${SITE.url}/${s.desk}/${s.slug}`,
      lastModified: new Date(s.publishedAt),
      changeFrequency: 'weekly',
      priority: s.featured === 'lead' ? 0.9 : s.featured === 'secondary' ? 0.8 : 0.7,
    })
  }
  for (const slug of ['about', 'ethics', 'advertise', 'contact', 'privacy', 'terms', 'cookies']) {
    entries.push({ url: `${SITE.url}/${slug}`, changeFrequency: 'yearly', priority: 0.3 })
  }

  // Live CMS articles — skipped gracefully when the DB is not reachable.
  try {
    const rows = await db.article.findMany({
      where: { status: 'published' },
      select: { desk: true, slug: true, publishedAt: true },
      take: 500,
    })
    for (const r of rows) {
      entries.push({
        url: `${SITE.url}/${r.desk}/${r.slug}`,
        lastModified: r.publishedAt ?? now,
        changeFrequency: 'weekly',
        priority: 0.7,
      })
    }
  } catch {
    /* build without DB — static archive still covers the sitemap */
  }

  return entries
}
