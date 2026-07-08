import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { NEWSROOM_ROLE_LABELS_NE } from '@/lib/admin-roles'
import { AdminPageHeader, AdminCard, AdminButton, StatusBadge } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'प्रयोगकर्ता',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * User management. Better Auth is the source of truth for users, so this
 * page surfaces only the currently-signed-in account (the only guaranteed
 * row). Invite is gated behind an email provider — Better Auth needs SMTP
 * to send the invite link — so the button stays disabled with a tooltip
 * until that is wired. No fake users are rendered.
 */
export default async function UsersPage() {
  const session = await requireNewsroomSession()

  const emailConfigured = Boolean(
    process.env.SMTP_HOST || process.env.EMAIL_SERVER || process.env.RESEND_API_KEY,
  )

  const users = [
    {
      id: session.userId,
      name: session.displayName ?? session.email.split('@')[0]!,
      email: session.email,
      role: session.newsroomRole,
      status: 'active',
    },
  ]

  return (
    <div>
      <AdminPageHeader
        title="प्रयोगकर्ता"
        subtitle="Better Auth द्वारा व्यवस्थित प्रयोगकर्ता खाता"
        action={
          <AdminButton
            disabled
            title="प्रयोगकर्ता निमन्त्रणाका लागि इमेल प्रदायक कन्फिगर गर्नुहोस्"
          >
            + निमन्त्रणा पठाउनुहोस्
          </AdminButton>
        }
      />

      <AdminCard className="mb-5 border-l-4 border-l-brand">
        <p className="text-body text-ink" lang="ne">
          प्रयोगकर्ता खाता Better Auth ले व्यवस्थापन गर्छ। खाता सिर्जना, पासवर्ड रिसेट, र सत्र
          व्यवस्थापन सबै Better Auth API मार्फत हुन्छ — यो पृष्ठले अवलोकन मात्र देखाउँछ। हालको
          सत्रका प्रयोगकर्ता मात्र तल देखिन्छन्।
        </p>
        {!emailConfigured && (
          <p className="mt-3 text-caption text-mute" lang="ne">
            निमन्त्रणा पठाउन{' '}
            <code className="font-mono text-ink-soft" lang="en">
              SMTP_HOST
            </code>{' '}
            वा{' '}
            <code className="font-mono text-ink-soft" lang="en">
              RESEND_API_KEY
            </code>{' '}
            कन्फिगर गर्नुहोस्।
          </p>
        )}
      </AdminCard>

      <div className="overflow-hidden rounded-lg border border-rule bg-surface-raised">
        <table className="min-w-full divide-y divide-rule text-left">
          <thead className="bg-surface text-caption uppercase tracking-wide text-mute">
            <tr>
              <th className="px-4 py-3 font-semibold" lang="ne">
                नाम
              </th>
              <th className="px-4 py-3 font-semibold" lang="ne">
                इमेल
              </th>
              <th className="px-4 py-3 font-semibold" lang="ne">
                भूमिका
              </th>
              <th className="px-4 py-3 font-semibold" lang="ne">
                स्थिति
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-brand-tint/30">
                <td className="px-4 py-3 font-display font-semibold text-ink" lang="ne">
                  {u.name}
                </td>
                <td className="px-4 py-3 text-meta text-ink-soft" lang="en">
                  {u.email}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="rounded-full bg-brand-tint px-2.5 py-0.5 text-caption font-semibold text-brand-strong"
                    lang="ne"
                  >
                    {NEWSROOM_ROLE_LABELS_NE[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status="published" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
