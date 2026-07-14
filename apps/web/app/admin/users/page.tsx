import type { Metadata } from 'next'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireNewsroomSession } from '@/lib/auth/session'
import { NEWSROOM_ROLES, NEWSROOM_ROLE_LABELS_NE } from '@/lib/admin-roles'
import {
  createNewsroomInvite,
  listNewsroomInvites,
  listNewsroomUsers,
  revokeNewsroomInvite,
  rolesAssignableBy,
  updateNewsroomUserRole,
} from '@/lib/newsroom-users'
import { recordAuditEvent } from '@/lib/audit-log'
import { AdminPageHeader, AdminCard } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'प्रयोगकर्ता',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

async function inviteUser(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  if (!['admin', 'super_admin'].includes(session.newsroomRole)) redirect('/admin/users?result=denied')
  let invite: Awaited<ReturnType<typeof createNewsroomInvite>> = null
  try {
    invite = await createNewsroomInvite({
      email: formData.get('email'),
      role: formData.get('role'),
      invitedBy: session.email,
      actorRole: session.newsroomRole,
    })
  } catch (error) {
    console.error('[users] invitation delivery failed', error)
    redirect('/admin/users?result=delivery_failed')
  }
  if (!invite) redirect('/admin/users?result=invalid')
  await recordAuditEvent({ session, action: 'create', targetType: 'user_invite', targetId: invite.email, summary: `Invited ${invite.email} as ${invite.role}` })
  revalidatePath('/admin/users')
  redirect('/admin/users?result=sent')
}

async function revokeInvite(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  if (!['admin', 'super_admin'].includes(session.newsroomRole)) redirect('/admin/users?result=denied')
  const id = String(formData.get('id') ?? '')
  const ok = await revokeNewsroomInvite(id)
  if (ok) await recordAuditEvent({ session, action: 'revoke', targetType: 'user_invite', targetId: id, summary: 'Revoked newsroom invitation' })
  revalidatePath('/admin/users')
  redirect(`/admin/users?result=${ok ? 'revoked' : 'invalid'}`)
}

async function promoteUser(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  if (!['admin', 'super_admin'].includes(session.newsroomRole)) redirect('/admin/users?result=denied')
  const email = String(formData.get('email') ?? '')
  const role = String(formData.get('role') ?? '')
  const ok = await updateNewsroomUserRole({ email, role, actorEmail: session.email, actorRole: session.newsroomRole })
  if (ok) await recordAuditEvent({ session, action: 'role_change', targetType: 'user', targetId: email, summary: `Role changed to ${role}` })
  revalidatePath('/admin/users')
  redirect(`/admin/users?result=${ok ? 'updated' : 'denied'}`)
}

const notices: Record<string, string> = {
  sent: 'निमन्त्रणा इमेल पठाइयो। लिंक सात दिनसम्म मान्य हुन्छ।',
  invalid: 'इमेल, भूमिका वा निमन्त्रणा मान्य भएन।',
  delivery_failed: 'इमेल पठाउन सकिएन। प्रदायक सेटिङ जाँच्नुहोस्; अधुरो निमन्त्रणा निष्क्रिय गरिएको छ।',
  revoked: 'निमन्त्रणा रद्द गरियो।',
  updated: 'प्रयोगकर्ताको भूमिका अद्यावधिक भयो।',
  denied: 'यो परिवर्तन गर्ने अनुमति छैन। आफ्नो वा उच्च अधिकारको खाता परिवर्तन गर्न मिल्दैन।',
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const [session, query] = await Promise.all([requireNewsroomSession(), searchParams])
  const [users, invites] = await Promise.all([
    listNewsroomUsers({ id: session.userId, email: session.email, name: session.displayName ?? session.email, role: session.newsroomRole, status: 'active' }),
    listNewsroomInvites(),
  ])
  const canManage = ['admin', 'super_admin'].includes(session.newsroomRole)
  const assignableRoles = rolesAssignableBy(session.newsroomRole)
  const notice = query.result ? notices[query.result] : null

  return (
    <div>
      <AdminPageHeader title="प्रयोगकर्ता" subtitle="Staff accounts, signed invitations and role assignment" />
      {notice ? <div className={`mb-5 rounded-lg border px-4 py-3 text-meta font-semibold ${['sent', 'revoked', 'updated'].includes(query.result ?? '') ? 'border-rule bg-surface-raised text-ink' : 'border-breaking/30 bg-brand-tint text-brand-strong'}`} lang="ne">{notice}</div> : null}
      {canManage ? (
        <AdminCard className="mb-5">
          <form action={inviteUser} className="grid gap-3 lg:grid-cols-[1fr_220px_auto] lg:items-end">
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">Email<input name="email" type="email" required className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" /></label>
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">Role<select name="role" className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink">{assignableRoles.map((role) => <option key={role} value={role}>{NEWSROOM_ROLE_LABELS_NE[role]}</option>)}</select></label>
            <button className="rounded-md bg-brand px-4 py-2 text-meta font-bold text-surface hover:bg-brand-strong">निमन्त्रणा पठाउनुहोस्</button>
          </form>
          <p className="mt-3 text-caption text-mute" lang="ne">लिंक एकपटक प्रयोग हुने, इमेलसँग बाँधिएको र सात दिनमा समाप्त हुने हुन्छ। इमेल प्रदायक तयार नभए निमन्त्रणा सक्रिय हुँदैन।</p>
        </AdminCard>
      ) : null}
      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <AdminCard>
          <h2 className="font-display text-h2 text-ink">Users</h2>
          <div className="mt-4 overflow-x-auto rounded-lg border border-rule">
            <table className="min-w-full divide-y divide-rule text-left"><thead className="bg-surface text-caption uppercase tracking-wide text-mute"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Change</th></tr></thead><tbody className="divide-y divide-rule">{users.map((user) => {
              const protectedTarget = session.newsroomRole !== 'super_admin' && ['admin', 'super_admin'].includes(user.role)
              const self = user.email.toLowerCase() === session.email.toLowerCase()
              return <tr key={user.id}><td className="px-4 py-3"><p className="font-display font-semibold text-ink">{user.name}</p><p className="text-caption text-mute">{user.email}</p></td><td className="px-4 py-3 text-meta text-ink-soft">{user.role}</td><td className="px-4 py-3">{canManage && !protectedTarget && !self ? <form action={promoteUser} className="flex gap-2"><input type="hidden" name="email" value={user.email} /><select name="role" defaultValue={user.role} className="h-9 rounded-md border border-rule bg-surface px-2 text-caption text-ink"><option value="reader">पाठक / पहुँच हटाउने</option>{assignableRoles.map((role) => <option key={role} value={role}>{role}</option>)}</select><button className="rounded-md border border-rule px-2 text-caption font-bold text-ink-soft hover:border-brand hover:text-brand-strong">Save</button></form> : <span className="text-caption text-mute">सुरक्षित</span>}</td></tr>
            })}</tbody></table>
          </div>
        </AdminCard>
        <AdminCard>
          <h2 className="font-display text-h2 text-ink">Invitations</h2>
          <div className="mt-4 grid gap-3">{invites.length ? invites.map((invite) => <div key={invite.id} className="rounded-lg border border-rule bg-surface p-3"><p className="font-semibold text-ink">{invite.email}</p><p className="text-caption text-mute">{invite.role} · {invite.status} · expires {new Date(invite.expiresAt).toLocaleDateString('en-CA')}</p>{invite.status === 'pending' && canManage ? <form action={revokeInvite} className="mt-2"><input type="hidden" name="id" value={invite.id} /><button className="text-caption font-bold text-breaking underline-offset-2 hover:underline">Revoke</button></form> : null}</div>) : <p className="rounded-lg border border-dashed border-rule p-5 text-center text-meta text-mute">No invitations.</p>}</div>
        </AdminCard>
      </div>
    </div>
  )
}
