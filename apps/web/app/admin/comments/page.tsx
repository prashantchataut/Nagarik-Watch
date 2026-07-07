import Link from 'next/link'
import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { canModerateComments } from '@/lib/admin-roles'
import { listAllComments, type CommentStatus } from '@/lib/engagement/store'
import {
  AdminPageHeader,
  AdminEmptyState,
} from '@/components/admin/primitives'
import { CommentModerationActions } from '@/components/admin/CommentModerationActions'

export const metadata: Metadata = {
  title: 'टिप्पणी मध्यस्थ',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const statusOptions: { value: 'all' | CommentStatus; label: string }[] = [
  { value: 'all', label: 'सबै' },
  { value: 'pending', label: 'पेन्डिङ' },
  { value: 'approved', label: 'स्वीकृत' },
  { value: 'rejected', label: 'अस्वीकृत' },
  { value: 'flagged', label: 'फ्ल्याग' },
]

function asStatus(value: string | undefined): 'all' | CommentStatus {
  return statusOptions.some((option) => option.value === value) ? value as 'all' | CommentStatus : 'pending'
}

function statusLabel(status: CommentStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? status
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ne-NP', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default async function CommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await requireNewsroomSession()
  const canModerate = canModerateComments(session.newsroomRole)
  const sp = await searchParams
  const selected = asStatus(sp.status)
  const comments = canModerate
    ? await listAllComments({ status: selected === 'all' ? undefined : selected, limit: 200 })
    : []

  return (
    <div>
      <AdminPageHeader
        title="टिप्पणी मध्यस्थ"
        subtitle="पाठकले पेश गरेका टिप्पणी हेर्नुहोस्, स्वीकृत गर्नुहोस् वा अस्वीकार गर्नुहोस्।"
      />

      {!canModerate && (
        <div role="alert" className="mb-5 rounded-lg border border-breaking/30 bg-brand-tint px-4 py-3 text-meta font-semibold text-brand-strong" lang="ne">
          तपाईंको भूमिकालाई टिप्पणी मध्यस्थता गर्ने अनुमति छैन।
        </div>
      )}

      <form className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-rule bg-surface-raised p-4">
        <label className="grid gap-1 text-caption font-semibold text-ink-soft">
          स्थिति
          <select
            name="status"
            defaultValue={selected}
            className="h-10 w-44 rounded-md border border-rule bg-surface px-3 text-body text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value} lang="ne">
                {option.label}
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
        {selected !== 'pending' && (
          <Link
            href="/admin/comments"
            className="inline-flex h-10 items-center rounded-full border border-rule px-4 text-meta font-semibold text-ink-soft hover:border-brand hover:text-brand-strong"
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
              <th className="px-4 py-3 font-semibold" lang="ne">समय</th>
              <th className="px-4 py-3 font-semibold" lang="ne">पाठक</th>
              <th className="px-4 py-3 font-semibold" lang="ne">समाचार</th>
              <th className="px-4 py-3 font-semibold" lang="ne">टिप्पणी</th>
              <th className="px-4 py-3 font-semibold" lang="ne">स्थिति</th>
              <th className="px-4 py-3 font-semibold" lang="ne">कारबाही</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {comments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-0 py-0">
                  <AdminEmptyState
                    title="कुनै टिप्पणी छैन"
                    body={selected === 'all' ? 'हालसम्म कुनै टिप्पणी संकलन भएको छैन।' : 'यो स्थितिमा कुनै टिप्पणी छैन।'}
                  />
                </td>
              </tr>
            ) : comments.map((comment) => (
              <tr key={comment.id} className="align-top">
                <td className="whitespace-nowrap px-4 py-3 text-caption text-ink-soft" lang="ne">
                  {formatDate(comment.createdAt)}
                </td>
                <td className="px-4 py-3 text-meta text-ink" lang="ne">
                  <div className="font-semibold">{comment.authorName}</div>
                  {comment.authorEmail ? <div className="text-caption text-mute">{comment.authorEmail}</div> : null}
                </td>
                <td className="px-4 py-3 text-meta text-ink-soft">
                  <Link href={`/${comment.articleCategory}/${comment.articleSlug}`} className="font-semibold text-brand-strong hover:underline">
                    {comment.articleCategory}/{comment.articleSlug}
                  </Link>
                </td>
                <td className="max-w-md px-4 py-3 text-meta leading-relaxed text-ink" lang={comment.locale === 'en' ? 'en' : 'ne'}>
                  {comment.bodyNe}
                </td>
                <td className="px-4 py-3 text-caption font-semibold text-ink-soft" lang="ne">
                  {statusLabel(comment.status)}
                </td>
                <td className="px-4 py-3">
                  <CommentModerationActions commentId={comment.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
