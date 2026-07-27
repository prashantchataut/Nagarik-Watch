import type { Metadata } from 'next'
import { revalidatePath } from 'next/cache'
import { requireNewsroomSession } from '@/lib/auth/session'
import { getProviderHealth } from '@/lib/live/health'
import { listManualLiveRecords, setManualLiveRecord } from '@/lib/live/manual'
import { formatDate } from '@nagarikwatch/db'
import { AdminPageHeader, AdminCard, AdminButton, AdminInput, AdminTextarea, AdminTable } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'लाइभ विजेट',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const MANUAL_KEYS = [
  {
    key: 'nepse',
    label: 'NEPSE',
    example: '{"index":2840.25,"change":18.5,"changePercent":0.66,"open":true}',
  },
  {
    key: 'forex',
    label: 'Forex',
    example: '[{"iso3":"USD","name":"US Dollar","buy":133.2,"sell":133.8,"unit":"NPR"}]',
  },
  {
    key: 'gold-silver',
    label: 'Gold/Silver',
    example: '{"goldTolaNpr":158500,"silverTolaNpr":1850,"goldGramNpr":13600,"silverGramNpr":158,"unit":"NPR per tola"}',
  },
  {
    key: 'football',
    label: 'Football/FIFA',
    example: '[{"league":"FIFA World Cup 2026","home":"Germany","away":"Japan","score":"2-1","minute":"FT","status":"finished"}]',
  },
  {
    key: 'cricket',
    label: 'Cricket',
    example: '[{"league":"Nepal tour","home":"Nepal","away":"UAE","score":"142/6","status":"Live"}]',
  },
]

function providerStatusTone(status: string): 'success' | 'attention' | 'danger' | 'neutral' {
  if (status === 'ok') return 'success'
  if (status === 'mock') return 'attention'
  if (status === 'error') return 'danger'
  return 'neutral'
}

async function saveManualLive(formData: FormData) {
  'use server'
  await requireNewsroomSession()
  const key = String(formData.get('key') ?? '')
  if (!MANUAL_KEYS.some((item) => item.key === key)) return
  const raw = String(formData.get('data') ?? '').trim()
  if (!raw) return
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return
  }
  await setManualLiveRecord({
    key,
    source: String(formData.get('source') ?? '').trim() || 'Newsroom manual update',
    data,
  })
  revalidatePath('/admin/live-widgets')
}

export default async function LiveWidgetsPage() {
  await requireNewsroomSession()

  const providers = await getProviderHealth().catch(() => [])
  const manualRecords = await listManualLiveRecords().catch(() => [])
  const manualByKey = new Map(manualRecords.map((record) => [record.key, record]))

  const statusLabel: Record<string, string> = {
    ok: 'सक्रिय',
    mock: 'नमुना',
    unconfigured: 'अव्यवस्थित',
    error: 'त्रुटि',
  }

  return (
    <div>
      <AdminPageHeader
        subtitle={`${providers.length} वटा बाह्य डाटा प्रदायक + manual override`}
      />

      <AdminCard className="mb-5">
        <p className="text-body text-ink" lang="ne">
          Weather/AQI keyless Open-Meteo बाट चल्छ। NEPSE, FIFA/football, bullion वा forex provider fail भए fake-looking mock नदेखाउन editor ले तल manual JSON override राख्न सक्छ।
        </p>
      </AdminCard>

      <AdminCard className="mb-6">
        <h2 className="font-display text-h2 text-ink" lang="ne">Manual live-data override</h2>
        <p className="mt-2 max-w-body text-meta text-ink-soft" lang="ne">
          API नभएको वा unstable भएको data यहाँबाट update गर्नुहोस्। JSON shape सही हुनुपर्छ; गलत JSON save हुँदैन।
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {MANUAL_KEYS.map((item) => {
            const current = manualByKey.get(item.key)
            return (
              <form key={item.key} action={saveManualLive} className="rounded-lg border border-rule bg-surface p-4">
                <input type="hidden" name="key" value={item.key} />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-h3 text-ink" lang="en">{item.label}</h3>
                    <p className="mt-1 text-caption text-mute" lang="en">
                      key: {item.key}
                    </p>
                  </div>
                  {current ? (
                    <span className="admin-status admin-status--success">
                      Manual active
                    </span>
                  ) : null}
                </div>
                <AdminInput
                  label="Source label"
                  name="source"
                  defaultValue={current?.source ?? 'Newsroom manual update'}
                  lang="en"
                />
                <AdminTextarea
                  label="JSON data"
                  name="data"
                  defaultValue={current ? JSON.stringify(current.data, null, 2) : item.example}
                  rows={8}
                  lang="en"
                />
                <AdminButton type="submit" className="mt-3">
                  Save {item.label}
                </AdminButton>
              </form>
            )
          })}
        </div>
      </AdminCard>

      <AdminCard className="overflow-hidden !p-0">
        <AdminTable minWidth="48rem">
          <thead>
            <tr>
              <th lang="ne">प्रदायक</th>
              <th className="hidden md:table-cell" lang="ne">आवश्यक env</th>
              <th lang="ne">स्थिति</th>
              <th className="hidden lg:table-cell" lang="ne">स्रोत</th>
              <th className="hidden sm:table-cell" lang="ne">अन्तिम अपडेट</th>
              <th lang="ne">त्रुटि</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.key}>
                <td className="align-top">
                  <p className="font-display font-semibold text-ink" lang="ne">{p.label}</p>
                  <code className="font-mono text-caption text-mute" lang="en">{p.key}</code>
                </td>
                <td className="hidden align-top md:table-cell">
                  <ul className="flex flex-col gap-1">
                    {p.envVars.length ? p.envVars.map((v) => (
                      <li key={v}><code className="font-mono text-caption text-ink-soft" lang="en">{v}</code></li>
                    )) : <li className="text-caption text-mute">No key required</li>}
                  </ul>
                </td>
                <td className="align-top">
                  <span className={`admin-status admin-status--${providerStatusTone(p.status)}`} lang="ne">
                    {statusLabel[p.status] ?? p.status}
                  </span>
                </td>
                <td className="hidden align-top text-meta text-ink-soft lg:table-cell" lang="en">{p.source}</td>
                <td className="hidden align-top text-caption text-mute sm:table-cell" lang="ne">
                  {p.updatedAt ? formatDate(p.updatedAt, 'ne') : '—'}
                </td>
                <td className="align-top text-caption text-breaking" lang="ne">
                  {p.error ? <span className="line-clamp-2">{p.error}</span> : <span className="text-mute">—</span>}
                </td>
              </tr>
            ))}
            {providers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-body text-mute" lang="ne">कुनै प्रदायक जाँच्न सकिएन।</td>
              </tr>
            )}
          </tbody>
        </AdminTable>
      </AdminCard>
    </div>
  )
}
