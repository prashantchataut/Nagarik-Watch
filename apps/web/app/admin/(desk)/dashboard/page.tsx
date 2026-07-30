import Link from 'next/link'
import type { Metadata } from 'next'
import { getNavCategories } from '@/lib/content'
import { requireNewsroomSession } from '@/lib/auth/session'
import type { Locale } from '@nagarikwatch/db'
import { formatDate } from '@nagarikwatch/db'
import {
  adminDeskLabelNe,
  canCreate,
  canManageUsers,
  canPublish,
  NEWSROOM_ROLE_LABELS_NE,
  resolveAdminDeskVariant,
} from '@/lib/admin-roles'
import { listPendingJournalistReviews } from '@/lib/journalist-workspace'
import { getAdminDashboardSnapshot } from '@/lib/content/store/json-store'
import { getMostReadStats, getTrendingSamples } from '@/lib/engagement/store'
import { getAdEventSummary } from '@/lib/ad-events'
import { buildStoryEngagementIndex } from '@/lib/ranking-signals'
import { firstAdminLoadError, safeAdminLoad } from '@/lib/admin/safe-load'
import { AdminLoadErrorBanner, CmsCanonicalBanner } from '@/components/admin/CmsCanonicalBanner'
import { AdminButton, AdminCard, AdminMetric } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const newsroom = await requireNewsroomSession()

  const [snapshotResult, categoriesResult, pendingReviews, mostRead, trendingSamples, adSummaries, engagement] =
    await Promise.all([
      safeAdminLoad(
        'dashboard-snapshot',
        () => getAdminDashboardSnapshot(),
        {
          publishedTotal: 0,
          scheduledCount: 0,
          breakingCount: 0,
          recentPublished: [],
        },
      ),
      safeAdminLoad('dashboard-categories', () => getNavCategories(), []),
      listPendingJournalistReviews().catch(() => []),
      getMostReadStats(7, 8).catch(() => []),
      getTrendingSamples(120).catch(() => []),
      getAdEventSummary().catch(() => []),
      buildStoryEngagementIndex(120).catch(() => null),
    ])

  const snapshot = snapshotResult.value
  const categories = categoriesResult.value
  const loadError = firstAdminLoadError(snapshotResult, categoriesResult)

  const locale: Locale = 'ne'
  const role = newsroom.newsroomRole
  const desk = resolveAdminDeskVariant(role)
  const roleLabel = NEWSROOM_ROLE_LABELS_NE[role] ?? role
  const deskLabel = adminDeskLabelNe(desk)
  const adImpressions = adSummaries.reduce((sum, row) => sum + row.impressions, 0)
  const adClicks = adSummaries.reduce((sum, row) => sum + row.clicks, 0)
  const avgDwell =
    mostRead.length > 0
      ? Math.round(
          mostRead.reduce((sum, row) => sum + (row.averageDwellSeconds ?? 0), 0) / mostRead.length,
        )
      : 0

  const metrics =
    desk === 'super' || desk === 'admin'
      ? [
          {
            label: 'प्रकाशित',
            value: snapshot.publishedTotal,
            href: '/admin/articles',
            tone: 'brand' as const,
          },
          {
            label: 'समीक्षा पर्खाइ',
            value: pendingReviews.length,
            href: '/admin/journalists',
            tone: 'default' as const,
          },
          { label: 'ब्रेकिङ', value: snapshot.breakingCount, href: '/admin/articles', tone: 'danger' as const },
          { label: 'विभाग', value: categories.length, href: '/admin/categories', tone: 'brand' as const },
        ]
      : desk === 'editor'
        ? [
            {
              label: 'प्रकाशित',
              value: snapshot.publishedTotal,
              href: '/admin/articles',
              tone: 'brand' as const,
            },
            {
              label: 'पत्रकार इनबक्स',
              value: pendingReviews.length,
              href: '/admin/journalists',
              tone: 'default' as const,
            },
            {
              label: 'तालिका',
              value: snapshot.scheduledCount,
              href: '/admin/articles?status=scheduled',
              tone: 'default' as const,
            },
            { label: 'ब्रेकिङ', value: snapshot.breakingCount, href: '/admin/articles', tone: 'danger' as const },
          ]
        : [
            {
              label: 'प्रकाशित',
              value: snapshot.publishedTotal,
              href: '/admin/articles',
              tone: 'brand' as const,
            },
            { label: 'ब्रेकिङ', value: snapshot.breakingCount, href: '/admin/articles', tone: 'danger' as const },
            { label: 'विभाग', value: categories.length, href: '/admin/categories', tone: 'brand' as const },
            {
              label: 'तालिका',
              value: snapshot.scheduledCount,
              href: '/admin/articles?status=scheduled',
              tone: 'default' as const,
            },
          ]

  const blurb =
    desk === 'super'
      ? 'सुपर एडमिन कन्सोल। प्रयोगकर्ता, भूमिका, अडिट र लन्च चेक यहीँबाट हेर्नुहोस्। सामग्री सम्पादन समाचार सूचीबाट गर्नुहोस्।'
      : desk === 'admin'
        ? 'एडमिन कन्सोल। प्रयोगकर्ता व्यवस्थापन, सञ्चालन सेटिङ र न्यूजरुम स्वास्थ्यका मुख्य संकेत यहीँ छन्। दैनिक लेखन सम्पादकीय उपकरणबाट हुन्छ।'
        : desk === 'editor'
          ? 'सम्पादकीय डेस्क। ड्राफ्ट समीक्षा, पत्रकार इनबक्स र प्रकाशन तयारीका मुख्य काम यहीँबाट सुरु हुन्छन्। प्रणाली सेटिङ अलग राखिएको छ।'
          : 'सञ्चालन डेस्क। लाइभ, विज्ञापन, विश्लेषण वा समुदाय उपकरणका कार्यप्रवाह यहाँ छन्। लेखन अधिकार सीमित हुन सक्छ।'

  return (
    <div className="space-y-5" data-desk={desk}>
      <CmsCanonicalBanner />
      <AdminLoadErrorBanner message={loadError} />
      <AdminCard>
        <p className="text-caption text-mute" lang="ne">
          {formatDate(new Date().toISOString(), locale)} · {deskLabel} · {roleLabel}
        </p>
        <h2 className="admin-welcome-title mt-1" lang="ne">
          स्वागत छ, {newsroom.displayName || newsroom.email.split('@')[0]}
        </h2>
        <p className="admin-page-subtitle" lang="ne">
          {blurb}
        </p>
        <div className="admin-quick-strip">
          {canCreate(role) ? (
            <AdminButton href="/admin/articles/new">+ नयाँ समाचार</AdminButton>
          ) : null}
          {desk === 'editor' || desk === 'admin' || desk === 'super' ? (
            <AdminButton href="/admin/articles" variant="secondary">
              सबै समाचार
            </AdminButton>
          ) : null}
          {desk === 'editor' ? (
            <AdminButton href="/admin/journalists" variant="ghost">
              पत्रकार इनबक्स ({pendingReviews.length})
            </AdminButton>
          ) : null}
          {desk === 'ops' || canPublish(role) ? (
            <AdminButton href="/admin/live" variant="ghost">
              लाइभ प्यानल
            </AdminButton>
          ) : null}
          {canManageUsers(role) ? (
            <AdminButton href="/admin/users" variant="ghost">
              प्रयोगकर्ता
            </AdminButton>
          ) : null}
          {desk === 'super' ? (
            <AdminButton href="/admin/launch" variant="ghost">
              लन्च चेक
            </AdminButton>
          ) : null}
        </div>
      </AdminCard>

      <section className="admin-metric-grid" aria-label="डेस्क मेट्रिक">
        {metrics.map((m) => (
          <AdminMetric key={m.label} href={m.href} value={m.value} label={m.label} tone={m.tone} />
        ))}
      </section>

      <AdminCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="admin-section-title" lang="ne">
            पाठक संकेत (७ दिन / २ घण्टा)
          </h3>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/session-quality" className="text-meta font-semibold text-brand" lang="en">
              Session quality
            </Link>
            <Link href="/admin/algorithms" className="text-meta font-semibold text-brand" lang="en">
              Algorithms
            </Link>
            <Link href="/admin/ads" className="text-meta font-semibold text-brand" lang="en">
              Ads
            </Link>
          </div>
        </div>
        <div className="admin-metric-grid mt-3">
          <AdminMetric value={mostRead.length} label="Most-read stories" href="/most-read" />
          <AdminMetric value={trendingSamples.length} label="Trending samples (2h)" href="/trending" />
          <AdminMetric
            value={engagement?.storyCount ?? 0}
            label="Stories with signal"
            href="/admin/algorithms"
          />
          <AdminMetric
            value={avgDwell > 0 ? `${avgDwell}s` : '—'}
            label="Avg dwell (top)"
            href="/admin/session-quality"
          />
          <AdminMetric value={adImpressions} label="Ad impressions (30d)" href="/admin/ads" />
          <AdminMetric value={adClicks} label="Ad clicks (30d)" href="/admin/ads" />
        </div>
        {mostRead.length === 0 ? (
          <p className="mt-3 text-meta text-ink-soft" lang="ne">
            अहिलेसम्म पर्याप्त पढाइ संकेत छैन। Analytics consent दिएका पाठकको watch-time आएपछि most-read र
            trending भरिन्छ।
          </p>
        ) : (
          <ul className="admin-list mt-3">
            {mostRead.slice(0, 5).map((row) => (
              <li key={row.articleSlug}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-meta font-semibold text-ink" lang="ne">
                    {row.articleTitleNe || row.articleSlug}
                  </p>
                  <p className="text-caption text-mute" lang="en">
                    {row.uniqueReaders} readers · {row.averageDwellSeconds}s dwell ·{' '}
                    {Math.round(row.averageReadPercent)}% scroll
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      {desk === 'editor' && pendingReviews.length > 0 ? (
        <AdminCard>
          <div className="flex items-center justify-between gap-3">
            <h3 className="admin-section-title" lang="ne">
              पत्रकारबाट समीक्षा पर्खाइ
            </h3>
            <Link
              href="/admin/journalists"
              className="text-meta font-semibold text-brand hover:text-brand-strong"
              lang="ne"
            >
              सबै →
            </Link>
          </div>
          <ul className="admin-list mt-1">
            {pendingReviews.slice(0, 6).map((item) => (
              <li key={item.articleSlug}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-meta font-semibold text-ink" lang="ne">
                    {item.titleNe}
                  </p>
                  <p className="text-caption text-mute">
                    {item.categorySlug} · {item.workflowStage}
                  </p>
                </div>
                {item.articleId ? (
                  <Link
                    href={`/admin/articles/${item.articleId}/edit`}
                    className="shrink-0 text-meta font-semibold text-brand"
                    lang="ne"
                  >
                    खोल्नुहोस्
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </AdminCard>
      ) : null}

      <AdminCard>
        <div className="flex items-center justify-between gap-3">
          <h3 className="admin-section-title" lang="ne">
            हालैका समाचार
          </h3>
          <Link
            href="/admin/articles"
            className="text-meta font-semibold text-brand hover:text-brand-strong"
            lang="ne"
          >
            सबै →
          </Link>
        </div>
        <ul className="admin-list mt-1">
          {snapshot.recentPublished.map((s) => (
            <li key={s.id ?? s.slug}>
              <Link
                href={`/admin/articles/${s.id ?? s.slug}/edit`}
                className="min-w-0 flex-1 truncate text-meta font-semibold text-ink hover:text-brand-strong"
                lang="ne"
              >
                {s.titleNe}
              </Link>
              <span className="hidden shrink-0 text-caption text-mute sm:inline" lang="ne">
                {s.categorySlug}
              </span>
              <time className="shrink-0 text-caption text-mute" lang="ne">
                {formatDate(s.publishedAt, locale)}
              </time>
            </li>
          ))}
          {snapshot.recentPublished.length === 0 ? (
            <li className="!block py-5 text-center text-body text-mute" lang="ne">
              कुनै समाचार प्रकाशित छैन। पहिलो समाचार बनाउनुहोस्।
            </li>
          ) : null}
        </ul>
      </AdminCard>
    </div>
  )
}
