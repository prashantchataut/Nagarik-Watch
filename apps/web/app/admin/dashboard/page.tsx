import Link from 'next/link'
import type { Metadata } from 'next'
import { getStories, getNavCategories } from '@/lib/content'
import { getProviderHealth } from '@/lib/live/health'
import type { NewsroomSession } from '@/lib/auth/session'
import type { Locale } from '@nagarikwatch/db'
import { formatDate } from '@nagarikwatch/db'

export const metadata: Metadata = {
  title: 'Dashboard',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Newsroom dashboard. Real metrics from the content source (no placeholder
 * numbers): published articles, scheduled publications, category count, and
 * provider health. Draft workflow totals are intentionally not inferred from
 * the public feed; they belong to the canonical CMS workflow API. The recent-
 * stories rail shows the last 8 published items so an editor lands on a live
 * view of the newsroom, not an empty scaffold.
 *
 * The page is a Server Component so every number is fetched on the server and
 * the HTML ships pre-rendered. No client fetch, no loading spinner.
 */
export default async function DashboardPage() {
  const session = (await import('@/lib/auth/session')).requireNewsroomSession
  const newsroom: NewsroomSession = await session()

  const [allStories, categories, providers] = await Promise.all([
    getStories({ locale: 'ne', perPage: 1000 }),
    getNavCategories(),
    getProviderHealth().catch(() => []),
  ])

  const published = allStories.items
  const scheduledCount = published.filter(
    (story) => Number.isFinite(Date.parse(story.publishedAt)) && Date.parse(story.publishedAt) > Date.now(),
  ).length
  const breakingCount = published.filter((s) => 'isBreaking' in s && s.isBreaking).length

  const locale: Locale = 'ne'
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
      href: '/admin/articles?breaking=1',
    },
    { label: 'विभाग', value: categories.length, tone: 'brand' as const, href: '/admin/categories' },
  ]

  const providerCounts = providers.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="space-y-6">
      {/* Welcome strip */}
      <div className="rounded-lg border border-rule bg-surface-raised p-5">
        <p className="text-meta font-semibold uppercase tracking-wide text-brand-strong" lang="ne">
          {formatDate(new Date().toISOString(), locale)}
        </p>
        <h2 className="mt-1 font-display text-h1 text-ink" lang="ne">
          स्वागत छ, {newsroom.displayName || newsroom.email.split('@')[0]} ।
        </h2>
        <p className="mt-2 text-body text-ink-soft" lang="ne">
          न्युजरुमको हालको अवस्था तल देखिएको छ। नयाँ समाचार लेख्न सुरु गर्नुहोस् वा कार्यप्रवाहमा
          रहेका समाचारहरू सम्पादन गर्नुहोस्।
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
            सबै समाचार हेर्नुहोस्
          </Link>
        </div>
      </div>

      {/* Metrics row */}
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

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Recent stories */}
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
              <li key={s.slug} className="flex items-center gap-3 py-3">
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full bg-brand"
                  aria-hidden="true"
                />
                <Link
                  href={`/admin/articles/${s.slug}/edit`}
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

        {/* Provider health */}
        <section className="rounded-lg border border-rule bg-surface-raised p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-h2 text-ink" lang="ne">
              लाइभ डाटा स्रोत
            </h3>
            <Link
              href="/admin/live-widgets"
              className="text-meta font-semibold text-brand hover:text-brand-strong"
              lang="ne"
            >
              व्यवस्थापन →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {(
              [
                ['उपलब्ध', providerCounts.ok ?? 0, 'text-up'],
                ['अव्यवस्थित', providerCounts.unconfigured ?? 0, 'text-mute'],
                ['नमुना', providerCounts.mock ?? 0, 'text-ink-soft'],
                ['त्रुटि', providerCounts.error ?? 0, 'text-down'],
              ] as const
            ).map(([label, value, cls]) => (
              <div key={label} className="rounded-md border border-rule p-3">
                <p className={`font-display text-h2 font-bold ${cls}`}>{value}</p>
                <p className="text-caption text-ink-soft" lang="ne">
                  {label}
                </p>
              </div>
            ))}
          </div>
          {providers.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {providers.slice(0, 5).map((p) => (
                <li key={p.key} className="flex items-center justify-between text-caption">
                  <span className="text-ink-soft" lang="ne">
                    {p.label}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-semibold ${
                      p.status === 'ok'
                        ? 'bg-brand-tint text-brand-strong'
                        : p.status === 'mock'
                          ? 'bg-brand-tint/50 text-ink-soft'
                          : 'border border-rule text-mute'
                    }`}
                  >
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
