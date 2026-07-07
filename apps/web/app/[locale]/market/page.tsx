import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { asLocale, localePrefix } from '@/lib/i18n/locales'
import { getRealNepse, getRealForex, getRealGoldSilver } from '@/lib/live/real'
import { localizeNumber, relativeTime } from '@/lib/live/format'
import { LiveWidget } from '@nagarikwatch/ui'
import { getDictionary } from '@/lib/i18n/dictionaries'

export const revalidate = 300

export default async function MarketPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const dict = getDictionary(locale)
  const lang = locale === 'en' ? 'en' : 'ne'
  const en = locale === 'en'
  const showMock = true
  const labels = { mock: dict.liveMock, sourcePrefix: dict.liveSourcePrefix, loading: dict.liveLoading, error: dict.liveError, empty: dict.liveEmpty, retry: dict.liveRetry }

  const [nepse, forex, goldSilver] = await Promise.all([getRealNepse(locale), getRealForex(locale), getRealGoldSilver(locale)])

  return (
    <div className="mx-auto max-w-page px-4 py-6 sm:py-8">
      <header className="border-b border-rule pb-6">
        <p className="text-meta font-semibold uppercase tracking-wide text-brand-strong" lang={lang}>{en ? 'Market' : 'बजार'}</p>
        <h1 className="mt-1 font-display text-h1 text-ink sm:text-display" lang={lang}>{en ? 'Market and Shares' : 'बजार र सेयर'}</h1>
        <p className="mt-2 max-w-body text-body text-ink-soft" lang={lang}>{en ? 'Live NEPSE index, forex rates, and gold/silver prices.' : 'लाइभ NEPSE सूचकांक, विदेशी मुद्रा दर, र सुनचाँदी मूल्य।'}</p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* NEPSE */}
        <LiveWidget title={dict.nepseTitle} titleLang="en" status={nepse.status} source={sourceFor(nepse.source, locale)} updatedLabel={relativeTime(nepse.updatedAt, locale)} mock={showMock && nepse.mock} labels={labels} tone={nepse.data && nepse.data.change >= 0 ? 'up' : 'down'}>
          {!nepse.mock && nepse.data ? (
            <div>
              <p className="font-display text-h1 font-bold text-ink">{localizeNumber(nepse.data.index.toFixed(2), locale)}</p>
              <p className={nepse.data.change >= 0 ? 'text-meta font-semibold text-up' : 'text-meta font-semibold text-down'}>
                <span aria-hidden="true">{nepse.data.change >= 0 ? '▲' : '▼'}</span> {Math.abs(nepse.data.change).toFixed(2)} ({Math.abs(nepse.data.changePercent).toFixed(2)}%)
              </p>
            </div>
          ) : null}
        </LiveWidget>

        {/* Gold */}
        <LiveWidget title={en ? 'Gold' : 'सुन'} titleLang={lang} status={goldSilver.status} source={sourceFor(goldSilver.source, locale)} updatedLabel={relativeTime(goldSilver.updatedAt, locale)} mock={showMock && goldSilver.mock} labels={labels}>
          {!goldSilver.mock && goldSilver.data ? (
            <div>
              <p className="font-display text-h1 font-bold text-ink">रु. {localizeNumber(goldSilver.data.goldTolaNpr.toLocaleString(), locale)}</p>
              <p className="text-meta text-mute" lang={lang}>{en ? 'per tola (11.664g)' : 'प्रति तोला'}</p>
            </div>
          ) : null}
        </LiveWidget>

        {/* Silver */}
        <LiveWidget title={en ? 'Silver' : 'चाँदी'} titleLang={lang} status={goldSilver.status} source={sourceFor(goldSilver.source, locale)} updatedLabel={relativeTime(goldSilver.updatedAt, locale)} mock={showMock && goldSilver.mock} labels={labels}>
          {!goldSilver.mock && goldSilver.data ? (
            <div>
              <p className="font-display text-h1 font-bold text-ink">रु. {localizeNumber(goldSilver.data.silverTolaNpr.toLocaleString(), locale)}</p>
              <p className="text-meta text-mute" lang={lang}>{en ? 'per tola' : 'प्रति तोला'}</p>
            </div>
          ) : null}
        </LiveWidget>
      </div>

      {/* Forex table */}
      <section className="mt-8 rounded-lg border border-rule bg-surface-raised p-5">
        <h2 className="font-display text-h2 text-ink" lang={lang}>{en ? 'Forex Rates (NRB)' : 'विदेशी मुद्रा दर (नराे)'}</h2>
        <p className="mt-1 text-caption text-mute" lang={lang}>{sourceFor(forex.source, locale)} · {forex.mock ? (en ? 'Awaiting verified feed' : 'प्रमाणित फिड प्रतीक्षामा') : relativeTime(forex.updatedAt, locale)}</p>
        {!forex.mock && forex.data && forex.data.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-rule text-left text-body">
              <thead className="text-caption uppercase tracking-wide text-mute">
                <tr>
                  <th className="py-2 pr-4" lang={lang}>{en ? 'Currency' : 'मुद्रा'}</th>
                  <th className="py-2 pr-4" lang={lang}>{en ? 'Buy' : 'खरिद'}</th>
                  <th className="py-2 pr-4" lang={lang}>{en ? 'Sell' : 'बिक्री'}</th>
                  <th className="py-2 pr-4" lang={lang}>{en ? 'Unit' : 'एकाइ'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {forex.data.map((r) => (
                  <tr key={r.iso3}>
                    <td className="py-2.5 pr-4 font-semibold text-ink" lang="en">{r.iso3} — {r.name}</td>
                    <td className="py-2.5 pr-4 tabular-nums text-ink">{localizeNumber(r.buy.toFixed(2), locale)}</td>
                    <td className="py-2.5 pr-4 tabular-nums text-ink">{localizeNumber(r.sell.toFixed(2), locale)}</td>
                    <td className="py-2.5 pr-4 text-meta text-mute" lang="en">{r.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-body text-ink-soft" lang={lang}>{en ? 'Official forex feed is not available right now.' : 'आधिकारिक विदेशी मुद्रा फिड अहिले उपलब्ध छैन।'}</p>
        )}
      </section>
    </div>
  )
}


function sourceFor(source: string, locale: Locale): string {
  if (/mock/i.test(source)) return locale === 'en' ? 'Verified feed pending' : 'प्रमाणित फिड प्रतीक्षामा'
  return source
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const prefix = localePrefix(locale)
  return {
    title: locale === 'en' ? 'Market' : 'बजार',
    alternates: { canonical: `${prefix}/market`, languages: { ne: '/market', en: '/en/market' } },
  }
}
