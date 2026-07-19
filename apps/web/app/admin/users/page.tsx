import type { Metadata } from 'next'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireNewsroomSession } from '@/lib/auth/session'
import { NEWSROOM_ROLE_LABELS_NE } from '@/lib/admin-roles'
import {
  accountKindBadgeClass,
  accountKindLabel,
  resolveAccountKind,
  roleDisplayLabel,
} from '@/lib/account-identity'
import {
  createNewsroomInvite,
  listNewsroomInvites,
  listNewsroomUsers,
  revokeNewsroomInvite,
  rolesAssignableBy,
  setNewsroomUserDisabled,
  updateNewsroomUserRole,
  type NewsroomUserRecord,
} from '@/lib/newsroom-users'
import { roleGroupsForAssignable } from '@/lib/admin-role-groups'
import { recordAuditEvent } from '@/lib/audit-log'
import { AdminPageHeader, AdminCard, AdminButton, AdminFilterLink, AdminInput } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'प्रयोगकर्ता',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type Scope = 'all' | 'readers' | 'journalists' | 'newsroom' | 'disabled'

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
  await recordAuditEvent({
    session,
    action: 'create',
    targetType: 'user_invite',
    targetId: invite.email,
    summary: `Invited ${invite.email} as ${invite.role}`,
  })
  revalidatePath('/admin/users')
  redirect('/admin/users?result=sent')
}

async function revokeInvite(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  if (!['admin', 'super_admin'].includes(session.newsroomRole)) redirect('/admin/users?result=denied')
  const id = String(formData.get('id') ?? '')
  const ok = await revokeNewsroomInvite(id)
  if (ok) {
    await recordAuditEvent({
      session,
      action: 'revoke',
      targetType: 'user_invite',
      targetId: id,
      summary: 'Revoked newsroom invitation',
    })
  }
  revalidatePath('/admin/users')
  redirect(`/admin/users?result=${ok ? 'revoked' : 'invalid'}`)
}

async function promoteUser(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  if (!['admin', 'super_admin'].includes(session.newsroomRole)) redirect('/admin/users?result=denied')
  const email = String(formData.get('email') ?? '')
  const role = String(formData.get('role') ?? '')
  const ok = await updateNewsroomUserRole({
    email,
    role,
    actorEmail: session.email,
    actorRole: session.newsroomRole,
  })
  if (ok) {
    await recordAuditEvent({
      session,
      action: 'role_change',
      targetType: 'user',
      targetId: email,
      summary: `Role changed to ${role}`,
    })
  }
  revalidatePath('/admin/users')
  redirect(`/admin/users?result=${ok ? 'updated' : 'denied'}`)
}

async function toggleDisabled(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  if (!['admin', 'super_admin'].includes(session.newsroomRole)) redirect('/admin/users?result=denied')
  const email = String(formData.get('email') ?? '')
  const disabled = String(formData.get('disabled') ?? '') === 'true'
  const ok = await setNewsroomUserDisabled({
    email,
    disabled,
    actorEmail: session.email,
    actorRole: session.newsroomRole,
  })
  if (ok) {
    await recordAuditEvent({
      session,
      action: 'status_change',
      targetType: 'user',
      targetId: email,
      summary: disabled ? `Disabled account ${email}` : `Re-enabled account ${email}`,
    })
  }
  revalidatePath('/admin/users')
  redirect(`/admin/users?result=${ok ? (disabled ? 'disabled' : 'enabled') : 'denied'}`)
}

const notices: Record<string, string> = {
  sent: 'निमन्त्रणा इमेल पठाइयो। लिंक सात दिनसम्म मान्य हुन्छ।',
  invalid: 'इमेल, भूमिका वा निमन्त्रणा मान्य भएन।',
  delivery_failed: 'इमेल पठाउन सकिएन। प्रदायक सेटिङ जाँच्नुहोस्; अधुरो निमन्त्रणा निष्क्रिय गरिएको छ।',
  revoked: 'निमन्त्रणा रद्द गरियो।',
  updated: 'प्रयोगकर्ताको भूमिका अद्यावधिक भयो।',
  disabled: 'खाता निष्क्रिय गरियो। लगइन अवरुद्ध छ।',
  enabled: 'खाता पुनः सक्रिय गरियो।',
  denied: 'यो परिवर्तन गर्ने अनुमति छैन। आफ्नो वा उच्च अधिकारको खाता परिवर्तन गर्न मिल्दैन।',
}

function matchesScope(user: NewsroomUserRecord, scope: Scope): boolean {
  if (scope === 'disabled') return user.disabled
  if (user.disabled && scope !== 'all') return false
  const kind = resolveAccountKind(user.role)
  switch (scope) {
    case 'readers':
      return kind === 'reader'
    case 'journalists':
      return kind === 'journalist'
    case 'newsroom':
      return kind === 'newsroom' || kind === 'admin'
    default:
      return true
  }
}

function parseScope(value: string | undefined): Scope {
  if (value === 'readers' || value === 'journalists' || value === 'newsroom' || value === 'disabled') {
    return value
  }
  return 'all'
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ result?: string; scope?: string; q?: string }>
}) {
  const [session, query] = await Promise.all([requireNewsroomSession(), searchParams])
  const scope = parseScope(query.scope)
  const q = (query.q ?? '').trim().toLowerCase()
  const [users, invites] = await Promise.all([
    listNewsroomUsers({
      id: session.userId,
      email: session.email,
      name: session.displayName ?? session.email,
      role: session.newsroomRole,
      status: 'active',
      disabled: false,
    }),
    listNewsroomInvites(),
  ])
  const canManage = ['admin', 'super_admin'].includes(session.newsroomRole)
  const assignableRoles = rolesAssignableBy(session.newsroomRole)
  const roleGroups = roleGroupsForAssignable(assignableRoles)
  const notice = query.result ? notices[query.result] : null
  const filtered = users.filter((user) => {
    if (!matchesScope(user, scope)) return false
    if (!q) return true
    return user.email.toLowerCase().includes(q) || user.name.toLowerCase().includes(q) || user.role.includes(q)
  })
  const counts = {
    all: users.length,
    readers: users.filter((u) => !u.disabled && resolveAccountKind(u.role) === 'reader').length,
    journalists: users.filter((u) => !u.disabled && resolveAccountKind(u.role) === 'journalist').length,
    newsroom: users.filter((u) => {
      if (u.disabled) return false
      const kind = resolveAccountKind(u.role)
      return kind === 'newsroom' || kind === 'admin'
    }).length,
    disabled: users.filter((u) => u.disabled).length,
  }
  const filters: Array<{ id: Scope; label: string }> = [
    { id: 'all', label: `सबै (${counts.all})` },
    { id: 'readers', label: `पाठक (${counts.readers})` },
    { id: 'journalists', label: `पत्रकार (${counts.journalists})` },
    { id: 'newsroom', label: `न्यूजरुम (${counts.newsroom})` },
    { id: 'disabled', label: `निष्क्रिय (${counts.disabled})` },
  ]

  return (
    <div>
      <AdminPageHeader
        subtitle="पाठक, पत्रकार र न्यूजरुम खाता पहिचान, भूमिका र निष्क्रियता व्यवस्थापन"
      />
      {notice ? (
        <div
          className={`mb-5 rounded-lg border px-4 py-3 text-meta font-semibold ${
            ['sent', 'revoked', 'updated', 'disabled', 'enabled'].includes(query.result ?? '')
              ? 'border-rule bg-surface-raised text-ink'
              : 'border-breaking/30 bg-brand-tint text-brand-strong'
          }`}
          lang="ne"
        >
          {notice}
        </div>
      ) : null}

      {canManage ? (
        <AdminCard className="mb-5">
          <h2 className="font-display text-h2 text-ink" lang="ne">
            भूमिका निमन्त्रणा
          </h2>
          <p className="mt-1 text-meta text-mute" lang="ne">
            इमेलमा लिंक पठाइन्छ। स्वीकृत भएपछि मात्र भूमिका लागू हुन्छ। /admin/roles मा पूर्ण अधिकार तालिका हेर्नुहोस्।
          </p>
          <form action={inviteUser} className="mt-4 grid gap-3 lg:grid-cols-[1fr_260px_auto] lg:items-end">
            <AdminInput label="Email" name="email" type="email" required lang="en" />
            <label className="admin-field">
              <span className="admin-field-label" lang="en">
                Role
              </span>
              <select name="role" className="admin-field-control">
                {roleGroups.map((group) => (
                  <optgroup key={group.id} label={`${group.labelNe} · ${group.labelEn}`}>
                    {group.roles.map((role) => (
                      <option key={role} value={role}>
                        {NEWSROOM_ROLE_LABELS_NE[role]} ({role})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <AdminButton type="submit">निमन्त्रणा पठाउनुहोस्</AdminButton>
          </form>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {roleGroups.map((group) => (
              <div key={group.id} className="border border-rule bg-surface px-3 py-2">
                <p className="text-caption font-bold uppercase tracking-wide text-brand-strong" lang="ne">
                  {group.labelNe}
                </p>
                <p className="mt-1 text-caption text-mute" lang="ne">
                  {group.hintNe}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-caption text-mute" lang="ne">
            लिंक एकपटक प्रयोग हुने, इमेलसँग बाँधिएको र सात दिनमा समाप्त हुने हुन्छ। इमेल प्रदायक तयार नभए निमन्त्रणा सक्रिय हुँदैन।
          </p>
        </AdminCard>
      ) : null}

      <AdminCard className="mb-5">
        <form className="flex flex-wrap items-end gap-3" method="get">
          <div className="min-w-[14rem] flex-1">
            <AdminInput
              label="खोज्नुहोस्"
              name="q"
              defaultValue={query.q ?? ''}
              placeholder="इमेल, नाम वा भूमिका"
            />
          </div>
          <input type="hidden" name="scope" value={scope} />
          <AdminButton type="submit" variant="secondary">
            खोज
          </AdminButton>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((filter) => {
            const href = `/admin/users?scope=${filter.id}${q ? `&q=${encodeURIComponent(q)}` : ''}`
            const active = scope === filter.id
            return (
              <AdminFilterLink key={filter.id} href={href} active={active}>
                {filter.label}
              </AdminFilterLink>
            )
          })}
        </div>
      </AdminCard>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
        <AdminCard>
          <h2 className="font-display text-h2 text-ink">Accounts ({filtered.length})</h2>
          <div className="mt-4 overflow-x-auto rounded-lg border border-rule">
            <table className="min-w-full divide-y divide-rule text-left">
              <thead className="bg-surface text-caption uppercase tracking-wide text-mute">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Account</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {filtered.map((user) => {
                  const kind = resolveAccountKind(user.role)
                  const protectedTarget =
                    session.newsroomRole !== 'super_admin' && ['admin', 'super_admin'].includes(user.role)
                  const self = user.email.toLowerCase() === session.email.toLowerCase()
                  const manageable = canManage && !protectedTarget && !self
                  return (
                    <tr key={user.id} className={user.disabled ? 'bg-brand-tint/40' : undefined}>
                      <td className="px-4 py-3">
                        <p className="font-display font-semibold text-ink">{user.name}</p>
                        <p className="text-caption text-mute">{user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-md border px-2 py-0.5 text-caption font-bold ${accountKindBadgeClass(kind)}`}
                          lang="ne"
                        >
                          {accountKindLabel(kind, 'ne')}
                        </span>
                        {user.disabled ? (
                          <p className="mt-1 text-caption font-semibold text-breaking" lang="ne">
                            निष्क्रिय
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-meta text-ink-soft" lang="ne">
                        {roleDisplayLabel(user.role, 'ne')}
                      </td>
                      <td className="px-4 py-3">
                        {manageable ? (
                          <div className="flex flex-col gap-2">
                            <form action={promoteUser} className="flex flex-wrap gap-2">
                              <input type="hidden" name="email" value={user.email} />
                              <select
                                name="role"
                                defaultValue={user.role}
                                className="h-9 min-w-[12rem] rounded-md border border-rule bg-surface px-2 text-caption text-ink"
                              >
                                <option value="reader">पाठक / पहुँच हटाउने</option>
                                {roleGroups.map((group) => (
                                  <optgroup key={group.id} label={group.labelNe}>
                                    {group.roles.map((role) => (
                                      <option key={role} value={role}>
                                        {NEWSROOM_ROLE_LABELS_NE[role]}
                                      </option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                              <AdminButton type="submit" variant="secondary" className="!min-h-9 !px-2 !text-caption">
                                Save
                              </AdminButton>
                            </form>
                            <form action={toggleDisabled}>
                              <input type="hidden" name="email" value={user.email} />
                              <input type="hidden" name="disabled" value={user.disabled ? 'false' : 'true'} />
                              <button
                                className={`text-caption font-bold underline-offset-2 hover:underline ${
                                  user.disabled ? 'text-ink-soft' : 'text-breaking'
                                }`}
                              >
                                {user.disabled ? 'पुनः सक्रिय' : 'निष्क्रिय गर्नुहोस्'}
                              </button>
                            </form>
                          </div>
                        ) : (
                          <span className="text-caption text-mute">सुरक्षित</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 ? (
              <p className="p-5 text-center text-meta text-mute" lang="ne">
                यो फिल्टरमा खाता भेटिएन।
              </p>
            ) : null}
          </div>
        </AdminCard>
        <AdminCard>
          <h2 className="font-display text-h2 text-ink">Invitations</h2>
          <div className="mt-4 grid gap-3">
            {invites.length ? (
              invites.map((invite) => (
                <div key={invite.id} className="rounded-lg border border-rule bg-surface p-3">
                  <p className="font-semibold text-ink">{invite.email}</p>
                  <p className="text-caption text-mute" lang="ne">
                    {NEWSROOM_ROLE_LABELS_NE[invite.role] ?? invite.role} · {invite.status} · expires{' '}
                    {new Date(invite.expiresAt).toLocaleDateString('en-CA')}
                  </p>
                  {invite.status === 'pending' && canManage ? (
                    <form action={revokeInvite} className="mt-2">
                      <input type="hidden" name="id" value={invite.id} />
                      <button className="text-caption font-bold text-breaking underline-offset-2 hover:underline">Revoke</button>
                    </form>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-rule p-5 text-center text-meta text-mute">No invitations.</p>
            )}
          </div>
        </AdminCard>
      </div>
    </div>
  )
}
