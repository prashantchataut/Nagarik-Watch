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

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

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
          { label: 'समीक्षा पर्खाइ', value: pendingReviews.length, href: '/admin/journalists', tone: 'mute' as const },
          { label: 'ब्रेकिङ', value: breakingCount, href: '/admin/articles', tone: 'breaking' as const },
          { label: 'विभाग', value: categories.length, href: '/admin/categories', tone: 'brand' as const },
        ]
      : desk === 'editor'
        ? [
            { label: 'प्रकाशित', value: published.length, href: '/admin/articles', tone: 'brand' as const },
            { label: 'पत्रकार इनबक्स', value: pendingReviews.length, href: '/admin/journalists', tone: 'mute' as const },
            { label: 'तालिका', value: scheduledCount, href: '/admin/articles?status=scheduled', tone: 'mute' as const },
            { label: 'ब्रेकिङ', value: breakingCount, href: '/admin/articles', tone: 'breaking' as const },
          ]
        : [
            { label: 'प्रकाशित', value: published.length, href: '/admin/articles', tone: 'brand' as const },
            { label: 'ब्रेकिङ', value: breakingCount, href: '/admin/articles', tone: 'breaking' as const },
            { label: 'विभाग', value: categories.length, href: '/admin/categories', tone: 'brand' as const },
            { label: 'तालिका', value: scheduledCount, href: '/admin/articles?status=scheduled', tone: 'mute' as const },
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
    <div className="space-y-6" data-desk={desk}>
      <section className="admin-panel">
        <p className="admin-eyebrow" lang="ne">
          {formatDate(new Date().toISOString(), locale)} · {deskLabel} · {roleLabel}
        </p>
        <h2 className="admin-welcome-title" lang="ne">
          स्वागत छ, {newsroom.displayName || newsroom.email.split('@')[0]}
        </h2>
        <p className="admin-page-subtitle" lang="ne">
          {blurb}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {canCreate(role) ? (
            <Link href="/admin/articles/new" className="admin-button admin-button--primary" lang="ne">
              + नयाँ समाचार
            </Link>
          ) : null}
          {desk === 'editor' || desk === 'admin' || desk === 'super' ? (
            <Link href="/admin/articles" className="admin-button admin-button--secondary" lang="ne">
              सबै समाचार
            </Link>
          ) : null}
          {desk === 'editor' ? (
            <Link href="/admin/journalists" className="admin-button admin-button--ghost" lang="ne">
              पत्रकार इनबक्स ({pendingReviews.length})
            </Link>
          ) : null}
          {desk === 'ops' || canPublish(role) ? (
            <Link href="/admin/live" className="admin-button admin-button--ghost" lang="ne">
              लाइभ प्यानल
            </Link>
          ) : null}
          {canManageUsers(role) ? (
            <Link href="/admin/users" className="admin-button admin-button--ghost" lang="ne">
              प्रयोगकर्ता
            </Link>
          ) : null}
          {desk === 'super' ? (
            <Link href="/admin/launch" className="admin-button admin-button--ghost" lang="ne">
              लन्च चेक
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="admin-panel transition-colors hover:border-brand"
          >
            <p
              className={`font-display text-display font-extrabold leading-none ${
                m.tone === 'breaking' ? 'text-breaking' : m.tone === 'brand' ? 'text-brand' : 'text-ink'
              }`}
            >
              {m.value}
            </p>
            <p className="mt-2 text-meta font-semibold text-ink-soft" lang="ne">
              {m.label}
            </p>
          </Link>
        ))}
      </section>

      {desk === 'editor' && pendingReviews.length > 0 ? (
        <section className="admin-panel">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-h2 text-ink" lang="ne">
              पत्रकारबाट समीक्षा पर्खाइ
            </h3>
            <Link href="/admin/journalists" className="text-meta font-semibold text-brand hover:text-brand-strong" lang="ne">
              सबै →
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-rule">
            {pendingReviews.slice(0, 6).map((item) => (
              <li key={item.articleSlug} className="flex items-center gap-3 py-2.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body font-semibold text-ink" lang="ne">
                    {item.titleNe}
                  </p>
                  <p className="text-caption text-mute">{item.categorySlug} · {item.workflowStage}</p>
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
        </section>
      ) : null}

      <section className="admin-panel">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-h2 text-ink" lang="ne">
            हालैका समाचार
          </h3>
          <Link href="/admin/articles" className="text-meta font-semibold text-brand hover:text-brand-strong" lang="ne">
            सबै →
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-rule">
          {published.slice(0, 8).map((s) => (
            <li key={s.id ?? s.slug} className="flex items-center gap-3 py-2.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
              <Link
                href={`/admin/articles/${s.id ?? s.slug}/edit`}
                className="min-w-0 flex-1 truncate text-body font-semibold text-ink hover:text-brand-strong"
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
            <li className="py-6 text-center text-body text-mute" lang="ne">
              कुनै समाचार प्रकाशित छैन। पहिलो समाचार बनाउनुहोस्।
            </li>
          ) : null}
        </ul>
      </section>
    </div>
  )
}
