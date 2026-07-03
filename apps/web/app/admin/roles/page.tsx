import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import {
  NEWSROOM_ROLES,
  NEWSROOM_ROLE_LABELS_NE,
  CONTRIBUTOR_ROLES,
  EDITOR_ROLES,
  PUBLISHER_ROLES,
  HARD_DELETE_ROLES,
  USER_MANAGER_ROLES,
  type NewsroomRole,
} from '@/lib/admin-roles'
import {
  AdminPageHeader,
  AdminCard,
} from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'भूमिका',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Roles & permissions reference. Renders every newsroom role and the
 * canonical four-capability matrix: create, edit, publish, delete, plus
 * user-management. The source of truth is lib/admin-roles.ts; this page
 * is a pure read view of those ReadonlySets, so when a role is added in
 * code the table updates automatically. ✓ means yes, — means no.
 */
export default async function RolesPage() {
  const session = await requireNewsroomSession()
  void session // auth gate; session unused on this surface

  const roles = NEWSROOM_ROLES as readonly NewsroomRole[]

  const table = roles.map((role) => ({
    role,
    label: NEWSROOM_ROLE_LABELS_NE[role],
    canCreate: CONTRIBUTOR_ROLES.has(role),
    canEdit: EDITOR_ROLES.has(role),
    canPublish: PUBLISHER_ROLES.has(role),
    canDelete: HARD_DELETE_ROLES.has(role),
    canManageUsers: USER_MANAGER_ROLES.has(role),
  }))

  const Yes = () => (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-tint font-bold text-brand-strong" aria-label="सक्षम">
      ✓
    </span>
  )
  const No = () => (
    <span className="inline-flex h-5 w-5 items-center justify-center text-mute" aria-label="अक्षम">
      —
    </span>
  )

  type CapabilityKey =
    | 'canCreate'
    | 'canEdit'
    | 'canPublish'
    | 'canDelete'
    | 'canManageUsers'
  const columns: { key: CapabilityKey; labelNe: string }[] = [
    { key: 'canCreate', labelNe: 'सिर्जना' },
    { key: 'canEdit', labelNe: 'सम्पादन' },
    { key: 'canPublish', labelNe: 'प्रकाशन' },
    { key: 'canDelete', labelNe: 'मेटाउन' },
    { key: 'canManageUsers', labelNe: 'प्रयोगकर्ता व्यवस्थापन' },
  ]

  return (
    <div>
      <AdminPageHeader
        title="भूमिका र अनुमति"
        subtitle="सम्पादकीय सोपानका सबै भूमिका र तिनका अनुमति सन्दर्भ"
      />

      <AdminCard className="mb-5 border-l-4 border-l-brand">
        <p className="text-body text-ink" lang="ne">
          यो एउटा <strong>सन्दर्भ तालिका</strong> हो, सम्पादन पृष्ठ होइन। भूमिका र अनुमति
          <code className="font-mono text-ink-soft" lang="en"> lib/admin-roles.ts</code>{' '}
          मा परिभाषित छन् र Payload <code className="font-mono text-ink-soft" lang="en">Users</code>{' '}
          कलेक्सनमा लागू हुन्छन्। तलका ✓ चिन्हले सो भूमिकाले सो कार्य गर्न सक्ने जनाउँछ।
        </p>
      </AdminCard>

      <div className="overflow-hidden rounded-lg border border-rule bg-surface-raised">
        <table className="min-w-full divide-y divide-rule text-left">
          <thead className="bg-surface text-caption uppercase tracking-wide text-mute">
            <tr>
              <th className="px-4 py-3 font-semibold" lang="ne">भूमिका</th>
              <th className="hidden px-4 py-3 font-semibold sm:table-cell" lang="en">key</th>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-3 text-center font-semibold" lang="ne">
                  {c.labelNe}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {table.map((r) => (
              <tr key={r.role} className="hover:bg-brand-tint/30">
                <td className="px-4 py-3 font-display font-semibold text-ink" lang="ne">
                  {r.label}
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <code className="font-mono text-caption text-mute" lang="en">
                    {r.role}
                  </code>
                </td>
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 text-center">
                    {r[c.key] ? <Yes /> : <No />}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-caption text-mute" lang="ne">
        <strong>मुख्य एडमिन</strong> (<code className="font-mono text-ink-soft" lang="en">super_admin</code>)
        मात्र कड मेटाउन सक्षम छ — यो जानबुझकर निर्णय हो, त्यसैले कुनै पनि सम्पादकीय भूमिकाले
        अन्तिम मेटाउन सक्दैन।
      </p>
    </div>
  )
}
