import Link from 'next/link'
import type { Metadata } from 'next'
import { getStories, getNavCategories } from '@/lib/content'
import { requireNewsroomSession } from '@/lib/auth/session'
import type { Locale } from '@nagarikwatch/db'
import { formatDate } from '@nagarikwatch/db'
import { NEWSROOM_ROLE_LABELS_NE } from '@/lib/admin-roles'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const newsroom = await requireNewsroomSession()

  const [allStories, categories] = await Promise.all([
    getStories({ locale: 'ne', perPage: 20 }),
    getNavCategories(),
  ])

  const published = allStories.items
  const scheduledCount = published.filter(
    (story) => Number.isFinite(Date.parse(story.publishedAt)) && Date.parse(story.publishedAt) > Date.now(),
  ).length
  const breakingCount = published.filter((s) => 'isBreaking' in s && s.isBreaking).length

  const locale: Locale = 'ne'
  const role = newsroom.newsroomRole
  const isPublisherDesk = ['publisher', 'admin', 'super_admin', 'managing_editor', 'editor_in_chief'].includes(
    role,
  )
  const isSuperDesk = role === 'super_admin' || role === 'admin'
  const roleLabel = NEWSROOM_ROLE_LABELS_NE[role] ?? role

  const metrics = [
    { label: 'प्रकाशित', value: published.length, href: '/admin/articles', tone: 'brand' as const },
    { label: 'तालिका', value: scheduledCount, href: '/admin/articles?status=scheduled', tone: 'mute' as const },
    { label: 'ब्रेकिङ', value: breakingCount, href: '/admin/articles', tone: 'breaking' as const },
    { label: 'विभाग', value: categories.length, href: '/admin/categories', tone: 'brand' as const },
  ]

  return (
    <div className="space-y-6">
      <section className="admin-panel">
        <p className="admin-eyebrow" lang="ne">
          {formatDate(new Date().toISOString(), locale)} · {roleLabel}
        </p>
        <h2 className="admin-page-title" lang="ne">
          स्वागत छ, {newsroom.displayName || newsroom.email.split('@')[0]}
        </h2>
        <p className="admin-page-subtitle" lang="ne">
          {isSuperDesk
            ? 'सुपर एडमिन डेस्क — प्रयोगकर्ता र सञ्चालन सेटिङ यहाँबाट। दैनिक लेखन समाचार सूचीबाट सुरु हुन्छ।'
            : isPublisherDesk
              ? 'प्रकाशक डेस्क — लाइभ र विज्ञापन उपकरण उपलब्ध। लेखन /admin/articles मा।'
              : 'सम्पादकीय डेस्क — नयाँ समाचार लेख्नुहोस्, ड्राफ्ट सम्पादन गर्नुहोस्, प्रकाशन तयार पार्नुहोस्।'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/admin/articles/new" className="admin-button admin-button--primary" lang="ne">
            + नयाँ समाचार
          </Link>
          <Link href="/admin/articles" className="admin-button admin-button--secondary" lang="ne">
            सबै समाचार
          </Link>
          {isPublisherDesk ? (
            <Link href="/admin/live" className="admin-button admin-button--ghost" lang="ne">
              लाइभ प्यानल
            </Link>
          ) : null}
          {isSuperDesk ? (
            <Link href="/admin/users" className="admin-button admin-button--ghost" lang="ne">
              प्रयोगकर्ता
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
