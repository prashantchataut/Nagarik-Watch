import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireNewsroomSession } from '@/lib/auth/session'
import { AD_PLACEMENTS, getAdMode, isAdPlacementKey, isNetworkAdsReady } from '@/lib/ads'
import { getAdEventSummary } from '@/lib/ad-events'
import { listHouseAds, upsertHouseAd } from '@/lib/house-ads'
import { HouseAdEditor } from '@/components/admin/HouseAdEditor'
import { promoteHouseAdWinners } from '@/lib/ads/house-ad-promote'
import { deliveryCoverage, fillRateAnomaly } from '@/lib/ads/yield-local'
import {
  AdminPageHeader,
  AdminButton,
  AdminMetric,
  AdminTable,
} from '@/components/admin/primitives'

export const metadata: Metadata = {
  title: 'विज्ञापन',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

async function saveHouseAd(formData: FormData) {
  'use server'
  try {
    const session = await requireNewsroomSession()
    if (!['ad_manager', 'publisher', 'admin', 'super_admin'].includes(session.newsroomRole)) {
      redirect('/admin/ads?error=permission')
    }
    const placementKey = String(formData.get('placementKey') ?? '')
    if (!isAdPlacementKey(placementKey)) {
      redirect('/admin/ads?error=placement')
    }

    const title = String(formData.get('title') ?? '').trim()
    const body = String(formData.get('body') ?? '').trim()
    const cta = String(formData.get('cta') ?? '').trim()
    const href = String(formData.get('href') ?? '').trim()
    if (!title || !body || !cta || !isSafeCampaignHref(href)) {
      redirect('/admin/ads?error=creative')
    }

    const abEnabled = formData.get('abEnabled') === 'on'
    const challengerTitle = String(formData.get('challengerTitle') ?? '').trim()
    const challengerBody = String(formData.get('challengerBody') ?? '').trim()
    const challengerCta = String(formData.get('challengerCta') ?? '').trim()
    const challengerHref = String(formData.get('challengerHref') ?? '').trim()
    if (
      abEnabled &&
      (!challengerTitle || !challengerBody || !challengerCta || !isSafeCampaignHref(challengerHref))
    ) {
      redirect('/admin/ads?error=challenger')
    }

    await upsertHouseAd({
      placementKey,
      active: formData.get('active') === 'on',
      title,
      body,
      cta,
      href,
      imageUrl: String(formData.get('imageUrl') ?? '').trim() || undefined,
      titleEn: String(formData.get('titleEn') ?? '').trim() || undefined,
      bodyEn: String(formData.get('bodyEn') ?? '').trim() || undefined,
      ctaEn: String(formData.get('ctaEn') ?? '').trim() || undefined,
      abEnabled,
      challenger: abEnabled
        ? {
            title: challengerTitle,
            body: challengerBody,
            cta: challengerCta,
            href: challengerHref,
            imageUrl: String(formData.get('challengerImageUrl') ?? '').trim() || undefined,
            titleEn: String(formData.get('challengerTitleEn') ?? '').trim() || undefined,
            bodyEn: String(formData.get('challengerBodyEn') ?? '').trim() || undefined,
            ctaEn: String(formData.get('challengerCtaEn') ?? '').trim() || undefined,
          }
        : null,
    })
    revalidatePath('/admin/ads')
    redirect('/admin/ads?saved=1')
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error
    console.error('[admin/ads] save failed', error instanceof Error ? error.message : error)
    redirect('/admin/ads?error=save')
  }
}

function isSafeCampaignHref(value: string): boolean {
  if (!value) return false
  if (value.startsWith('/')) return !value.startsWith('//')
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

async function promoteHouseAdWinnersAction() {
  'use server'
  try {
    const session = await requireNewsroomSession()
    if (!['ad_manager', 'publisher', 'admin', 'super_admin'].includes(session.newsroomRole)) {
      redirect('/admin/ads?error=permission')
    }
    const result = await promoteHouseAdWinners()
    revalidatePath('/admin/ads')
    revalidatePath('/admin/experiments')
    redirect(
      result.promoted.length > 0
        ? `/admin/ads?promoted=${result.promoted.length}`
        : '/admin/ads?promoted=0',
    )
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error
    console.error('[admin/ads] promote failed', error instanceof Error ? error.message : error)
    redirect('/admin/ads?error=promote')
  }
}

export default async function AdsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string; promoted?: string }>
}) {
  await requireNewsroomSession()
  const params = await searchParams

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
      <AdminPageHeader subtitle="house ads, placement inventory, 30-day impression/click reporting" />

      {params.saved === '1' ? (
        <p
          role="status"
          className="mb-4 rounded-sm border border-up/30 bg-brand-tint/50 px-4 py-3 text-meta font-semibold text-brand-strong"
          lang="ne"
        >
          House ad सुरक्षित भयो। Active छ भने सार्वजनिक पृष्ठमा देखिन्छ।
        </p>
      ) : null}
      {params.promoted !== undefined ? (
        <p
          role="status"
          className="mb-4 rounded-sm border border-up/30 bg-brand-tint/50 px-4 py-3 text-meta font-semibold text-brand-strong"
          lang="ne"
        >
          {Number(params.promoted) > 0
            ? `${params.promoted} placement मा A/B विजेता प्रवर्द्धन भयो।`
            : 'अहिले प्रवर्द्धन गर्ने विजेता छैन (नमूना अपर्याप्त वा A/B बन्द)।'}
        </p>
      ) : null}
      {params.error ? (
        <p
          role="alert"
          className="mb-4 rounded-sm border border-breaking/30 bg-brand-tint px-4 py-3 text-meta font-semibold text-brand-strong"
          lang="ne"
        >
          {params.error === 'permission'
            ? 'यो भूमिकाबाट विज्ञापन सुरक्षित गर्न मिल्दैन।'
            : params.error === 'placement'
              ? 'Placement चयन गलत छ।'
              : params.error === 'promote'
                ? 'A/B विजेता प्रवर्द्धन गर्न सकिएन।'
                : params.error === 'creative'
                  ? 'शीर्षक, विवरण, CTA र सुरक्षित destination URL आवश्यक छन्।'
                  : params.error === 'challenger'
                    ? 'A/B चलाउँदा challenger को शीर्षक, विवरण, CTA र सुरक्षित URL आवश्यक छन्।'
                    : 'House ad सुरक्षित गर्न सकिएन। DATABASE_URL र ops schema जाँच गर्नुहोस्।'}
        </p>
      ) : null}
      <section className="ad-ops-overview">
        <div className="ad-ops-overview__status">
          <p className="text-body text-ink" lang="ne">
            हालको delivery mode:{' '}
            <code className="font-mono text-ink-soft" lang="en">
              {adMode}
            </code>
            । स्थिति:{' '}
            <span
              className={`admin-status ${adMode !== 'network' || networkReady ? 'admin-status--success' : 'admin-status--neutral'}`}
              lang="ne"
            >
              {adMode !== 'network' || networkReady
                ? 'delivery तयार'
                : 'delivery credential प्रतीक्षामा'}
            </span>
          </p>
          <p className="mt-2 text-meta text-ink-soft" lang="ne">
            Public pages reserved ad slots राख्छन्। House mode मा तलको creative सक्रिय भए
            reader-facing ad देखिन्छ। Network mode मा provider container जोडिन्छ।
          </p>
        </div>
        <div className="ad-ops-overview__metrics">
          <p className="admin-section-title" lang="en">30-day events</p>
          <div className="admin-metric-grid">
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
        </div>
      </section>

      <section className={`ad-coverage ${coverageAnomaly.anomalous ? 'is-anomalous' : ''}`}>
        <p className="text-meta font-bold text-brand-strong" lang="ne">
          वितरण कभरेज
        </p>
        <p className="mt-1 text-body text-ink" lang="en">
          {deliveringPlacements}/{placements.length} slots have an active house ad or ready network
          delivery ({(coverage * 100).toFixed(0)}%).
        </p>
        {coverageAnomaly.anomalous ? (
          <p className="mt-1 text-meta font-semibold text-red-700" lang="en">
            Coverage is {(coverageAnomaly.drop * 100).toFixed(0)} points below the fully-wired
            baseline. Configure more house ads or a network.
          </p>
        ) : (
          <p className="mt-1 text-meta text-ink-soft" lang="en">
            Local check only. No vendor fill/eCPM data is reported here.
          </p>
        )}
      </section>

      <section className="admin-data-surface mb-6 p-4 sm:p-5">
        <h2 className="font-display text-h2 text-ink" lang="ne">
          House ad creative
        </h2>
        <p className="mt-2 max-w-body text-meta text-ink-soft" lang="ne">
          Payment/ad-network नजोडिए पनि सार्वजनिक पृष्ठमा खाली ad shell राखिँदैन। House ad राखेर
          sponsorship, membership वा media-kit CTA चलाउनुहोस्।
        </p>
        <HouseAdEditor
          placements={placements.map((placement) => ({
            key: placement.key,
            label: placement.label,
            width: placement.width,
            height: placement.height,
            position: placement.position,
          }))}
          houseAds={houseAds}
          action={saveHouseAd}
        />
        <form action={promoteHouseAdWinnersAction} className="mt-3">
          <AdminButton type="submit" variant="secondary">
            Promote A/B winners now
          </AdminButton>
          <p className="mt-2 text-caption text-mute" lang="en">
            Collapses placements with a Bayesian winner to the winning creative and turns A/B off.
            Also runs every 6 hours via cron.
          </p>
        </form>
      </section>

      <div className="grid gap-5">
        {Object.entries(grouped).map(([surface, items]) => (
          <section
            key={surface}
            className="overflow-hidden rounded-sm border border-rule bg-surface-raised"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule bg-surface px-4 py-3">
              <h2 className="font-display text-h2 text-ink" lang="en">
                {surface}
              </h2>
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
                        <td className="align-top font-semibold text-ink" lang="en">
                          {p.label}
                        </td>
                        <td className="align-top">
                          <code
                            className="rounded bg-surface px-1.5 py-0.5 font-mono text-caption text-ink-soft"
                            lang="en"
                          >
                            {p.key}
                          </code>
                        </td>
                        <td className="align-top text-meta text-ink-soft" lang="en">
                          {p.width}×{p.height}
                        </td>
                        <td className="align-top text-meta text-ink-soft">
                          {house ? (
                            <span
                              className={
                                house.active ? 'font-semibold text-brand-strong' : 'text-mute'
                              }
                            >
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
