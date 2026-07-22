import Link from 'next/link'
import type { Metadata } from 'next'
import { getStories, getNavCategories } from '@/lib/content'
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
import { AdminButton, AdminCard, AdminMetric } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-static'

export default async function DashboardPage() {
  const newsroom = await requireNewsroomSession()

  const [allStories, categories, pendingReviews] = await Promise.all([
    getStories({ locale: 'ne', perPage: 20 }),
    getNavCategories(),
    listPendingJournalistReviews().catch(() => []),
  ])

  const published = allStories.items
  const scheduledCount = published.filter(
    (story) => Number.isFinite(Date.parse(story.publishedAt)) && Date.parse(story.publishedAt) > Date.now(),
  ).length
  const breakingCount = published.filter((s) => 'isBreaking' in s && s.isBreaking).length

  const locale: Locale = 'ne'
  const role = newsroom.newsroomRole
  const desk = resolveAdminDeskVariant(role)
  const roleLabel = NEWSROOM_ROLE_LABELS_NE[role] ?? role
  const deskLabel = adminDeskLabelNe(desk)

  const metrics =
    desk === 'super' || desk === 'admin'
      ? [
          { label: 'प्रकाशित', value: published.length, href: '/admin/articles', tone: 'brand' as const },
          { label: 'समीक्षा पर्खाइ', value: pendingReviews.length, href: '/admin/journalists', tone: 'default' as const },
          { label: 'ब्रेकिङ', value: breakingCount, href: '/admin/articles', tone: 'danger' as const },
          { label: 'विभाग', value: categories.length, href: '/admin/categories', tone: 'brand' as const },
        ]
      : desk === 'editor'
        ? [
            { label: 'प्रकाशित', value: published.length, href: '/admin/articles', tone: 'brand' as const },
            { label: 'पत्रकार इनबक्स', value: pendingReviews.length, href: '/admin/journalists', tone: 'default' as const },
            { label: 'तालिका', value: scheduledCount, href: '/admin/articles?status=scheduled', tone: 'default' as const },
            { label: 'ब्रेकिङ', value: breakingCount, href: '/admin/articles', tone: 'danger' as const },
          ]
        : [
            { label: 'प्रकाशित', value: published.length, href: '/admin/articles', tone: 'brand' as const },
            { label: 'ब्रेकिङ', value: breakingCount, href: '/admin/articles', tone: 'danger' as const },
            { label: 'विभाग', value: categories.length, href: '/admin/categories', tone: 'brand' as const },
            { label: 'तालिका', value: scheduledCount, href: '/admin/articles?status=scheduled', tone: 'default' as const },
          ]

  const blurb =
    desk === 'super'
      ? 'सुपर एडमिन कन्सोल — प्रयोगकर्ता, भूमिका, अडिट र लन्च चेक। सामग्री सम्पादन समाचार सूचीबाट।'
      : desk === 'admin'
        ? 'एडमिन कन्सोल — प्रयोगकर्ता व्यवस्थापन, सञ्चालन सेटिङ र न्यूजरुम स्वास्थ्य। दैनिक लेखन सम्पादकीय उपकरणबाट।'
        : desk === 'editor'
          ? 'सम्पादकीय डेस्क — ड्राफ्ट समीक्षा, पत्रकार इनबक्स, प्रकाशन तयारी। प्रणाली सेटिङ यहाँ छैन।'
          : 'सञ्चालन डेस्क — लाइभ, विज्ञापन, विश्लेषण वा समुदाय उपकरण। लेखन अधिकार सीमित हुन सक्छ।'

  return (
    <div className="space-y-5" data-desk={desk}>
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
        <div className="mt-3.5 flex flex-wrap gap-2">
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

      {desk === 'editor' && pendingReviews.length > 0 ? (
        <AdminCard>
          <div className="flex items-center justify-between gap-3">
            <h3 className="admin-section-title" lang="ne">
              पत्रकारबाट समीक्षा पर्खाइ
            </h3>
            <Link href="/admin/journalists" className="text-meta font-semibold text-brand hover:text-brand-strong" lang="ne">
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
          <Link href="/admin/articles" className="text-meta font-semibold text-brand hover:text-brand-strong" lang="ne">
            सबै →
          </Link>
        </div>
        <ul className="admin-list mt-1">
          {published.slice(0, 8).map((s) => (
            <li key={s.id ?? s.slug}>
              <Link
                href={`/admin/articles/${s.id ?? s.slug}/edit`}
                className="min-w-0 flex-1 truncate text-meta font-semibold text-ink hover:text-brand-strong"
                lang="ne"
              >
                {s.titleNe}
              </Link>
              <span className="hidden shrink-0 text-caption text-mute sm:inline" lang="ne">
                {s.category.nameNe}
              </span>
              <time className="shrink-0 text-caption text-mute" lang="ne">
                {formatDate(s.publishedAt, locale)}
              </time>
            </li>
          ))}
          {published.length === 0 ? (
            <li className="!block py-5 text-center text-body text-mute" lang="ne">
              कुनै समाचार प्रकाशित छैन। पहिलो समाचार बनाउनुहोस्।
            </li>
          ) : null}
        </ul>
      </AdminCard>
    </div>
  )
}
