import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { assertNewsroomRole, COMMUNITY_MANAGER_ROLES } from '@/lib/admin-roles'
import { asSubmissionStatus, listSubmissions, type SubmissionStatus } from '@/lib/submissions'
import { AdminPageHeader, AdminEmptyState, AdminButton } from '@/components/admin/primitives'
import { SubmissionModerationActions } from '@/components/admin/SubmissionModerationActions'

export const metadata: Metadata = {
  title: 'टिप',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const statusOptions: { value: 'all' | SubmissionStatus; label: string }[] = [
  { value: 'all', label: 'सबै' },
  { value: 'new', label: 'नयाँ' },
  { value: 'in_review', label: 'समीक्षामा' },
  { value: 'accepted', label: 'स्वीकृत' },
  { value: 'rejected', label: 'अस्वीकृत' },
]

function statusLabel(status: SubmissionStatus): string {
  return statusOptions.find((option) => option.value === status)?.label ?? status
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ne-NP', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, COMMUNITY_MANAGER_ROLES)
  const sp = await searchParams
  const selected = asSubmissionStatus(sp.status)
  const submissions = await listSubmissions({
    status: selected === 'all' ? undefined : selected,
    limit: 200,
  })

  return (
    <div>
      <AdminPageHeader
        subtitle="/submit-story बाट आएका समाचार टिप, PSA, प्रमाण र correction requests"
      />

      <form className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-rule bg-surface-raised p-4">
        <label className="grid gap-1 text-caption font-semibold text-ink-soft">
          स्थिति
          <select
            name="status"
            defaultValue={selected}
            className="h-10 w-44 rounded-md border border-rule bg-surface px-3 text-body text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint"
          >
            {statusOptions.map((o) => (
              <option key={o.value} value={o.value} lang="ne">
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <AdminButton type="submit">
          फिल्टर
        </AdminButton>
        {selected !== 'new' ? (
          <AdminButton href="/admin/submissions" variant="secondary">
            खाली गर्नुहोस्
          </AdminButton>
        ) : null}
      </form>

      <div className="overflow-hidden rounded-lg border border-rule bg-surface-raised">
        <table className="min-w-full divide-y divide-rule text-left">
          <thead className="bg-surface text-caption uppercase tracking-wide text-mute">
            <tr>
              <th className="px-4 py-3 font-semibold" lang="ne">प्राप्त समय</th>
              <th className="px-4 py-3 font-semibold" lang="ne">टिपकर्ता</th>
              <th className="px-4 py-3 font-semibold" lang="ne">विषय</th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell" lang="ne">विवरण</th>
              <th className="px-4 py-3 font-semibold" lang="ne">स्थिति</th>
              <th className="px-4 py-3 font-semibold" lang="ne">कारबाही</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-0 py-0">
                  <AdminEmptyState
                    title="कुनै टिप प्राप्त भएको छैन"
                    body={
                      selected === 'all'
                        ? 'हालसम्म कुनै पाठक सबमिसन संकलन भएको छैन।'
                        : 'यो स्थितिमा कुनै पाठक सबमिसन छैन।'
                    }
                  />
                </td>
              </tr>
            ) : (
              submissions.map((submission) => (
                <tr key={submission.id} className="align-top hover:bg-brand-tint/30">
                  <td className="whitespace-nowrap px-4 py-3 text-caption text-ink-soft" lang="ne">
                    {formatDate(submission.createdAt)}
                    <code className="mt-1 block font-mono text-[0.68rem] text-mute" lang="en">
                      {submission.id}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-meta text-ink" lang="ne">
                    <div className="font-semibold">
                      {submission.anonymous ? 'Anonymous' : submission.name || 'नाम छैन'}
                    </div>
                    {!submission.anonymous && submission.email ? (
                      <div className="text-caption text-mute" lang="en">{submission.email}</div>
                    ) : null}
                    {!submission.anonymous && submission.phone ? (
                      <div className="text-caption text-mute" lang="en">{submission.phone}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-meta text-ink">
                    <div className="font-display font-semibold">{submission.headline}</div>
                    <div className="mt-1 text-caption text-mute" lang="en">{submission.type}</div>
                    {submission.evidenceUrl ? (
                      <a
                        href={submission.evidenceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex text-caption font-semibold text-brand-strong hover:underline"
                      >
                        Evidence
                      </a>
                    ) : null}
                  </td>
                  <td className="hidden max-w-md px-4 py-3 text-meta leading-relaxed text-ink-soft md:table-cell">
                    <span className="line-clamp-4">{submission.description}</span>
                    {submission.editorNote ? (
                      <p className="mt-2 rounded-md bg-surface px-2 py-1 text-caption text-ink" lang="ne">
                        Note: {submission.editorNote}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-caption font-semibold text-ink-soft" lang="ne">
                    {statusLabel(submission.status)}
                  </td>
                  <td className="px-4 py-3">
                    <SubmissionModerationActions id={submission.id} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
