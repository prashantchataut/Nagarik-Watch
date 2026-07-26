import type { Metadata } from 'next'
import { revalidatePath } from 'next/cache'
import { requireNewsroomSession } from '@/lib/auth/session'
import { AD_PLACEMENTS, getAdMode, isAdPlacementKey, isNetworkAdsReady } from '@/lib/ads'
import { getAdEventSummary } from '@/lib/ad-events'
import { listHouseAds, upsertHouseAd } from '@/lib/house-ads'
import { deliveryCoverage, fillRateAnomaly } from '@/lib/ads/yield-local'
import { AdminPageHeader, AdminCard, AdminButton, AdminInput, AdminSelect, AdminMetric, AdminTable } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'विज्ञापन',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-static'

async function saveHouseAd(formData: FormData) {
  'use server'
  const session = await requireNewsroomSession()
  if (!['ad_manager', 'publisher', 'admin', 'super_admin'].includes(session.newsroomRole)) return
  const placementKey = String(formData.get('placementKey') ?? '')
  if (!isAdPlacementKey(placementKey)) return
  await upsertHouseAd({
    placementKey,
    active: formData.get('active') === 'on',
    title: String(formData.get('title') ?? '').trim() || 'Nagarik Watch partnership',
    body: String(formData.get('body') ?? '').trim() || 'Clearly labelled house campaign.',
    cta: String(formData.get('cta') ?? '').trim() || 'Learn more',
    href: String(formData.get('href') ?? '').trim() || '/advertise',
    imageUrl: String(formData.get('imageUrl') ?? '').trim() || undefined,
  })
  revalidatePath('/admin/ads')
}

export default async function AdsPage() {
  await requireNewsroomSession()

  const adMode = getAdMode()
  const networkReady = isNetworkAdsReady()
  const placements = Object.values(AD_PLACEMENTS)
  const grouped = placements.reduce<Record<string, typeof placements>>((acc, placement) => {
    acc[placement.surface] = [...(acc[placement.surface] ?? []), placement]
    return acc
  }, {})
  const summaries = await getAdEventSummary().catch(() => [])
  const summaryByPlacement = new Map(summaries.map((summary) => [summary.placementKey, summary]))
  const houseAds = await listHouseAds().catch(() => [])
  const houseByPlacement = new Map(houseAds.map((ad) => [ad.placementKey, ad]))
  const deliveringPlacements = placements.filter(
    (p) => houseByPlacement.get(p.key)?.active || (adMode === 'network' && networkReady),
  ).length
  const coverage = deliveryCoverage(deliveringPlacements, placements.length)
  const coverageAnomaly = fillRateAnomaly(coverage, 1, 0.2)

  return (
    <div>
      <AdminPageHeader
        subtitle="house ads, placement inventory, 30-day impression/click reporting"
      />

      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_0.7fr]">
        <AdminCard>
          <p className="text-body text-ink" lang="ne">
            हालको delivery mode:{' '}
            <code className="font-mono text-ink-soft" lang="en">{adMode}</code>। स्थिति:{' '}
            <span
              className={`admin-status ${adMode !== 'network' || networkReady ? 'admin-status--success' : 'admin-status--neutral'}`}
              lang="ne"
            >
              {adMode !== 'network' || networkReady ? 'delivery तयार' : 'delivery credential प्रतीक्षामा'}
            </span>
          </p>
          <p className="mt-2 text-meta text-ink-soft" lang="ne">
            Public pages reserved ad slots राख्छन्। House mode मा तलको creative सक्रिय भए reader-facing ad देखिन्छ। Network mode मा provider container जोडिन्छ।
          </p>
        </AdminCard>
        <AdminCard>
          <p className="admin-section-title" lang="en">30-day events</p>
          <div className="admin-metric-grid mt-3">
            <AdminMetric
              value={summaries.reduce((sum, item) => sum + item.impressions, 0)}
              label="Impressions"
            />
            <AdminMetric
              value={summaries.reduce((sum, item) => sum + item.clicks, 0)}
              label="Clicks"
            />
            <AdminMetric value={formatCtr(summaries)} label="CTR" />
          </div>
        </AdminCard>
      </div>

      <AdminCard className={`mb-5 ${coverageAnomaly.anomalous ? 'admin-callout admin-callout--danger' : ''}`}>
        <p className="text-meta font-bold uppercase tracking-wide text-brand-strong" lang="en">
          Delivery coverage
        </p>
        <p className="mt-1 text-body text-ink" lang="en">
          {deliveringPlacements}/{placements.length} slots have an active house ad or ready network delivery ({(coverage * 100).toFixed(0)}%).
        </p>
        {coverageAnomaly.anomalous ? (
          <p className="mt-1 text-meta font-semibold text-red-700" lang="en">
            Coverage is {(coverageAnomaly.drop * 100).toFixed(0)} points below the fully-wired baseline — configure more house ads or a network.
          </p>
        ) : (
          <p className="mt-1 text-meta text-ink-soft" lang="en">
            Local check only — no vendor fill/eCPM data is reported here.
          </p>
        )}
      </AdminCard>

      <AdminCard className="mb-6">
        <h2 className="font-display text-h2 text-ink" lang="ne">House ad creative</h2>
        <p className="mt-2 max-w-body text-meta text-ink-soft" lang="ne">
          Payment/ad-network नजोडिए पनि खाली placeholder देखाउने होइन। House ad राखेर sponsorship, membership वा media-kit CTA चलाउनुहोस्।
        </p>
        <form action={saveHouseAd} className="mt-4 grid gap-3 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <AdminSelect
              label="Placement"
              name="placementKey"
              lang="en"
              options={placements.map((placement) => ({ value: placement.key, label: placement.key }))}
            />
          </div>
          <div className="lg:col-span-2">
            <AdminInput label="Title" name="title" lang="en" />
          </div>
          <AdminInput label="CTA" name="cta" lang="en" />
          <label className="flex items-center gap-2 pt-6 text-meta font-semibold text-ink-soft">
            <input name="active" type="checkbox" className="size-4 accent-brand" /> Active
          </label>
          <div className="lg:col-span-3">
            <AdminInput label="Body" name="body" lang="en" />
          </div>
          <div className="lg:col-span-2">
            <AdminInput label="Link" name="href" placeholder="/advertise" lang="en" />
          </div>
          <AdminInput label="Image URL" name="imageUrl" lang="en" />
          <div className="lg:col-span-6">
            <AdminButton type="submit">Save house ad</AdminButton>
          </div>
        </form>
      </AdminCard>

      <div className="grid gap-5">
        {Object.entries(grouped).map(([surface, items]) => (
          <section key={surface} className="overflow-hidden rounded-lg border border-rule bg-surface-raised">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule bg-surface px-4 py-3">
              <h2 className="font-display text-h2 text-ink" lang="en">{surface}</h2>
              <span className="admin-status admin-status--neutral" lang="en">
                {items.length} slot{items.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <AdminTable>
                <thead>
                  <tr>
                    <th lang="ne">लेबल</th>
                    <th lang="ne">Key</th>
                    <th lang="ne">साइज</th>
                    <th lang="ne">House ad</th>
                    <th lang="ne">३०-दिन</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => {
                    const house = houseByPlacement.get(p.key)
                    const summary = summaryByPlacement.get(p.key)
                    return (
                      <tr key={p.key}>
                        <td className="align-top font-semibold text-ink" lang="en">{p.label}</td>
                        <td className="align-top">
                          <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-caption text-ink-soft" lang="en">{p.key}</code>
                        </td>
                        <td className="align-top text-meta text-ink-soft" lang="en">{p.width}×{p.height}</td>
                        <td className="align-top text-meta text-ink-soft">
                          {house ? (
                            <span className={house.active ? 'font-semibold text-brand-strong' : 'text-mute'}>
                              {house.active ? 'Active' : 'Saved/off'} · {house.title}
                            </span>
                          ) : (
                            <span className="text-mute">Not configured</span>
                          )}
                        </td>
                        <td className="align-top text-meta text-ink-soft" lang="en">
                          {summary
                            ? `${summary.impressions} imp · ${summary.clicks} click · ${(summary.ctr * 100).toFixed(1)}% · attn ${(summary.averageAttention * 100).toFixed(0)}%`
                            : '0 imp'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </AdminTable>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function formatCtr(items: Awaited<ReturnType<typeof getAdEventSummary>>): string {
  const impressions = items.reduce((sum, item) => sum + item.impressions, 0)
  const clicks = items.reduce((sum, item) => sum + item.clicks, 0)
  return impressions ? `${((clicks / impressions) * 100).toFixed(1)}%` : '0%'
}
