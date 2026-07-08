import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { AdminPageHeader, AdminEmptyState } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'अडिट लग',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Audit log. Records every editorial action (publish, retract, hard-
 * delete, role change) for compliance and post-mortem analysis. None are
 * persisted yet (the AuditLog collection exists in the db package but the
 * write-side hook is not yet wired into the editorial actions); this page
 * renders the table header + empty state so the audit surface is honest
 * about what it will contain.
 */
export default async function AuditLogPage() {
  const session = await requireNewsroomSession()
  void session // auth gate; session unused on this surface

  return (
    <div>
      <AdminPageHeader
        title="अडिट लग"
        subtitle="सम्पादकीय कार्यको अभिलेख — प्रकाशन, फिर्ता, मेटाउन र भूमिका परिवर्तन"
      />

      <div className="overflow-hidden rounded-lg border border-rule bg-surface-raised">
        <table className="min-w-full divide-y divide-rule text-left">
          <thead className="bg-surface text-caption uppercase tracking-wide text-mute">
            <tr>
              <th className="px-4 py-3 font-semibold" lang="ne">
                समय
              </th>
              <th className="px-4 py-3 font-semibold" lang="ne">
                कर्मी
              </th>
              <th className="px-4 py-3 font-semibold" lang="ne">
                कार्य
              </th>
              <th className="px-4 py-3 font-semibold" lang="ne">
                लक्ष्य
              </th>
              <th className="hidden px-4 py-3 font-semibold md:table-cell" lang="ne">
                विवरण
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="px-0 py-0">
                <AdminEmptyState
                  title="अडिट लग खाली छ"
                  body="सम्पादकीय कार्य अभिलेखित हुन थालेपछि यहाँ देखिनेछ। हालसम्म कुनै घटना लग भएको छैन।"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-caption text-mute" lang="ne">
        अडिट घटना{' '}
        <code className="font-mono text-ink-soft" lang="en">
          AuditLog
        </code>{' '}
        इन्टरफेसमा लेखिन्छन् — प्रकाशन, फिर्ता, कड मेटाउने र भूमिका परिवर्तन स्वतः अभिलेखित हुनेछन्।
      </p>
    </div>
  )
}
