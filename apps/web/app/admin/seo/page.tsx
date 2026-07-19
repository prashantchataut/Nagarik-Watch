import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { SITE_URL } from '@/lib/site'
import { AdminPageHeader, AdminCard } from '@/components/admin/primitives'
import { sampleSyndicationReadiness } from '@/lib/syndication/readiness'

export const metadata: Metadata = { title: 'एसइओ', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

function badge(ok: boolean) {
  return (
    <span
      className={
        ok
          ? 'rounded-full bg-brand-tint px-2.5 py-1 text-caption font-bold text-brand-strong'
          : 'rounded-full bg-red-50 px-2.5 py-1 text-caption font-bold text-red-700'
      }
    >
      {ok ? 'OK' : 'ISSUES'}
    </span>
  )
}

export default async function SeoPage() {
  await requireNewsroomSession()
  const checks = [
    ['Canonical domain', SITE_URL],
    ['Sitemap', `${SITE_URL}/sitemap.xml`],
    ['News sitemap', `${SITE_URL}/news-sitemap.xml`],
    ['RSS', `${SITE_URL}/rss.xml`],
    ['Robots', `${SITE_URL}/robots.txt`],
  ] as const
  const samples = await sampleSyndicationReadiness(3).catch(() => [])
  return (
    <div>
      <AdminPageHeader title="एसइओ" subtitle="Google News, canonical and discovery readiness" />
      <AdminCard><div className="grid gap-3">{checks.map(([label, value]) => <div key={label} className="rounded-lg border border-rule bg-surface p-4"><p className="text-caption font-bold uppercase tracking-wide text-mute">{label}</p><p className="mt-1 break-all font-mono text-meta text-ink">{value}</p></div>)}</div></AdminCard>

      <h2 className="mb-3 mt-8 font-display text-h2 text-ink">Syndication readiness (live sample)</h2>
      {samples.length === 0 ? (
        <AdminCard><p className="text-meta text-ink-soft">No published articles available to sample yet.</p></AdminCard>
      ) : (
        <div className="grid gap-3">
          {samples.map((sample) => (
            <AdminCard key={sample.slug} className="grid gap-2">
              <p className="font-display text-h3 text-ink">{sample.title}</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="flex items-center gap-2">{badge(sample.amp.ok)}<span className="text-meta text-ink-soft">AMP</span></div>
                <div className="flex items-center gap-2">{badge(sample.instantArticle.ok)}<span className="text-meta text-ink-soft">Instant Articles</span></div>
                <div className="flex items-center gap-2">{badge(sample.appleNews.ok)}<span className="text-meta text-ink-soft">Apple News</span></div>
              </div>
              {[...sample.amp.issues, ...sample.instantArticle.issues, ...sample.appleNews.issues].map((issue) => (
                <p key={issue} className="text-caption text-mute">- {issue}</p>
              ))}
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  )
}
