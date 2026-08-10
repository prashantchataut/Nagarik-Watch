import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { assertNewsroomRole, COMMUNITY_MANAGER_ROLES } from '@/lib/admin-roles'
import { asSubmissionStatus, listSubmissions, type SubmissionStatus } from '@/lib/submissions'
import {
  AdminPageHeader,
  AdminEmptyState,
  AdminButton,
  AdminCard,
  AdminSelect,
  AdminFilterLink,
  AdminTable,
} from '@/components/admin/primitives'
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

function submissionStatusTone(
  status: SubmissionStatus,
): 'attention' | 'success' | 'danger' | 'neutral' {
  if (status === 'new' || status === 'in_review') return 'attention'
  if (status === 'accepted') return 'success'
  if (status === 'rejected') return 'danger'
  return 'neutral'
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
    limit: 100,
  })

  return (
    <div>
      <AdminPageHeader subtitle="/submit-story बाट आएका समाचार टिप, PSA, प्रमाण र correction requests" />

      <AdminCard className="mb-5">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <div className="w-44">
            <AdminSelect
              label="स्थिति"
              name="status"
              defaultValue={selected}
              options={statusOptions.map((o) => ({ value: o.value, label: o.label }))}
            />
          </div>
          <AdminButton type="submit">फिल्टर</AdminButton>
          {selected !== 'all' ? (
            <AdminButton href="/admin/submissions" variant="secondary">
              खाली गर्नुहोस्
            </AdminButton>
          ) : null}
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {statusOptions.map((option) => {
            const href =
              option.value === 'all'
                ? '/admin/submissions'
                : `/admin/submissions?status=${option.value}`
            return (
              <AdminFilterLink key={option.value} href={href} active={selected === option.value}>
                {option.label}
              </AdminFilterLink>
            )
          })}
        </div>
      </AdminCard>

      <AdminCard className="overflow-hidden !p-0">
        {submissions.length === 0 ? (
          <AdminEmptyState
            title="कुनै टिप प्राप्त भएको छैन"
            body={
              selected === 'all'
                ? 'हालसम्म कुनै पाठक सबमिसन संकलन भएको छैन।'
                : 'यो स्थितिमा कुनै पाठक सबमिसन छैन।'
            }
          />
        ) : (
          <AdminTable minWidth="52rem">
            <thead>
              <tr>
                <th lang="ne">प्राप्त समय</th>
                <th lang="ne">टिपकर्ता</th>
                <th lang="ne">विषय</th>
                <th className="hidden md:table-cell" lang="ne">
                  विवरण
                </th>
                <th lang="ne">स्थिति</th>
                <th lang="ne">कारबाही</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => (
                <tr key={submission.id} className="align-top">
                  <td className="whitespace-nowrap text-caption text-ink-soft" lang="ne">
                    {formatDate(submission.createdAt)}
                    <code className="mt-1 block font-mono text-[0.68rem] text-mute" lang="en">
                      {submission.id}
                    </code>
                  </td>
                  <td className="text-meta text-ink" lang="ne">
                    <div className="font-semibold">
                      {submission.anonymous ? 'Anonymous' : submission.name || 'नाम छैन'}
                    </div>
                    {!submission.anonymous && submission.email ? (
                      <div className="text-caption text-mute" lang="en">
                        {submission.email}
                      </div>
                    ) : null}
                    {!submission.anonymous && submission.phone ? (
                      <div className="text-caption text-mute" lang="en">
                        {submission.phone}
                      </div>
                    ) : null}
                  </td>
                  <td className="text-meta text-ink">
                    <div className="font-display font-semibold">{submission.headline}</div>
                    <div className="mt-1 text-caption text-mute" lang="en">
                      {submission.type}
                    </div>
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
                  <td className="hidden max-w-md text-meta leading-relaxed text-ink-soft md:table-cell">
                    <span className="line-clamp-4">{submission.description}</span>
                    {submission.editorNote ? (
                      <p
                        className="mt-2 rounded-md bg-surface px-2 py-1 text-caption text-ink"
                        lang="ne"
                      >
                        Note: {submission.editorNote}
                      </p>
                    ) : null}
                  </td>
                  <td>
                    <span
                      className={`admin-status admin-status--${submissionStatusTone(submission.status)}`}
                      lang="ne"
                    >
                      {statusLabel(submission.status)}
                    </span>
                  </td>
                  <td>
                    <SubmissionModerationActions id={submission.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTable>
        )}
      </AdminCard>
    </div>
  )
}
