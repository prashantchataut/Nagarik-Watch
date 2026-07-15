import Link from 'next/link'
import type { Metadata } from 'next'
import { getStories, getNavCategories } from '@/lib/content'
import type { NewsroomSession } from '@/lib/auth/session'
import type { Locale } from '@nagarikwatch/db'
import { formatDate } from '@nagarikwatch/db'
import { NEWSROOM_ROLE_LABELS_NE } from '@/lib/admin-roles'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Newsroom dashboard — fast first paint from the article store only.
 * Live provider fan-out lives on /admin/live, not here.
 */
export default async function DashboardPage() {
  const session = (await import('@/lib/auth/session')).requireNewsroomSession
  const newsroom: NewsroomSession = await session()

  const [allStories, categories] = await Promise.all([
    getStories({ locale: 'ne', perPage: 40 }),
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

  const metrics = [
    {
      label: 'प्रकाशित समाचार',
      value: published.length,
      tone: 'brand' as const,
      href: '/admin/articles',
    },
    {
      label: 'निर्धारित प्रकाशन',
      value: scheduledCount,
      tone: 'mute' as const,
      href: '/admin/articles?status=scheduled',
    },
    {
      label: 'ब्रेकिङ',
      value: breakingCount,
      tone: 'breaking' as const,
      href: '/admin/articles',
    },
    { label: 'विभाग', value: categories.length, tone: 'brand' as const, href: '/admin/categories' },
  ]

  const roleLabel = NEWSROOM_ROLE_LABELS_NE[role] ?? role

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-rule bg-surface-raised p-5">
        <p className="text-meta font-semibold uppercase tracking-wide text-brand-strong" lang="ne">
          {formatDate(new Date().toISOString(), locale)} · {roleLabel}
        </p>
        <h2 className="mt-1 font-display text-h1 text-ink" lang="ne">
          स्वागत छ, {newsroom.displayName || newsroom.email.split('@')[0]} ।
        </h2>
        <p className="mt-2 text-body text-ink-soft" lang="ne">
          {isSuperDesk
            ? 'सुपर एडमिन: प्रयोगकर्ता, भूमिका र सञ्चालन सेटिङ यहाँबाट व्यवस्थापन गर्नुहोस्। सम्पादकीय काम समाचार सूचीबाट सुरु हुन्छ।'
            : isPublisherDesk
              ? 'प्रकाशक डेस्क: लाइभ प्यानल, विज्ञापन र सदस्यता उपकरण उपलब्ध छन्। दैनिक समाचार लेखन /admin/articles मा छ।'
              : 'सम्पादकीय डेस्क: नयाँ समाचार लेख्नुहोस्, ड्राफ्ट सम्पादन गर्नुहोस् र प्रकाशनको लागि तयार पार्नुहोस्।'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/articles/new"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-meta font-semibold text-surface transition-colors duration-fast ease-out-quint hover:bg-brand-strong"
            lang="ne"
          >
            + नयाँ समाचार
          </Link>
          <Link
            href="/admin/articles"
            className="inline-flex items-center gap-2 rounded-full border border-rule px-4 py-2 text-meta font-semibold text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:text-brand-strong"
            lang="ne"
          >
            सबै समाचार
          </Link>
          {isPublisherDesk ? (
            <Link
              href="/admin/live"
              className="inline-flex items-center gap-2 rounded-full border border-rule px-4 py-2 text-meta font-semibold text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:text-brand-strong"
              lang="ne"
            >
              लाइभ प्यानल
            </Link>
          ) : null}
          {isSuperDesk ? (
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 rounded-full border border-rule px-4 py-2 text-meta font-semibold text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:text-brand-strong"
              lang="ne"
            >
              प्रयोगकर्ता
            </Link>
          ) : null}
        </div>
      </div>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((m) => (
          <Link
            key={m.label}
            href={m.href}
            className="group rounded-lg border border-rule bg-surface-raised p-5 transition-shadow duration-fast ease-out-quint hover:shadow-card"
          >
            <p
              className={`font-display text-display font-extrabold leading-none ${
                m.tone === 'breaking'
                  ? 'text-breaking'
                  : m.tone === 'brand'
                    ? 'text-brand'
                    : 'text-ink'
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

      <section className="rounded-lg border border-rule bg-surface-raised p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-h2 text-ink" lang="ne">
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
        <ul className="mt-4 divide-y divide-rule">
          {published.slice(0, 8).map((s) => (
            <li key={s.id ?? s.slug} className="flex items-center gap-3 py-3">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full bg-brand"
                aria-hidden="true"
              />
              <Link
                href={`/admin/articles/${s.id ?? s.slug}/edit`}
                className="min-w-0 flex-1 truncate text-body font-semibold text-ink hover:text-brand-strong"
                lang="ne"
                title={s.titleNe}
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
          {published.length === 0 && (
            <li className="py-6 text-center text-body text-mute" lang="ne">
              कुनै समाचार प्रकाशित छैन। पहिलो समाचार बनाउनुहोस्।
            </li>
          )}
        </ul>
      </section>
    </div>
  )
}
