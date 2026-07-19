import type { Metadata } from 'next'
import { revalidatePath } from 'next/cache'
import { requireNewsroomSession } from '@/lib/auth/session'
import { assertNewsroomRole, SETTINGS_MANAGER_ROLES } from '@/lib/admin-roles'
import { listAdminSettings, setAdminSetting } from '@/lib/admin-settings'
import { recordAuditEvent } from '@/lib/audit-log'
import { AdminPageHeader, AdminCard, AdminButton, AdminInput, AdminTextarea } from '@/components/admin/primitives'

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
      <AdminPageHeader subtitle="Publication identity, contact details, social links and operational text" />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.4fr]">
        <AdminCard>
          <h2 className="font-display text-h2 text-ink" lang="ne">सेटिङ थप्नुहोस्</h2>
          <form action={saveSetting} className="mt-4 grid gap-3">
            <AdminInput label="Key" name="key" required placeholder="publication.taglineNe" lang="en" />
            <AdminInput label="Label" name="label" required lang="en" />
            <AdminInput label="Group" name="group" defaultValue="identity" lang="en" />
            <AdminTextarea label="Value" name="value" rows={5} />
            <AdminButton type="submit">Save setting</AdminButton>
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
                    <AdminTextarea
                      label={setting.label}
                      name="value"
                      defaultValue={setting.value}
                      rows={setting.value.length > 120 ? 4 : 2}
                    />
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <code className="text-caption text-mute" lang="en">{setting.key}</code>
                      <AdminButton type="submit" variant="secondary" className="!min-h-9 !px-3 !text-caption">
                        Update
                      </AdminButton>
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
