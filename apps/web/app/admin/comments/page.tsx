import Link from 'next/link'
import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import {
  AdminPageHeader,
  AdminEmptyState,
} from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'टिप्पणी मध्यस्थ',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Comment moderation queue. Comments are not yet persisted (the reader
 * comment submission route is a Phase-7 deliverable); this surface shows
 * the shape of the queue — filter bar, table header, empty state — so
 * moderators can preview the workflow today. When the comments store is
 * wired, only the data fetch changes; the markup is already correct.
 */
export default async function CommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await requireNewsroomSession()
  void session // auth gate; session unused on this surface
  const sp = await searchParams

  const statusOptions = [
    { value: 'all', label: 'सबै' },
    { value: 'pending', label: 'पेन्डिङ' },
    { value: 'approved', label: 'स्वीकृत' },
    { value: 'rejected', label: 'अस्वीकृत' },
  ]

  return (
    <div>
      <AdminPageHeader
        title="टिप्पणी मध्यस्थ"
        subtitle="पाठकले पेश गरेका टिप्पणी यहाँ स्वीकृत वा अस्वीकृत गर्नुहोस्"
      />

      {/* Filter bar — kept even when empty so the moderator UI is honest */}
      <form className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-rule bg-surface-raised p-4">
        <label className="grid gap-1 text-caption font-semibold text-ink-soft">
          स्थिति
          <select
            name="status"
            defaultValue={sp.status ?? 'pending'}
            className="h-10 w-44 rounded-md border border-rule bg-surface px-3 text-body text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value} lang="ne">
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="h-10 rounded-full bg-brand px-5 text-meta font-semibold text-surface hover:bg-brand-strong"
          lang="ne"
        >
          फिल्टर
        </button>
        {(sp.status ?? 'pending') !== 'pending' && (
          <Link
            href="/admin/comments"
            className="h-10 rounded-full border border-rule px-4 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong"
            lang="ne"
          >
            खाली गर्नुहोस्
          </Link>
        )}
      </form>

      {/* Empty state — render the table header above it so the moderator
          sees the queue's shape even when there is nothing to action. */}
      <div className="overflow-hidden rounded-lg border border-rule bg-surface-raised">
        <table className="min-w-full divide-y divide-rule text-left">
          <thead className="bg-surface text-caption uppercase tracking-wide text-mute">
            <tr>
              <th className="px-4 py-3 font-semibold" lang="ne">समय</th>
              <th className="px-4 py-3 font-semibold" lang="ne">पाठक</th>
              <th className="px-4 py-3 font-semibold" lang="ne">समाचार</th>
              <th className="px-4 py-3 font-semibold" lang="ne">टिप्पणी</th>
              <th className="px-4 py-3 font-semibold" lang="ne">स्थिति</th>
              <th className="px-4 py-3 font-semibold" lang="ne">कारबाही</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-0 py-0">
                <AdminEmptyState
                  title="कुनै टिप्पणी छैन"
                  body="पाठकले समाचारमा टिप्पणी पेश गरेपछि यहाँ देखिनेछ। हालसम्म कुनै टिप्पणी संकलन भएको छैन।"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
