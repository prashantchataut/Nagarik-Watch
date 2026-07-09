import 'server-only'
import { cleanMultiline, cleanText, ensureOperationalSchema, toIso, type Queryable } from '@/lib/ops-db'

export type AdminSetting = {
  key: string
  value: string
  label: string
  group: string
  updatedAt: string
}

type Row = { key: string; value: string; label: string; group_name: string; updated_at: Date | string }

const defaults: AdminSetting[] = [
  { key: 'publication.name', value: 'Nagarik Watch', label: 'Publication name', group: 'identity', updatedAt: new Date().toISOString() },
  { key: 'publication.taglineNe', value: 'सत्यापित समाचार, स्पष्ट सन्दर्भ', label: 'Nepali tagline', group: 'identity', updatedAt: new Date().toISOString() },
  { key: 'publication.taglineEn', value: 'Verified news, clear context', label: 'English tagline', group: 'identity', updatedAt: new Date().toISOString() },
  { key: 'contact.email', value: 'newsroom@nagarikwatch.com', label: 'Newsroom email', group: 'contact', updatedAt: new Date().toISOString() },
  { key: 'contact.address', value: 'Kathmandu, Nepal', label: 'Newsroom address', group: 'contact', updatedAt: new Date().toISOString() },
  { key: 'social.facebook', value: '', label: 'Facebook URL', group: 'social', updatedAt: new Date().toISOString() },
  { key: 'social.youtube', value: '', label: 'YouTube URL', group: 'social', updatedAt: new Date().toISOString() },
  { key: 'social.x', value: '', label: 'X/Twitter URL', group: 'social', updatedAt: new Date().toISOString() },
]

const memory = new Map(defaults.map((setting) => [setting.key, setting]))

async function ensureSchema(): Promise<Queryable | null> {
  return ensureOperationalSchema('admin-settings', async (pool) => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS nw_admin_settings (
        key text PRIMARY KEY,
        value text NOT NULL,
        label text NOT NULL,
        group_name text NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `)
  })
}

function rowToSetting(row: Row): AdminSetting {
  return { key: row.key, value: row.value, label: row.label, group: row.group_name, updatedAt: toIso(row.updated_at) }
}

export async function listAdminSettings(): Promise<AdminSetting[]> {
  const pool = await ensureSchema()
  if (pool) {
    for (const setting of defaults) {
      await pool.query(
        `INSERT INTO nw_admin_settings (key, value, label, group_name)
         VALUES ($1,$2,$3,$4)
         ON CONFLICT (key) DO NOTHING`,
        [setting.key, setting.value, setting.label, setting.group],
      )
    }
    const result = await pool.query<Row>(`SELECT * FROM nw_admin_settings ORDER BY group_name ASC, key ASC`)
    return result.rows.map(rowToSetting)
  }
  return Array.from(memory.values()).sort((a, b) => a.group.localeCompare(b.group) || a.key.localeCompare(b.key))
}

export async function setAdminSetting(input: { key: unknown; value: unknown; label?: unknown; group?: unknown }): Promise<AdminSetting> {
  const key = cleanText(input.key, 120)
  const value = cleanMultiline(input.value, 4000)
  const label = cleanText(input.label || key, 160)
  const group = cleanText(input.group || 'custom', 80)
  const setting: AdminSetting = { key, value, label, group, updatedAt: new Date().toISOString() }
  const pool = await ensureSchema()
  if (pool) {
    const result = await pool.query<Row>(
      `INSERT INTO nw_admin_settings (key, value, label, group_name)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, label = EXCLUDED.label, group_name = EXCLUDED.group_name, updated_at = now()
       RETURNING *`,
      [setting.key, setting.value, setting.label, setting.group],
    )
    return rowToSetting(result.rows[0]!)
  }
  memory.set(key, setting)
  return setting
}
