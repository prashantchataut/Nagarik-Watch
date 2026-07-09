import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { getRealNepse, getRealForex, getRealGoldSilver } from '@/lib/live/real'
import { asLocale } from '@/lib/i18n/locales'

export const metadata: Metadata = {
  title: 'NEPSE and markets',
  description: 'Nepal market summary, forex and bullion data with newsroom manual override support.',
}

export const dynamic = 'force-dynamic'

export default async function NepsePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const ne = locale === 'ne'
  const [nepse, forex, bullion] = await Promise.all([
    getRealNepse(locale),
    getRealForex(locale),
    getRealGoldSilver(locale),
  ])
  return (
    <main className="mx-auto max-w-page px-4 py-10">
      <section className="rounded-2xl border border-rule bg-surface-raised p-6 shadow-card">
        <p className="text-caption font-bold uppercase tracking-[0.18em] text-brand-strong" lang="en">Market desk</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,7vw,3.2rem)] font-extrabold text-ink" lang={ne ? 'ne' : 'en'}>
          {ne ? 'NEPSE, विदेशी मुद्रा र bullion' : 'NEPSE, forex and bullion'}
        </h1>
        <p className="mt-3 max-w-body text-body text-ink-soft" lang={ne ? 'ne' : 'en'}>
          {ne ? 'Market data provider fail भए admin live-widget बाट manual override चल्छ।' : 'If a market provider fails, the newsroom can use the live-widget manual override.'}
        </p>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <section className="rounded-2xl border border-rule bg-surface-raised p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-h1 text-ink" lang="en">NEPSE</h2>
            {nepse.data ? (
              <span className={`rounded-full px-2.5 py-1 text-caption font-semibold ${nepse.data.open ? 'bg-brand-tint text-brand-strong' : 'border border-rule text-mute'}`}>
                {nepse.data.open ? (ne ? 'बजार खुला' : 'Market open') : (ne ? 'बजार बन्द' : 'Market closed')}
              </span>
            ) : null}
          </div>
          {nepse.data ? (
            <>
              <p className="mt-4 font-display text-[3rem] font-extrabold text-ink" lang="en">{nepse.data.index.toFixed(2)}</p>
              <p className={`text-h2 font-bold ${nepse.data.change >= 0 ? 'text-brand-strong' : 'text-breaking'}`} lang="en">
                {nepse.data.change >= 0 ? '+' : ''}{nepse.data.change.toFixed(2)} ({nepse.data.changePercent.toFixed(2)}%)
              </p>
            </>
          ) : (
            <p className="mt-4 text-body text-mute" lang={ne ? 'ne' : 'en'}>{ne ? 'NEPSE डाटा उपलब्ध छैन।' : 'NEPSE data unavailable.'}</p>
          )}
          <p className="mt-3 text-caption text-mute" lang="en">{nepse.source} · {new Date(nepse.updatedAt).toLocaleString()}</p>
        </section>

        <section className="rounded-2xl border border-rule bg-surface-raised p-6">
          <h2 className="font-display text-h1 text-ink" lang="en">Gold / Silver</h2>
          {bullion.data ? (
            <dl className="mt-4 grid gap-3">
              <Metric label="Gold / tola" value={`NPR ${bullion.data.goldTolaNpr.toLocaleString()}`} />
              <Metric label="Silver / tola" value={`NPR ${bullion.data.silverTolaNpr.toLocaleString()}`} />
              <Metric label="Unit" value={bullion.data.unit} />
            </dl>
          ) : (
            <p className="mt-4 text-body text-mute" lang={ne ? 'ne' : 'en'}>{ne ? 'Bullion डाटा उपलब्ध छैन।' : 'Bullion data unavailable.'}</p>
          )}
          <p className="mt-3 text-caption text-mute" lang="en">{bullion.source} · {new Date(bullion.updatedAt).toLocaleString()}</p>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-rule bg-surface-raised p-6">
        <h2 className="font-display text-h1 text-ink" lang="en">Forex</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-rule text-left">
            <thead className="text-caption uppercase tracking-wide text-mute">
              <tr><th className="py-2 pr-4">Currency</th><th className="py-2 pr-4">Buy</th><th className="py-2 pr-4">Sell</th><th className="py-2 pr-4">Unit</th></tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {forex.data && forex.data.length ? forex.data.map((rate) => (
                <tr key={rate.iso3}>
                  <td className="py-2 pr-4 font-semibold text-ink">{rate.iso3} <span className="font-normal text-mute">{rate.name}</span></td>
                  <td className="py-2 pr-4 text-ink-soft">{rate.buy.toFixed(2)}</td>
                  <td className="py-2 pr-4 text-ink-soft">{rate.sell.toFixed(2)}</td>
                  <td className="py-2 pr-4 text-mute">{rate.unit}</td>
                </tr>
              )) : <tr><td colSpan={4} className="py-4 text-mute">{ne ? 'Forex data उपलब्ध छैन।' : 'Forex data unavailable.'}</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-caption text-mute" lang="en">{forex.source} · {new Date(forex.updatedAt).toLocaleString()}</p>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-rule bg-surface px-4 py-3">
      <dt className="text-meta text-ink-soft" lang="en">{label}</dt>
      <dd className="font-display text-h2 font-bold text-ink" lang="en">{value}</dd>
    </div>
  )
}
