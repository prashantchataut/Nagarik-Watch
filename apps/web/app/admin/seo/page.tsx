import Link from 'next/link'
import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { getStories } from '@/lib/content'
import { SITE_URL } from '@/lib/site'
import { formatDate } from '@nagarikwatch/db'
import {
  AdminPageHeader,
  AdminCard,
} from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'एसइओ',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * SEO overview. Lists the four crawler-facing endpoints (sitemap,
 * news-sitemap, robots, rss) and a per-article SEO completeness table.
 * Completeness is read from real article fields — seoTitleNe,
 * seoDescriptionNe and socialImage — so editors see which stories still
 * need metadata before search engines re-crawl. No placeholder checks.
 */
export default async function SeoPage() {
  const session = await requireNewsroomSession()
  void session // auth gate; session unused on this surface

  const storiesResult = await getStories({ locale: 'ne', perPage: 50 })
  const articles = storiesResult.items

  // SEO completeness is derived from the article's own fields; only the
  // recent 50 stories land in the table to keep the page fast. The cast to
  // ArticleSEO is safe because the content source returns Article-shaped objects
  // (only bodyNe/bodyEn are stripped, not the SEO fields).
  type ArticleSEO = {
    heroImage?: { url?: string }
    seoTitleNe?: string
    seoDescriptionNe?: string
    socialImage?: { url?: string }
  }
  function row(a: (typeof articles)[number]) {
    const s = a as ArticleSEO
    const hasMetaTitle = Boolean(s.seoTitleNe)
    const hasMetaDesc = Boolean(s.seoDescriptionNe)
    const hasOgImage = Boolean(s.socialImage?.url || s.heroImage?.url)
    const complete = hasMetaTitle && hasMetaDesc && hasOgImage
    return { hasMetaTitle, hasMetaDesc, hasOgImage, complete }
  }

  const endpoints = [
    {
      labelNe: 'साइटम्याप',
      path: '/sitemap.xml',
      descNe: 'सबै प्रकाशित पृष्ठको XML साइटम्याप।',
    },
    {
      labelNe: 'समाचार साइटम्याप',
      path: '/news-sitemap.xml',
      descNe: 'Google News का लागि विशेष साइटम्याप।',
    },
    {
      labelNe: 'robots.txt',
      path: '/robots.txt',
      descNe: 'क्रलर नियम र साइटम्याप सन्दर्भ।',
    },
    {
      labelNe: 'RSS फिड',
      path: '/rss.xml',
      descNe: 'पाठक र समाचार एग्रिगेटरका लागि RSS।',
    },
  ] as const

  const completeCount = articles.filter((a) => row(a).complete).length
  const score = articles.length === 0 ? 0 : Math.round((completeCount / articles.length) * 100)

  return (
    <div>
      <AdminPageHeader
        title="एसइओ"
        subtitle={`खोज इन्जिन दृश्यता — भर्खरका ${articles.length} समाचारको मेटाडाटा पूर्णता`}
      />

      {/* Crawler endpoints */}
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {endpoints.map((e) => (
          <Link
            key={e.path}
            href={e.path}
            className="group rounded-lg border border-rule bg-surface-raised p-4 transition-shadow duration-fast ease-out-quint hover:border-brand hover:shadow-card"
          >
            <p className="font-display text-h3 text-ink group-hover:text-brand-strong" lang="ne">
              {e.labelNe}
            </p>
            <code className="mt-1 block font-mono text-caption text-mute" lang="en">
              {SITE_URL}{e.path}
            </code>
            <p className="mt-2 text-caption text-ink-soft" lang="ne">
              {e.descNe}
            </p>
            <span className="mt-3 inline-flex items-center rounded-full bg-brand-tint px-2.5 py-0.5 text-caption font-semibold text-brand-strong" lang="ne">
              सक्रिय →
            </span>
          </Link>
        ))}
      </section>

      {/* Completeness score */}
      <AdminCard className="mb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="font-display text-h2 text-ink" lang="ne">
              मेटाडाटा पूर्णता
            </p>
            <p className="mt-1 text-caption text-mute" lang="ne">
              भर्खरका {articles.length} समाचारमध्ये {completeCount} वटा पूर्ण।
            </p>
          </div>
          <p className="font-display text-display font-extrabold text-brand">
            {score}%
          </p>
        </div>
      </AdminCard>

      {/* Per-article table */}
      <div className="overflow-hidden rounded-lg border border-rule bg-surface-raised">
        <table className="min-w-full divide-y divide-rule text-left">
          <thead className="bg-surface text-caption uppercase tracking-wide text-mute">
            <tr>
              <th className="px-4 py-3 font-semibold" lang="ne">शीर्षक</th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell" lang="ne">मिति</th>
              <th className="px-4 py-3 font-semibold text-center" lang="ne">मेटा शीर्षक</th>
              <th className="px-4 py-3 font-semibold text-center" lang="ne">मेटा विवरण</th>
              <th className="px-4 py-3 font-semibold text-center" lang="ne">OG तस्बिर</th>
              <th className="px-4 py-3 font-semibold text-center" lang="ne">कुल</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {articles.map((a) => {
              const r = row(a)
              return (
                <tr key={a.slug} className="hover:bg-brand-tint/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/articles/${a.slug}/edit`}
                      className="line-clamp-1 font-semibold text-ink hover:text-brand-strong"
                      lang="ne"
                      title={a.titleNe}
                    >
                      {a.titleNe}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-caption text-mute sm:table-cell" lang="ne">
                    {formatDate(a.publishedAt, 'ne')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.hasMetaTitle ? (
                      <span className="font-bold text-brand" aria-label="छ">✓</span>
                    ) : (
                      <span className="text-mute" aria-label="छैन">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.hasMetaDesc ? (
                      <span className="font-bold text-brand" aria-label="छ">✓</span>
                    ) : (
                      <span className="text-mute" aria-label="छैन">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.hasOgImage ? (
                      <span className="font-bold text-brand" aria-label="छ">✓</span>
                    ) : (
                      <span className="text-mute" aria-label="छैन">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.complete ? (
                      <span className="rounded-full bg-brand-tint px-2 py-0.5 text-caption font-semibold text-brand-strong" lang="ne">
                        पूर्ण
                      </span>
                    ) : (
                      <span className="rounded-full border border-rule px-2 py-0.5 text-caption font-semibold text-mute" lang="ne">
                        अपूर्ण
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
            {articles.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-body text-mute" lang="ne">
                  कुनै समाचार भेटिएन।
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
