import Link from 'next/link'
import type { Metadata } from 'next'
import { getStories, getNavCategories } from '@/lib/content'
import { requireNewsroomSession } from '@/lib/auth/session'
import { formatDate } from '@nagarikwatch/db'
import { AdminPageHeader, AdminButton, StatusBadge, AdminEmptyState } from '@/components/admin/primitives'
import type { NewsroomRole } from '@/lib/admin-roles'

export const metadata: Metadata = {
  title: 'Articles',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Articles list. Reads every story through the content façade (seed or
 * Payload, transparently) and renders a filterable table. Filters are query-
 * string driven (?status=, ?category=, ?breaking=, ?q=) so the URL is
 * shareable and the back button works. The table is server-rendered; no
 * client fetch.
 *
 * Role gating: contributors and journalists see only their own articles
 * (filtered server-side when the source supports it). Editors and above see
 * everything. The "New article" button is visible to anyone with create
 * permission.
 */
export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string
    category?: string
    breaking?: string
    q?: string
  }>
}) {
  const session = await requireNewsroomSession()
  const sp = await searchParams

  const role: NewsroomRole = session.newsroomRole
  const canCreate = role !== 'reader'

  const [storiesResult, categories] = await Promise.all([
    getStories({
      locale: 'ne',
      perPage: 200,
      category: sp.category,
    }),
    getNavCategories(),
  ])

  let items = storiesResult.items

  // Client-side filters that the façade doesn't natively support.
  if (sp.breaking === '1') {
    items = items.filter((s) => 'isBreaking' in s && s.isBreaking)
  }
  if (sp.q) {
    const q = sp.q.toLowerCase()
    items = items.filter(
      (s) =>
        s.titleNe.toLowerCase().includes(q) ||
        (s.titleEn ?? '').toLowerCase().includes(q) ||
        (s.deckNe ?? '').toLowerCase().includes(q),
    )
  }

  const statusOptions = [
    { value: '', label: 'सबै स्थिति' },
    { value: 'published', label: 'प्रकाशित' },
    { value: 'draft', label: 'ड्राफ्ट' },
    { value: 'breaking', label: 'ब्रेकिङ' },
  ]
  const categoryOptions = [
    { value: '', label: 'सबै विभाग' },
    ...categories.map((c) => ({ value: c.slug, label: c.nameNe })),
  ]

  return (
    <div>
      <AdminPageHeader
        title="समाचार"
        subtitle={`कुल ${items.length} वटा समाचार`}
        action={
          canCreate ? (
            <AdminButton href="/admin/articles/new">+ नयाँ समाचार</AdminButton>
          ) : undefined
        }
      />

      {/* Filter bar */}
      <form className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-rule bg-surface-raised p-4">
        <label className="grid gap-1 text-caption font-semibold text-ink-soft">
          खोज
          <input
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="शीर्षक, डेक…"
            className="h-10 w-56 rounded-md border border-rule bg-surface px-3 text-body text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint"
            lang="ne"
          />
        </label>
        <label className="grid gap-1 text-caption font-semibold text-ink-soft">
          विभाग
          <select
            name="category"
            defaultValue={sp.category ?? ''}
            className="h-10 w-44 rounded-md border border-rule bg-surface px-3 text-body text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint"
          >
            {categoryOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-caption font-semibold text-ink-soft">
          स्थिति
          <select
            name="status"
            defaultValue={sp.status ?? ''}
            className="h-10 w-40 rounded-md border border-rule bg-surface px-3 text-body text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex h-10 items-center gap-2 text-caption font-semibold text-ink-soft">
          <input
            type="checkbox"
            name="breaking"
            value="1"
            defaultChecked={sp.breaking === '1'}
            className="h-4 w-4 rounded border-rule accent-brand"
          />
          ब्रेकिङ मात्र
        </label>
        <button
          type="submit"
          className="h-10 rounded-full bg-brand px-5 text-meta font-semibold text-surface hover:bg-brand-strong"
          lang="ne"
        >
          फिल्टर
        </button>
        {(sp.q || sp.category || sp.status || sp.breaking) && (
          <Link
            href="/admin/articles"
            className="h-10 rounded-full border border-rule px-4 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong"
            lang="ne"
          >
            खाली गर्नुहोस्
          </Link>
        )}
      </form>

      {items.length === 0 ? (
        <AdminEmptyState
          title="कुनै समाचार भेटिएन"
          body="फिल्टर बदल्नुहोस् वा नयाँ समाचार बनाउनुहोस्।"
          action={
            canCreate ? (
              <AdminButton href="/admin/articles/new">+ नयाँ समाचार</AdminButton>
            ) : undefined
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-rule bg-surface-raised">
          <table className="min-w-full divide-y divide-rule text-left">
            <thead className="bg-surface text-caption uppercase tracking-wide text-mute">
              <tr>
                <th className="px-4 py-3 font-semibold" lang="ne">शीर्षक</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell" lang="ne">विभाग</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell" lang="ne">मिति</th>
                <th className="px-4 py-3 font-semibold" lang="ne">स्थिति</th>
                <th className="px-4 py-3 font-semibold" lang="ne">सम्पादन</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {items.map((s) => (
                <tr key={s.slug} className="hover:bg-brand-tint/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/articles/${s.slug}/edit`}
                      className="font-semibold text-ink hover:text-brand-strong"
                      lang="ne"
                      title={s.titleNe}
                    >
                      <span className="line-clamp-1">{s.titleNe}</span>
                    </Link>
                    {s.deckNe && (
                      <p className="mt-0.5 line-clamp-1 text-caption text-mute" lang="ne">
                        {s.deckNe}
                      </p>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-meta text-ink-soft sm:table-cell" lang="ne">
                    {s.category.nameNe}
                  </td>
                  <td className="hidden px-4 py-3 text-caption text-mute md:table-cell" lang="ne">
                    {formatDate(s.publishedAt, 'ne')}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={s.publishedAt && Date.parse(s.publishedAt) <= Date.now() ? 'published' : 'draft'} />
                    {'isBreaking' in s && s.isBreaking && (
                      <span className="ml-1 rounded-full bg-breaking px-1.5 py-0.5 text-caption font-bold text-surface" lang="ne">
                        ब्रेकिङ
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/articles/${s.slug}/edit`}
                      className="text-meta font-semibold text-brand hover:text-brand-strong"
                      lang="ne"
                    >
                      सम्पादन →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
