import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireNewsroomSession } from '@/lib/auth/session'
import { getProviderHealth } from '@/lib/live/health'
import { listManualLiveRecords, setManualLiveRecord } from '@/lib/live/manual'
import { validateManualLiveData } from '@/lib/live/manual-schema'
import { formatDate, todayBsInKathmandu } from '@nagarikwatch/db'
import {
  getCalendarProviderState,
  syncCalendarScheduleFromProvider,
} from '@/lib/calendar-provider'
import {
  AdminPageHeader,
  AdminCard,
  AdminButton,
  AdminInput,
  AdminTextarea,
  AdminTable,
  AdminCallout,
} from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'लाइभ विजेट',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

const MANUAL_KEYS = [
  {
    key: 'nepse',
    label: 'NEPSE',
    purpose: 'सार्वजनिक NEPSE फिड असफल हुँदा प्रमाणित सूचकाङ्क।',
    example: '{"index":2840.25,"change":18.5,"changePercent":0.66,"open":true}',
  },
  {
    key: 'forex',
    label: 'Forex',
    purpose: 'NRB फिड असफल हुँदा वास्तविक खरिद/बिक्री दर मात्र।',
    example: '[{"iso3":"USD","name":"US Dollar","buy":133.2,"sell":133.8,"unit":"NPR"}]',
  },
  {
    key: 'gold-silver',
    label: 'Gold / Silver',
    purpose: 'प्रकाशित महासंघ/प्रमाणित बजार दर। अनुमानित मूल्य निषेध।',
    example:
      '{"goldTolaNpr":158500,"silverTolaNpr":1850,"goldGramNpr":13589,"silverGramNpr":158.6,"unit":"NPR per tola"}',
  },
  {
    key: 'rashifal',
    label: 'Daily Rashifal',
    purpose: 'आजको काठमाडौं मितिका १२ राशिको पूर्ण सम्पादकीय संस्करण।',
    example:
      '{"date":"2026-08-21","signs":[{"slug":"mesha","forecastNe":"सम्पादकले लेखेको आजको पाठ","forecastEn":"Optional English"}]}',
  },
  {
    key: 'football',
    label: 'Football',
    purpose: 'प्रमाणित fixture/score override।',
    example:
      '[{"league":"Competition","home":"Home","away":"Away","score":"2-1","minute":"FT","status":"finished"}]',
  },
  {
    key: 'cricket',
    label: 'Cricket',
    purpose: 'प्रमाणित fixture/score override।',
    example:
      '[{"league":"Series","home":"Nepal","away":"Opponent","score":"142/6","status":"Live"}]',
  },
] as const

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
  if (!MANUAL_KEYS.some((item) => item.key === key)) {
    redirect('/admin/live-widgets?error=invalid-key')
  }

  const source = String(formData.get('source') ?? '').trim()
  const raw = String(formData.get('data') ?? '').trim()
  if (!source || source.toLowerCase() === 'newsroom manual update') {
    redirect(`/admin/live-widgets?error=source&key=${encodeURIComponent(key)}`)
  }
  if (!raw) redirect(`/admin/live-widgets?error=empty&key=${encodeURIComponent(key)}`)

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    redirect(`/admin/live-widgets?error=json&key=${encodeURIComponent(key)}`)
  }

  const validation = validateManualLiveData(key, data)
  if (!validation.ok) {
    redirect(
      `/admin/live-widgets?error=shape&key=${encodeURIComponent(key)}&detail=${encodeURIComponent(validation.message)}`,
    )
  }

  await setManualLiveRecord({ key, source, data })
  revalidatePath('/admin/live-widgets')
  revalidatePath('/patro')
  revalidatePath('/ne/patro')
  revalidatePath('/en/patro')
  revalidatePath('/market')
  revalidatePath('/ne/market')
  revalidatePath('/en/market')
  revalidatePath('/rashifal')
  revalidatePath('/ne/rashifal')
  revalidatePath('/en/rashifal')
  redirect(`/admin/live-widgets?saved=${encodeURIComponent(key)}`)
}

async function syncCalendar(formData: FormData) {
  'use server'
  await requireNewsroomSession()
  const year = Number(formData.get('year'))
  if (!Number.isInteger(year) || year < 2000 || year > 2099) {
    redirect('/admin/live-widgets?error=calendar-year')
  }
  try {
    await syncCalendarScheduleFromProvider(year)
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Calendar provider sync failed'
    redirect(`/admin/live-widgets?error=calendar-provider&detail=${encodeURIComponent(detail)}`)
  }
  revalidatePath('/admin/live-widgets')
  revalidatePath('/patro')
  revalidatePath('/ne/patro')
  revalidatePath('/en/patro')
  redirect('/admin/live-widgets?saved=calendar-schedule')
}

export default async function LiveWidgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; key?: string; saved?: string; detail?: string }>
}) {
  await requireNewsroomSession()
  const params = await searchParams
  const [providers, manualRecords] = await Promise.all([
    getProviderHealth().catch(() => []),
    listManualLiveRecords().catch(() => []),
  ])
  const manualByKey = new Map(manualRecords.map((record) => [record.key, record]))
  const calendarRecord = manualByKey.get('calendar-schedule')
  const calendarValid = calendarRecord
    ? validateManualLiveData('calendar-schedule', calendarRecord.data).ok
    : false
  const calendarData = calendarValid
    ? (calendarRecord?.data as { year: number; events: unknown[] })
    : null
  const calendarProvider = getCalendarProviderState()

  const statusLabel: Record<string, string> = {
    ok: 'सक्रिय',
    empty: 'डेटा खाली',
    mock: 'गैर-लाइभ',
    unconfigured: 'कन्फिगर छैन',
    error: 'त्रुटि',
  }

  const errorMessage =
    params.error === 'json'
      ? `${params.key ?? 'Widget'} को JSON अवैध छ।`
      : params.error === 'empty'
        ? 'JSON खाली छ। स्रोत जाँचेर वास्तविक data राख्नुहोस्।'
        : params.error === 'invalid-key'
          ? 'अमान्य widget key।'
          : params.error === 'source'
            ? 'सार्वजनिक live data का लागि स्पष्ट स्रोत label अनिवार्य छ।'
            : params.error === 'shape'
              ? params.detail || 'JSON को संरचना यो widget सँग मिलेन।'
              : params.error === 'calendar-year'
                ? 'पात्रो sync का लागि बि.सं. वर्ष २०००–२०९९ बीच हुनुपर्छ।'
                : params.error === 'calendar-provider'
                  ? params.detail || 'पात्रो प्रदायकबाट sync हुन सकेन।'
              : null

  return (
    <div>
      <AdminPageHeader
        eyebrow="प्रकाशन डेटा"
        subtitle="API असफल हुँदा मात्र प्रयोग हुने प्रमाणित newsroom override। प्रत्येक update मा स्रोत र data shape दुवै जाँचिन्छ।"
      />

      {errorMessage ? (
        <AdminCallout tone="danger" className="mb-4">
          <p role="alert" lang="ne">
            {errorMessage}
          </p>
        </AdminCallout>
      ) : null}
      {params.saved ? (
        <AdminCallout tone="neutral" className="mb-4">
          <p role="status" lang="ne">
            {params.saved} सुरक्षित भयो। सार्वजनिक cache revalidate गरिएको छ।
          </p>
        </AdminCallout>
      ) : null}

      <AdminCard className="mb-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.55fr)] lg:items-end">
          <div>
            <p className="text-caption font-extrabold uppercase tracking-[0.12em] text-brand-strong" lang="en">
              Calendar provider
            </p>
            <h2 className="mt-1 font-display text-h2 font-extrabold text-ink" lang="ne">
              पात्रो स्वतः सिंक
            </h2>
            <p className="mt-2 max-w-body text-meta leading-relaxed text-ink-soft" lang="ne">
              पर्व र सार्वजनिक बिदा अब JSON हातैले लेख्नुपर्दैन। प्रदायकबाट वर्षको पात्रो तानिन्छ,
              प्रत्येक बि.सं. मिति server मा जाँचिन्छ र सफल sync मात्र सार्वजनिक cache मा सुरक्षित हुन्छ।
            </p>
            <dl className="mt-4 grid gap-2 border-y border-rule py-3 text-caption sm:grid-cols-3">
              <div>
                <dt className="font-bold text-mute" lang="ne">प्रदायक</dt>
                <dd className="mt-0.5 font-extrabold text-ink">{calendarProvider.source}</dd>
              </div>
              <div>
                <dt className="font-bold text-mute" lang="ne">स्थिति</dt>
                <dd className={`mt-0.5 font-extrabold ${calendarProvider.configured ? 'text-success' : 'text-breaking'}`} lang="ne">
                  {calendarProvider.configured ? 'कन्फिगर गरिएको' : 'API key/URL आवश्यक'}
                </dd>
              </div>
              <div>
                <dt className="font-bold text-mute" lang="ne">अन्तिम cache</dt>
                <dd className="mt-0.5 font-extrabold text-ink" lang="ne">
                  {calendarRecord && calendarData
                    ? `${calendarData.year} · ${calendarData.events.length} कार्यक्रम · ${formatDate(calendarRecord.updatedAt, 'ne')}`
                    : 'अहिलेसम्म sync छैन'}
                </dd>
              </div>
            </dl>
          </div>

          <form action={syncCalendar} className="border-y border-rule py-4">
            <AdminInput
              id="calendar-sync-year"
              label="बि.सं. वर्ष"
              name="year"
              type="number"
              min={2000}
              max={2099}
              defaultValue={calendarData?.year ?? todayBsInKathmandu().year}
              required
              hint={calendarProvider.detail}
            />
            <AdminButton type="submit" className="mt-3" disabled={!calendarProvider.configured}>
              प्रदायकबाट अहिले sync गर्नुहोस्
            </AdminButton>
          </form>
        </div>
      </AdminCard>

      <AdminCard className="mb-6">
        <h2 className="font-display text-h2 font-extrabold text-ink" lang="ne">
          म्यानुअल प्रकाशन
        </h2>
        <p className="mt-2 max-w-body text-meta leading-relaxed text-ink-soft" lang="ne">
          तलको उदाहरण स्वतः form मा भरिँदैन। वास्तविक स्रोतबाट जाँचिएको value मात्र JSON क्षेत्रमा
          राख्नुहोस्। पुरानो value लाई आजको भनेर पुनःप्रकाशित नगर्नुहोस्।
        </p>

        <div className="mt-5 divide-y divide-rule border-y border-rule">
          {MANUAL_KEYS.map((item) => {
            const current = manualByKey.get(item.key)
            return (
              <form
                key={item.key}
                action={saveManualLive}
                className="grid gap-4 py-5 xl:grid-cols-[13rem_minmax(0,1fr)]"
              >
                <input type="hidden" name="key" value={item.key} />
                <div>
                  <h3 className="font-display text-h3 font-extrabold text-ink" lang="en">
                    {item.label}
                  </h3>
                  <p className="mt-1 text-caption text-mute" lang="en">
                    {item.key}
                  </p>
                  <p className="mt-2 text-caption leading-relaxed text-ink-soft" lang="ne">
                    {item.purpose}
                  </p>
                  {current ? (
                    <p className="mt-3 text-caption font-bold text-success" lang="ne">
                      सक्रिय · {formatDate(current.updatedAt, 'ne')}
                    </p>
                  ) : (
                    <p className="mt-3 text-caption font-bold text-mute" lang="ne">
                      override छैन
                    </p>
                  )}
                </div>

                <div className="min-w-0">
                  <AdminInput
                    id={`live-source-${item.key}`}
                    label="स्रोत label"
                    name="source"
                    defaultValue={current?.source ?? ''}
                    required
                    hint="संस्था, फिड वा जिम्मेवार desk को नाम। generic ‘manual update’ स्वीकार हुँदैन।"
                  />
                  <AdminTextarea
                    id={`live-data-${item.key}`}
                    label="JSON data"
                    name="data"
                    defaultValue={current ? JSON.stringify(current.data, null, 2) : ''}
                    rows={8}
                    lang="en"
                    required
                  />
                  {!current ? (
                    <details className="mt-2 border-y border-rule py-2 text-caption text-ink-soft">
                      <summary className="cursor-pointer font-bold text-ink">
                        Structure reference
                      </summary>
                      <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all font-mono text-[0.72rem] leading-relaxed">
                        {item.example}
                      </pre>
                    </details>
                  ) : null}
                  <AdminButton type="submit" className="mt-3">
                    Save verified {item.label}
                  </AdminButton>
                </div>
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
              <th className="hidden md:table-cell" lang="ne">
                आवश्यक env
              </th>
              <th lang="ne">स्थिति</th>
              <th className="hidden lg:table-cell" lang="ne">
                स्रोत
              </th>
              <th className="hidden sm:table-cell" lang="ne">
                अन्तिम अपडेट
              </th>
              <th lang="ne">त्रुटि</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <tr key={provider.key}>
                <td className="align-top">
                  <p className="font-display font-semibold text-ink" lang="ne">
                    {provider.label}
                  </p>
                  <code className="font-mono text-caption text-mute" lang="en">
                    {provider.key}
                  </code>
                </td>
                <td className="hidden align-top md:table-cell">
                  {provider.envVars.length ? (
                    <ul className="flex flex-col gap-1">
                      {provider.envVars.map((variable) => (
                        <li key={variable}>
                          <code className="font-mono text-caption text-ink-soft" lang="en">
                            {variable}
                          </code>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-caption text-mute">No key required</span>
                  )}
                </td>
                <td className="align-top">
                  <span
                    className={`admin-status admin-status--${providerStatusTone(provider.status)}`}
                    lang="ne"
                  >
                    {statusLabel[provider.status] ?? provider.status}
                  </span>
                </td>
                <td className="hidden align-top text-meta text-ink-soft lg:table-cell" lang="en">
                  {provider.source}
                </td>
                <td className="hidden align-top text-caption text-mute sm:table-cell" lang="ne">
                  {provider.updatedAt ? formatDate(provider.updatedAt, 'ne') : '—'}
                </td>
                <td className="align-top text-caption text-breaking" lang="ne">
                  {provider.error ? (
                    <span className="line-clamp-2">{provider.error}</span>
                  ) : (
                    <span className="text-mute">—</span>
                  )}
                </td>
              </tr>
            ))}
            {providers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-body text-mute" lang="ne">
                  प्रदायक स्वास्थ्य पढ्न सकिएन।
                </td>
              </tr>
            ) : null}
          </tbody>
        </AdminTable>
      </AdminCard>
    </div>
  )
}
