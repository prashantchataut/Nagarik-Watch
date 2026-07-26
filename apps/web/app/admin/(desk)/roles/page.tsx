import type { Metadata } from 'next'
import Link from 'next/link'
import { requireNewsroomSession } from '@/lib/auth/session'
import {
  NEWSROOM_ROLES,
  NEWSROOM_ROLE_LABELS_EN,
  NEWSROOM_ROLE_LABELS_NE,
  canCreate,
  canDelete,
  canEdit,
  canManageUsers,
  canModerateComments,
  canPublish,
} from '@/lib/admin-roles'
import { ROLE_ASSIGNMENT_GROUPS } from '@/lib/admin-role-groups'
import { AdminPageHeader, AdminCard, AdminTable } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'भूमिका',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-static'

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
      <AdminPageHeader
        subtitle="पाठक, पत्रकार र एडमिन पहुँच अलग राखिएको छ — Assign roles from Users"
      />

      <AdminCard className="mb-5">
        <p className="text-body text-ink" lang="ne">
          पत्रकार workspace <code className="text-meta">/journalist</code> मा रहन्छ। Admin panel
          editorial, moderation, analytics, ads र system settings का लागि मात्र हो। नयाँ भूमिका दिन{' '}
          <Link href="/admin/users" className="font-bold text-brand-strong underline-offset-2 hover:underline">
            Users
          </Link>{' '}
          बाट निमन्त्रणा पठाउनुहोस् वा अवस्थित खाता अपडेट गर्नुहोस्।
        </p>
      </AdminCard>

      <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {ROLE_ASSIGNMENT_GROUPS.map((group) => (
          <AdminCard key={group.id}>
            <p className="text-caption font-bold uppercase tracking-wide text-brand-strong" lang="ne">
              {group.labelNe}
            </p>
            <p className="mt-1 text-meta text-ink-soft" lang="ne">
              {group.hintNe}
            </p>
            <ul className="mt-3 space-y-1">
              {group.roles.map((role) => (
                <li key={role} className="text-caption text-ink">
                  <span lang="ne">{NEWSROOM_ROLE_LABELS_NE[role]}</span>
                  <span className="text-mute"> · </span>
                  <span lang="en">{NEWSROOM_ROLE_LABELS_EN[role]}</span>
                </li>
              ))}
            </ul>
          </AdminCard>
        ))}
      </div>

      <AdminCard>
        <h2 className="font-display text-h2 text-ink">Permission matrix</h2>
        <div className="mt-4">
          <AdminTable minWidth="57.5rem">
            <thead>
              <tr>
                <th>Role</th>
                {checks.map(([label]) => (
                  <th key={label}>{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NEWSROOM_ROLES.map((role) => (
                <tr key={role}>
                  <td>
                    <p className="font-display font-semibold text-ink" lang="ne">
                      {NEWSROOM_ROLE_LABELS_NE[role]}
                    </p>
                    <p className="text-caption text-mute" lang="en">
                      {NEWSROOM_ROLE_LABELS_EN[role]}
                    </p>
                  </td>
                  {checks.map(([label, fn]) => (
                    <td key={label}>
                      <span className={fn(role) ? 'admin-status admin-status--success' : 'text-caption text-mute'}>
                        {fn(role) ? 'Yes' : '—'}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </AdminTable>
        </div>
      </AdminCard>
    </div>
  )
}
