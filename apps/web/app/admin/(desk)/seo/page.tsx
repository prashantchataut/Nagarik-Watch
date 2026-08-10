import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { SITE_URL } from '@/lib/site'
import { AdminPageHeader, AdminCard, OpsCheckBadge } from '@/components/admin/primitives'
import { sampleSyndicationReadiness } from '@/lib/syndication/readiness'

export const metadata: Metadata = { title: 'एसइओ', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

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
      <AdminPageHeader subtitle="क्यानोनिकल, साइटम्याप र सिन्डिकेसन तयारी" />
      <AdminCard>
        <div className="grid gap-3">
          {checks.map(([label, value]) => (
            <div key={label} className="rounded-md border border-rule bg-surface p-4">
              <p className="text-caption font-bold text-mute" lang="en">
                {label}
              </p>
              <p className="mt-1 break-all font-mono text-meta text-ink">{value}</p>
            </div>
          ))}
        </div>
      </AdminCard>

      <h2 className="mb-3 mt-8 font-display text-h2 text-ink" lang="ne">
        सिन्डिकेसन नमुना
      </h2>
      {samples.length === 0 ? (
        <AdminCard>
          <p className="text-meta text-ink-soft" lang="ne">
            नमुनाका लागि प्रकाशित समाचार अझै छैन।
          </p>
        </AdminCard>
      ) : (
        <div className="grid gap-3">
          {samples.map((sample) => (
            <AdminCard key={sample.slug} className="grid gap-2">
              <p className="font-display text-h3 text-ink">{sample.title}</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <OpsCheckBadge status={sample.amp.ok ? 'pass' : 'fail'} />
                  <span className="text-meta text-ink-soft">AMP</span>
                </div>
                <div className="flex items-center gap-2">
                  <OpsCheckBadge status={sample.instantArticle.ok ? 'pass' : 'fail'} />
                  <span className="text-meta text-ink-soft">Instant Articles</span>
                </div>
                <div className="flex items-center gap-2">
                  <OpsCheckBadge status={sample.appleNews.ok ? 'pass' : 'fail'} />
                  <span className="text-meta text-ink-soft">Apple News</span>
                </div>
              </div>
              {[
                ...sample.amp.issues,
                ...sample.instantArticle.issues,
                ...sample.appleNews.issues,
              ].map((issue) => (
                <p key={issue} className="text-caption text-mute">
                  - {issue}
                </p>
              ))}
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  )
}
