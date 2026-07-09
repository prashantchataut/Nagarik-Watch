import type { Metadata } from 'next'
import { revalidatePath } from 'next/cache'
import { requireNewsroomSession } from '@/lib/auth/session'
import { NEWSROOM_ROLES, NEWSROOM_ROLE_LABELS_NE } from '@/lib/admin-roles'
import { createNewsroomInvite, listNewsroomInvites, listNewsroomUsers, updateUserRoleByEmail } from '@/lib/newsroom-users'
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
  if (!['admin', 'super_admin'].includes(session.newsroomRole)) return
  const invite = await createNewsroomInvite({ email: formData.get('email'), role: formData.get('role'), invitedBy: session.email })
  if (invite) await recordAuditEvent({ session, action: 'create', targetType: 'user_invite', targetId: invite.email, summary: `Invited ${invite.email} as ${invite.role}` })
  revalidatePath('/admin/users')
}

async function promoteUser(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  if (!['admin', 'super_admin'].includes(session.newsroomRole)) return
  const email = String(formData.get('email') ?? '')
  const role = String(formData.get('role') ?? '')
  const ok = await updateUserRoleByEmail(email, role)
  if (ok) await recordAuditEvent({ session, action: 'role_change', targetType: 'user', targetId: email, summary: `Role changed to ${role}` })
  revalidatePath('/admin/users')
}

export default async function UsersPage() {
  const session = await requireNewsroomSession()
  const [users, invites] = await Promise.all([
    listNewsroomUsers({ id: session.userId, email: session.email, name: session.displayName ?? session.email, role: session.newsroomRole, status: 'active' }),
    listNewsroomInvites(),
  ])
  const canManage = ['admin', 'super_admin'].includes(session.newsroomRole)

  return (
    <div>
      <AdminPageHeader title="प्रयोगकर्ता" subtitle="Staff accounts, invites and role assignment" />
      {canManage ? (
        <AdminCard className="mb-5">
          <form action={inviteUser} className="grid gap-3 lg:grid-cols-[1fr_220px_auto] lg:items-end">
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">Email<input name="email" type="email" required className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" /></label>
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">Role<select name="role" className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink">{NEWSROOM_ROLES.filter((role) => role !== 'reader').map((role) => <option key={role} value={role}>{NEWSROOM_ROLE_LABELS_NE[role]}</option>)}</select></label>
            <button className="rounded-md bg-brand px-4 py-2 text-meta font-bold text-surface hover:bg-brand-strong">Create invite</button>
          </form>
        </AdminCard>
      ) : null}
      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <AdminCard>
          <h2 className="font-display text-h2 text-ink">Users</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-rule">
            <table className="min-w-full divide-y divide-rule text-left"><thead className="bg-surface text-caption uppercase tracking-wide text-mute"><tr><th className="px-4 py-3">User</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Change</th></tr></thead><tbody className="divide-y divide-rule">{users.map((user) => (<tr key={user.id}><td className="px-4 py-3"><p className="font-display font-semibold text-ink">{user.name}</p><p className="text-caption text-mute">{user.email}</p></td><td className="px-4 py-3 text-meta text-ink-soft">{user.role}</td><td className="px-4 py-3">{canManage ? <form action={promoteUser} className="flex gap-2"><input type="hidden" name="email" value={user.email} /><select name="role" defaultValue={user.role} className="h-9 rounded-md border border-rule bg-surface px-2 text-caption text-ink">{NEWSROOM_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}</select><button className="rounded-md border border-rule px-2 text-caption font-bold text-ink-soft hover:border-brand hover:text-brand-strong">Save</button></form> : '—'}</td></tr>))}</tbody></table>
          </div>
        </AdminCard>
        <AdminCard>
          <h2 className="font-display text-h2 text-ink">Pending invites</h2>
          <div className="mt-4 grid gap-3">{invites.length ? invites.map((invite) => <div key={invite.id} className="rounded-lg border border-rule bg-surface p-3"><p className="font-semibold text-ink">{invite.email}</p><p className="text-caption text-mute">{invite.role} · {invite.status}</p></div>) : <p className="rounded-lg border border-dashed border-rule p-5 text-center text-meta text-mute">No pending invites.</p>}</div>
        </AdminCard>
      </div>
    </div>
  )
}
