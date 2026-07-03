import Link from 'next/link'
import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import {
  AdminPageHeader,
  AdminEmptyState,
} from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'टिप',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Reader tip submission queue. Mirrors the comments page pattern: a filter
 * bar + table header + empty state. The /submit-story public form is
 * scaffolded (see STATIC_HUBS['submit-story']) but the persistence layer
 * is not yet wired, so the queue is empty by design.
 */
export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await requireNewsroomSession()
  void session // auth gate; session unused on this surface
  const sp = await searchParams

  const statusOptions = [
    { value: 'all', label: 'सबै' },
    { value: 'new', label: 'नयाँ' },
    { value: 'in_review', label: 'समीक्षामा' },
    { value: 'accepted', label: 'स्वीकृत' },
    { value: 'rejected', label: 'अस्वीकृत' },
  ]

  return (
    <div>
      <AdminPageHeader
        title="पाठक टिप"
        subtitle="पाठकले /submit-story मार्फत पठाएका समाचार टिप"
      />

      <form className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-rule bg-surface-raised p-4">
        <label className="grid gap-1 text-caption font-semibold text-ink-soft">
          स्थिति
          <select
            name="status"
            defaultValue={sp.status ?? 'new'}
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
        {(sp.status ?? 'new') !== 'new' && (
          <Link
            href="/admin/submissions"
            className="h-10 rounded-full border border-rule px-4 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong"
            lang="ne"
          >
            खाली गर्नुहोस्
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-lg border border-rule bg-surface-raised">
        <table className="min-w-full divide-y divide-rule text-left">
          <thead className="bg-surface text-caption uppercase tracking-wide text-mute">
            <tr>
              <th className="px-4 py-3 font-semibold" lang="ne">प्राप्त समय</th>
              <th className="px-4 py-3 font-semibold" lang="ne">टिपकर्ता</th>
              <th className="px-4 py-3 font-semibold" lang="ne">विषय</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell" lang="ne">स्रोत</th>
              <th className="px-4 py-3 font-semibold" lang="ne">स्थिति</th>
              <th className="px-4 py-3 font-semibold" lang="ne">कारबाही</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-0 py-0">
                <AdminEmptyState
                  title="कुनै टिप प्राप्त भएको छैन"
                  body="पाठकले /submit-story पृष्ठबाट टिप पेश गरेपछि यहाँ देखिनेछ। संकलन भएपछि समीक्षा, स्वीकृति र अस्वीकृति यहाँबाट हुन्छ।"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
