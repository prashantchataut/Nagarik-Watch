import Link from 'next/link'
import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { getStories, getNavCategories } from '@/lib/content'
import { seedCategories } from '@/lib/content/seed-source'
import {
  AdminPageHeader,
  AdminButton,
  StatusBadge,
} from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'विभाग',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Categories management. Lists every category, not just nav-visible ones —
 * the seed exports eight sections but only seven are `showInNav` (Diaspora
 * is hidden from the nav rail but still editable). The article-count column
 * is computed by counting seed stories per category slug, so the number is
 * real, not a placeholder. Create is gated behind a styled placeholder
 * because taxonomy edits require the Payload collection (apps/admin) and a
 * revalidation hook, not yet wired in apps/web.
 */
export default async function CategoriesPage() {
  const session = await requireNewsroomSession()
  void session // auth gate; session unused on this surface

  const [navCategories, storiesResult] = await Promise.all([
    getNavCategories(),
    getStories({ locale: 'ne', perPage: 1000 }),
  ])

  // Show every category (including non-nav ones like Diaspora), sorted by navOrder.
  const all = [...seedCategories].sort((a, b) => a.navOrder - b.navOrder)
  const countsBySlug = new Map<string, number>()
  for (const s of storiesResult.items) {
    countsBySlug.set(
      s.category.slug,
      (countsBySlug.get(s.category.slug) ?? 0) + 1,
    )
  }

  return (
    <div>
      <AdminPageHeader
        title="विभाग"
        subtitle={`नेभिगेसनमा देखिने ${navCategories.length} · कुल ${all.length}`}
        action={
          <AdminButton disabled title="नयाँ विभाग बनाउन Payload कन्फिगरेसन आवश्यक छ">
            + नयाँ विभाग
          </AdminButton>
        }
      />

      <div className="overflow-hidden rounded-lg border border-rule bg-surface-raised">
        <table className="min-w-full divide-y divide-rule text-left">
          <thead className="bg-surface text-caption uppercase tracking-wide text-mute">
            <tr>
              <th className="px-4 py-3 font-semibold" lang="ne">नाम (ने)</th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell" lang="ne">नाम (En)</th>
              <th className="px-4 py-3 font-semibold" lang="ne">स्लग</th>
              <th className="px-4 py-3 font-semibold text-right" lang="ne">समाचार</th>
              <th className="px-4 py-3 font-semibold text-right" lang="ne">नेभ क्रम</th>
              <th className="px-4 py-3 font-semibold" lang="ne">नेभमा</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {all.map((c) => (
              <tr key={c.slug} className="hover:bg-brand-tint/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/categories/${c.slug}`}
                    className="font-display font-semibold text-ink hover:text-brand-strong"
                    lang="ne"
                  >
                    {c.nameNe}
                  </Link>
                </td>
                <td className="hidden px-4 py-3 text-meta text-ink-soft sm:table-cell" lang="en">
                  {c.nameEn}
                </td>
                <td className="px-4 py-3">
                  <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-caption text-ink-soft" lang="en">
                    {c.slug}
                  </code>
                </td>
                <td className="px-4 py-3 text-right font-display text-h2 text-ink">
                  {countsBySlug.get(c.slug) ?? 0}
                </td>
                <td className="px-4 py-3 text-right text-meta text-ink-soft">
                  {c.navOrder}
                </td>
                <td className="px-4 py-3">
                  {c.showInNav ? (
                    <StatusBadge status="published" />
                  ) : (
                    <span className="rounded-full border border-rule px-2.5 py-0.5 text-caption font-semibold text-mute" lang="ne">
                      लुकेको
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
