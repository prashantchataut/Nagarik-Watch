import type { Metadata } from 'next'
import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { asLocale, localePrefix, localizeHref } from '@/lib/i18n/locales'
import { getRealNepse, getRealForex, getRealGoldSilver } from '@/lib/live/real'
import { localizeNumber, relativeTime } from '@/lib/live/format'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { HubIndexHeader } from '@/components/HubIndexHeader'

export const revalidate = 300

const MARKET_LINKS = [
  { href: '/market', ne: 'बजार बोर्ड', en: 'Market board' },
  { href: '/utilities/currency', ne: 'मुद्रा रूपान्तरण', en: 'Currency converter' },
  { href: '/patro', ne: 'पात्रो', en: 'Calendar' },
] as const

export default async function MarketPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const dict = getDictionary(locale)
  const lang = locale === 'en' ? 'en' : 'ne'
  const en = locale === 'en'

  const [nepse, forex, goldSilver] = await Promise.all([
    getRealNepse(locale),
    getRealForex(locale),
    getRealGoldSilver(locale),
  ])

  const nepseUp = Boolean(nepse.data && nepse.data.change >= 0)

  return (
    <div className="mx-auto max-w-page px-4 py-5 sm:py-7" lang={lang}>
      <HubIndexHeader
        title={en ? 'Market and shares' : 'बजार र सेयर'}
        lead={
          en
            ? 'A compact board for NEPSE, official forex and verified bullion rates. Each panel shows its source and freshness.'
            : 'NEPSE, आधिकारिक विदेशी मुद्रा र प्रमाणित सुनचाँदी दरको संक्षिप्त बोर्ड। हरेक प्यानलमा स्रोत र ताजापन देखिन्छ।'
        }
        lang={lang}
      />

      <nav className="market-tools" aria-label={en ? 'Market tools' : 'बजार उपकरण'}>
        {MARKET_LINKS.map((item) => (
          <Link key={item.href} href={localizeHref(locale, item.href)}>
            {en ? item.en : item.ne}
          </Link>
        ))}
      </nav>

      <section className="market-board" aria-label={en ? 'Market board' : 'बजार बोर्ड'}>
        <div className="market-board__lead">
          <div className="market-board__lead-head">
            <p className="market-board__label">{dict.nepseTitle}</p>
            <span>{sourceFor(nepse.source, locale)}</span>
          </div>
          {nepse.data ? (
            <div className="market-board__index-row">
              <p className="market-board__value">
                {localizeNumber(nepse.data.index.toFixed(2), locale)}
              </p>
              <p className={nepseUp ? 'market-board__change is-up' : 'market-board__change is-down'}>
                <span aria-hidden="true">{nepseUp ? '▲' : '▼'}</span>{' '}
                {localizeNumber(Math.abs(nepse.data.change).toFixed(2), locale)} (
                {localizeNumber(Math.abs(nepse.data.changePercent).toFixed(2), locale)}%)
              </p>
            </div>
          ) : (
            <p className="market-board__empty">
              {en ? 'Index feed unavailable.' : 'सूचकाङ्क फिड उपलब्ध छैन।'}
            </p>
          )}
          <p className="market-board__meta">{relativeTime(nepse.updatedAt, locale)}</p>
        </div>

        <div className="market-board__rail">
          <MarketRate
            label={en ? 'Gold / tola' : 'सुन / तोला'}
            value={
              goldSilver.data
                ? `${en ? 'NPR' : 'रु.'} ${localizeNumber(goldSilver.data.goldTolaNpr.toLocaleString(), locale)}`
                : null
            }
            unavailable={en ? 'Unavailable' : 'उपलब्ध छैन'}
          />
          <MarketRate
            label={en ? 'Silver / tola' : 'चाँदी / तोला'}
            value={
              goldSilver.data
                ? `${en ? 'NPR' : 'रु.'} ${localizeNumber(goldSilver.data.silverTolaNpr.toLocaleString(), locale)}`
                : null
            }
            unavailable={en ? 'Unavailable' : 'उपलब्ध छैन'}
          />
          <p className="market-board__meta market-board__meta--span">
            {sourceFor(goldSilver.source, locale)} · {relativeTime(goldSilver.updatedAt, locale)}
          </p>
        </div>
      </section>

      <section className="market-forex" aria-labelledby="forex-title">
        <div className="market-forex__head">
          <div>
            <p className="market-forex__kicker">{sourceFor(forex.source, locale)}</p>
            <h2 id="forex-title">{en ? 'Foreign exchange' : 'विदेशी मुद्रा'}</h2>
          </div>
          <p className="market-forex__meta">{relativeTime(forex.updatedAt, locale)}</p>
        </div>
        {forex.data && forex.data.length > 0 ? (
          <div className="market-forex__table-wrap">
            <table>
              <caption className="sr-only">
                {en ? 'Official foreign exchange buy and sell rates' : 'आधिकारिक विदेशी मुद्रा खरिद र बिक्री दर'}
              </caption>
              <thead>
                <tr>
                  <th>{en ? 'Currency' : 'मुद्रा'}</th>
                  <th>{en ? 'Buy' : 'खरिद'}</th>
                  <th>{en ? 'Sell' : 'बिक्री'}</th>
                  <th>{en ? 'Unit' : 'एकाइ'}</th>
                </tr>
              </thead>
              <tbody>
                {forex.data.map((rate) => (
                  <tr key={rate.iso3}>
                    <td>
                      <strong lang="en">{rate.iso3}</strong>
                      <span lang="en">{rate.name}</span>
                    </td>
                    <td className="tabular-nums">{localizeNumber(rate.buy.toFixed(2), locale)}</td>
                    <td className="tabular-nums">{localizeNumber(rate.sell.toFixed(2), locale)}</td>
                    <td lang="en">{rate.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="market-forex__empty">
            {en
              ? 'The official foreign exchange feed is not available right now.'
              : 'आधिकारिक विदेशी मुद्रा फिड अहिले उपलब्ध छैन।'}
          </p>
        )}
      </section>
    </div>
  )
}

function MarketRate({
  label,
  value,
  unavailable,
}: {
  label: string
  value: string | null
  unavailable: string
}) {
  return (
    <div className="market-rate">
      <p className="market-board__label">{label}</p>
      {value ? (
        <p className="market-board__value market-board__value--sm">{value}</p>
      ) : (
        <p className="market-board__empty">{unavailable}</p>
      )}
    </div>
  )
}

function sourceFor(source: string, locale: Locale): string {
  const cleaned = source.trim()
  if (cleaned) return cleaned
  return locale === 'en' ? 'Source unavailable' : 'स्रोत उपलब्ध छैन'
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const prefix = localePrefix(locale)
  return {
    title: locale === 'en' ? 'Market' : 'बजार',
    alternates: { canonical: `${prefix}/market`, languages: { ne: '/market', en: '/en/market' } },
  }
}
