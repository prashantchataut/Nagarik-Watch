import type { Metadata } from 'next'
import { revalidatePath } from 'next/cache'
import { requireNewsroomSession } from '@/lib/auth/session'
import { AD_PLACEMENTS, getAdMode, isAdPlacementKey, isNetworkAdsReady } from '@/lib/ads'
import { getAdEventSummary } from '@/lib/ad-events'
import { listHouseAds, upsertHouseAd } from '@/lib/house-ads'
import { AdminPageHeader, AdminCard } from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'विज्ञापन',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

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

  return (
    <div>
      <AdminPageHeader
        title="विज्ञापन"
        subtitle="house ads, placement inventory, 30-day impression/click reporting"
      />

      <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_0.7fr]">
        <AdminCard className="border-l-4 border-l-brand">
          <p className="text-body text-ink" lang="ne">
            हालको delivery mode:{' '}
            <code className="font-mono text-ink-soft" lang="en">{adMode}</code>। स्थिति:{' '}
            <span
              className={`rounded-full px-2 py-0.5 text-caption font-semibold ${
                adMode !== 'network' || networkReady
                  ? 'bg-brand-tint text-brand-strong'
                  : 'border border-rule text-mute'
              }`}
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
          <p className="text-meta font-bold uppercase tracking-wide text-brand-strong" lang="en">
            30-day events
          </p>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-display text-h1 text-ink" lang="en">
                {summaries.reduce((sum, item) => sum + item.impressions, 0)}
              </p>
              <p className="text-caption text-mute">Impressions</p>
            </div>
            <div>
              <p className="font-display text-h1 text-ink" lang="en">
                {summaries.reduce((sum, item) => sum + item.clicks, 0)}
              </p>
              <p className="text-caption text-mute">Clicks</p>
            </div>
            <div>
              <p className="font-display text-h1 text-ink" lang="en">
                {formatCtr(summaries)}
              </p>
              <p className="text-caption text-mute">CTR</p>
            </div>
          </div>
        </AdminCard>
      </div>

      <section className="mb-6 rounded-lg border border-rule bg-surface-raised p-5">
        <h2 className="font-display text-h1 text-ink" lang="ne">House ad creative</h2>
        <p className="mt-2 max-w-body text-meta text-ink-soft" lang="ne">
          Payment/ad-network नजोडिए पनि खाली placeholder देखाउने होइन। House ad राखेर sponsorship, membership वा media-kit CTA चलाउनुहोस्।
        </p>
        <form action={saveHouseAd} className="mt-4 grid gap-3 lg:grid-cols-6">
          <label className="grid gap-1 text-caption font-semibold text-ink-soft lg:col-span-2">
            Placement
            <select name="placementKey" className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink">
              {placements.map((placement) => (
                <option key={placement.key} value={placement.key}>{placement.key}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-caption font-semibold text-ink-soft lg:col-span-2">
            Title
            <input name="title" className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" />
          </label>
          <label className="grid gap-1 text-caption font-semibold text-ink-soft">
            CTA
            <input name="cta" className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" />
          </label>
          <label className="flex items-center gap-2 pt-6 text-meta font-semibold text-ink-soft">
            <input name="active" type="checkbox" /> Active
          </label>
          <label className="grid gap-1 text-caption font-semibold text-ink-soft lg:col-span-3">
            Body
            <input name="body" className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" />
          </label>
          <label className="grid gap-1 text-caption font-semibold text-ink-soft lg:col-span-2">
            Link
            <input name="href" placeholder="/advertise" className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" />
          </label>
          <label className="grid gap-1 text-caption font-semibold text-ink-soft">
            Image URL
            <input name="imageUrl" className="h-10 rounded-md border border-rule bg-surface px-3 text-body text-ink" />
          </label>
          <button className="h-10 rounded-full bg-brand px-5 text-meta font-semibold text-surface hover:bg-brand-strong lg:col-span-6" type="submit">
            Save house ad
          </button>
        </form>
      </section>

      <div className="grid gap-5">
        {Object.entries(grouped).map(([surface, items]) => (
          <section key={surface} className="overflow-hidden rounded-lg border border-rule bg-surface-raised">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule bg-surface px-4 py-3">
              <h2 className="font-display text-h2 text-ink" lang="en">{surface}</h2>
              <span className="rounded-full border border-rule px-2.5 py-1 text-caption font-semibold text-ink-soft" lang="en">
                {items.length} slot{items.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-rule text-left">
                <thead className="bg-surface text-caption uppercase tracking-wide text-mute">
                  <tr>
                    <th className="px-4 py-3 font-semibold" lang="ne">लेबल</th>
                    <th className="px-4 py-3 font-semibold" lang="ne">Key</th>
                    <th className="px-4 py-3 font-semibold" lang="ne">साइज</th>
                    <th className="px-4 py-3 font-semibold" lang="ne">House ad</th>
                    <th className="px-4 py-3 font-semibold" lang="ne">३०-दिन</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {items.map((p) => {
                    const house = houseByPlacement.get(p.key)
                    const summary = summaryByPlacement.get(p.key)
                    return (
                      <tr key={p.key} className="hover:bg-brand-tint/30">
                        <td className="px-4 py-3 align-top font-display font-semibold text-ink" lang="en">{p.label}</td>
                        <td className="px-4 py-3 align-top">
                          <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-caption text-ink-soft" lang="en">{p.key}</code>
                        </td>
                        <td className="px-4 py-3 align-top text-meta text-ink-soft" lang="en">{p.width}×{p.height}</td>
                        <td className="px-4 py-3 align-top text-meta text-ink-soft">
                          {house ? (
                            <span className={house.active ? 'font-semibold text-brand-strong' : 'text-mute'}>
                              {house.active ? 'Active' : 'Saved/off'} · {house.title}
                            </span>
                          ) : (
                            <span className="text-mute">Not configured</span>
                          )}
                        </td>
                        <td className="px-4 py-3 align-top text-meta text-ink-soft" lang="en">
                          {summary ? `${summary.impressions} imp · ${summary.clicks} click · ${(summary.ctr * 100).toFixed(1)}%` : '0 imp'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
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
