import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { NEWSROOM_ROLES, NEWSROOM_ROLE_LABELS_EN, NEWSROOM_ROLE_LABELS_NE, canCreate, canDelete, canEdit, canManageUsers, canModerateComments, canPublish } from '@/lib/admin-roles'
import { AdminPageHeader, AdminCard } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'भूमिका',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const checks = [
  ['Create', canCreate],
  ['Edit', canEdit],
  ['Publish', canPublish],
  ['Delete', canDelete],
  ['Moderate', canModerateComments],
  ['Users', canManageUsers],
] as const

export default async function RolesPage() {
  await requireNewsroomSession()
  return (
    <div>
      <AdminPageHeader title="भूमिका" subtitle="Reader, journalist and admin permissions are intentionally separated" />
      <AdminCard className="mb-5 border-l-4 border-l-brand">
        <p className="text-body text-ink" lang="ne">पत्रकार workspace /journalist मा रहन्छ। Admin panel editorial, moderation, analytics, ads र system settings का लागि मात्र हो।</p>
      </AdminCard>
      <AdminCard>
        <div className="overflow-auto rounded-lg border border-rule">
          <table className="min-w-[920px] divide-y divide-rule text-left">
            <thead className="bg-surface text-caption uppercase tracking-wide text-mute">
              <tr><th className="px-4 py-3">Role</th>{checks.map(([label]) => <th key={label} className="px-4 py-3">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {NEWSROOM_ROLES.map((role) => (
                <tr key={role}>
                  <td className="px-4 py-3"><p className="font-display font-semibold text-ink" lang="ne">{NEWSROOM_ROLE_LABELS_NE[role]}</p><p className="text-caption text-mute" lang="en">{NEWSROOM_ROLE_LABELS_EN[role]}</p></td>
                  {checks.map(([label, fn]) => <td key={label} className="px-4 py-3"><span className={fn(role) ? 'rounded-full bg-brand-tint px-2 py-0.5 text-caption font-bold text-brand-strong' : 'text-caption text-mute'}>{fn(role) ? 'Yes' : '—'}</span></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>
    </div>
  )
}
