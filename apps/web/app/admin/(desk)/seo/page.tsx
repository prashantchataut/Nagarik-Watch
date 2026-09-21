import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { SITE_URL } from '@/lib/site'
import { AdminPageHeader, AdminCard, OpsCheckBadge } from '@/components/admin/primitives'
import { sampleSyndicationReadiness } from '@/lib/syndication/readiness'
import { orEmpty } from '@/lib/resilience/or-empty'
import { getStories } from '@/lib/content'
import { assessIndexation, type IndexationIssueCode } from '@/lib/seo/indexation-health'
import { auditLinkGraph } from '@/lib/seo/link-graph'

export const metadata: Metadata = { title: 'एसइओ', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

/**
 * Both audits run over a recent window rather than the archive: the link-graph
 * pass is O(n²) in the window because it rebuilds the same related-stories
 * edges the article pages render, and an admin page should not spend a minute
 * of CPU to colour a card.
 */
const AUDIT_WINDOW = 120

const ISSUE_NE: Record<IndexationIssueCode, string> = {
  'missing-deck': 'Deck छैन — meta description खाली',
  'missing-hero': 'Hero तस्बिर छैन — share card कमजोर',
  'long-title': 'शीर्षक SERP मा काटिन्छ',
  'duplicate-title': 'उस्तै शीर्षक — आपसमा प्रतिस्पर्धा',
  'duplicate-slug': 'एउटै slug दुई श्रेणीमा',
}

export default async function SeoPage() {
  await requireNewsroomSession()
  const checks = [
    ['Canonical domain', SITE_URL],
    ['Sitemap', `${SITE_URL}/sitemap.xml`],
    ['News sitemap', `${SITE_URL}/news-sitemap.xml`],
    ['Archive sitemap index', `${SITE_URL}/archive-sitemap.xml`],
    ['RSS', `${SITE_URL}/rss.xml`],
    ['Robots', `${SITE_URL}/robots.txt`],
  ] as const
  const samples = await orEmpty(sampleSyndicationReadiness(3))
  const window = await getStories({ locale: 'ne', perPage: AUDIT_WINDOW }).catch(() => null)
  const stories = window?.items ?? []
  const health = assessIndexation(stories)
  const links = auditLinkGraph(stories)
  return (
    <div>
      <AdminPageHeader subtitle="क्यानोनिकल, साइटम्याप र सिन्डिकेसन तयारी" />
      <AdminCard>
        <div className="grid gap-3">
          {checks.map(([label, value]) => (
            <div key={label} className="rounded-sm border border-rule bg-surface p-4">
              <p className="text-caption font-bold text-mute" lang="en">
                {label}
              </p>
              <p className="mt-1 break-all font-mono text-meta text-ink">{value}</p>
            </div>
          ))}
        </div>
      </AdminCard>

      <h2 className="mb-3 mt-8 font-display text-h2 text-ink" lang="ne">
        इन्डेक्सेसन स्वास्थ्य
      </h2>
      <AdminCard className="grid gap-3">
        {stories.length === 0 ? (
          <p className="text-meta text-ink-soft" lang="ne">
            जाँच गर्न प्रकाशित समाचार अझै छैन।
          </p>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-4">
              <div>
                <p className="text-caption font-bold text-mute" lang="ne">
                  स्कोर
                </p>
                <p className="font-mono text-meta text-ink">{Math.round(health.score * 100)}%</p>
              </div>
              <div>
                <p className="text-caption font-bold text-mute" lang="ne">
                  इन्डेक्स हुने
                </p>
                <p className="font-mono text-meta text-ink">
                  {health.indexable} / {health.total}
                </p>
              </div>
              <div>
                <p className="text-caption font-bold text-mute" lang="ne">
                  नयाँ समाचार
                </p>
                <p className="font-mono text-meta text-ink">
                  {health.freshnessHours === null
                    ? '—'
                    : `${Math.round(health.freshnessHours)} घण्टा अघि`}
                </p>
              </div>
              <div>
                <p className="text-caption font-bold text-mute" lang="ne">
                  द्विभाषिक
                </p>
                <p className="font-mono text-meta text-ink">
                  {Math.round(health.bilingualShare * 100)}%
                </p>
              </div>
            </div>
            {health.newsWindowEmpty ? (
              <p className="text-meta text-ink-soft" lang="ne">
                <span className="admin-status admin-status--attention">News sitemap खाली</span>{' '}
                पछिल्लो ४८ घण्टामा केही प्रकाशित भएको छैन, त्यसैले Google News को विन्डो खाली छ।
              </p>
            ) : null}
            {health.findings.length === 0 ? (
              <p className="text-meta text-ink-soft" lang="ne">
                कुनै समस्या भेटिएन।
              </p>
            ) : (
              <ul className="grid gap-1">
                {health.findings.map((entry) => (
                  <li key={entry.code} className="text-meta text-ink-soft">
                    <span
                      className={`admin-status admin-status--${
                        entry.severity === 'error' ? 'danger' : 'attention'
                      }`}
                      lang="ne"
                    >
                      {ISSUE_NE[entry.code]}
                    </span>{' '}
                    {entry.count} — <span className="font-mono">{entry.samples.join(', ')}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </AdminCard>

      <h2 className="mb-3 mt-8 font-display text-h2 text-ink" lang="ne">
        आन्तरिक लिंक अथोरिटी
      </h2>
      <AdminCard className="grid gap-3">
        <p className="text-caption text-mute" lang="ne">
          लेख पृष्ठहरूले रेन्डर गर्ने सम्बन्धित-समाचार लिंकहरूमाथि PageRank। पछिल्ला {links.nodes}{' '}
          समाचार।
        </p>
        {links.nodes === 0 ? (
          <p className="text-meta text-ink-soft" lang="ne">
            लिंक ग्राफ बनाउन पर्याप्त समाचार छैन।
          </p>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <p className="text-caption font-bold text-mute" lang="ne">
                  औसत inbound लिंक
                </p>
                <p className="font-mono text-meta text-ink">{links.meanInbound.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-caption font-bold text-mute" lang="ne">
                  अनाथ (कसैले लिंक नगरेको)
                </p>
                <p className="font-mono text-meta text-ink">{links.orphans.length}</p>
              </div>
              <div>
                <p className="text-caption font-bold text-mute" lang="en">
                  Authority Gini
                </p>
                <p className="font-mono text-meta text-ink">{links.gini.toFixed(2)}</p>
              </div>
            </div>
            {links.orphans.length > 0 ? (
              <div>
                <p className="text-caption font-bold text-mute" lang="ne">
                  अनाथ समाचार — साइटम्यापबाहेक कुनै बाटो छैन
                </p>
                <ul className="mt-1 grid gap-1">
                  {links.orphans.map((entry) => (
                    <li key={entry.slug} className="text-meta text-ink-soft">
                      {entry.title}{' '}
                      <span className="font-mono text-caption text-mute">
                        /{entry.category}/{entry.slug}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div>
              <p className="text-caption font-bold text-mute" lang="ne">
                सबैभन्दा बढी अथोरिटी
              </p>
              <ul className="mt-1 grid gap-1">
                {links.hubs.map((entry) => (
                  <li key={entry.slug} className="text-meta text-ink-soft">
                    <span className="font-mono">{(entry.authority * 100).toFixed(2)}%</span>{' '}
                    {entry.title}{' '}
                    <span className="text-caption text-mute" lang="ne">
                      ({entry.inbound} inbound)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
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
