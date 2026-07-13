import type { Metadata } from 'next'
import { revalidatePath } from 'next/cache'
import { requireNewsroomSession } from '@/lib/auth/session'
import { assertNewsroomRole, SETTINGS_MANAGER_ROLES } from '@/lib/admin-roles'
import { listAdminSettings, setAdminSetting } from '@/lib/admin-settings'
import { recordAuditEvent } from '@/lib/audit-log'
import { AdminPageHeader, AdminCard } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'सेटिङ',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

async function saveSetting(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, SETTINGS_MANAGER_ROLES)
  const setting = await setAdminSetting({
    key: formData.get('key'),
    value: formData.get('value'),
    label: formData.get('label'),
    group: formData.get('group'),
  })
  await recordAuditEvent({ session, action: 'settings_change', targetType: 'setting', targetId: setting.key, summary: `Setting updated: ${setting.key}` })
  revalidatePath('/admin/settings')
}

export default async function SettingsPage() {
  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, SETTINGS_MANAGER_ROLES)
  const settings = await listAdminSettings()
  const groups = settings.reduce<Record<string, typeof settings>>((acc, setting) => {
    acc[setting.group] = [...(acc[setting.group] ?? []), setting]
    return acc
  }, {})

  return (
    <div>
      <AdminPageHeader title="सेटिङ" subtitle="Publication identity, contact details, social links and operational text" />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
        <AdminCard>
          <h2 className="font-display text-h2 text-ink" lang="ne">सेटिङ थप्नुहोस्</h2>
          <form action={saveSetting} className="mt-4 grid gap-3">
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">Key<input name="key" required placeholder="publication.taglineNe" className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" /></label>
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">Label<input name="label" required className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" /></label>
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">Group<input name="group" defaultValue="identity" className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" /></label>
            <label className="grid gap-1 text-caption font-semibold text-ink-soft">Value<textarea name="value" rows={5} className="rounded-md border border-rule bg-surface px-3 py-2 text-body text-ink" /></label>
            <button className="rounded-md bg-brand px-4 py-2 text-meta font-bold text-surface hover:bg-brand-strong" lang="ne">Save setting</button>
          </form>
        </AdminCard>
        <div className="grid gap-5">
          {Object.entries(groups).map(([group, items]) => (
            <AdminCard key={group}>
              <h2 className="font-display text-h2 capitalize text-ink" lang="en">{group}</h2>
              <div className="mt-4 grid gap-3">
                {items.map((setting) => (
                  <form key={setting.key} action={saveSetting} className="rounded-lg border border-rule bg-surface p-4">
                    <input type="hidden" name="key" value={setting.key} />
                    <input type="hidden" name="label" value={setting.label} />
                    <input type="hidden" name="group" value={setting.group} />
                    <label className="grid gap-1 text-caption font-semibold text-ink-soft">
                      {setting.label}
                      <textarea name="value" defaultValue={setting.value} rows={setting.value.length > 120 ? 4 : 2} className="rounded-md border border-rule bg-surface-raised px-3 py-2 text-body text-ink" />
                    </label>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <code className="text-caption text-mute" lang="en">{setting.key}</code>
                      <button className="rounded-md border border-rule px-3 py-1.5 text-caption font-bold text-ink-soft hover:border-brand hover:text-brand-strong" lang="ne">Update</button>
                    </div>
                  </form>
                ))}
              </div>
            </AdminCard>
          ))}
        </div>
      </div>
    </div>
  )
}
