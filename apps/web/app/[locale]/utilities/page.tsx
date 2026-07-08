import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { UtilityTools } from '@/components/utilities/UtilityTools'
import { NepaliCalendar } from '@/components/utilities/NepaliCalendar'
import {
  getRealAqi,
  getRealForex,
  getRealGoldSilver,
  getRealNepse,
  getRealWeather,
} from '@/lib/live/real'
import { aqiBand, localizeNumber, relativeTime } from '@/lib/live/format'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

export const revalidate = 600

export default async function UtilitiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  const lang = locale === 'en' ? 'en' : 'ne'
  const en = locale === 'en'

  const [weather, aqi, nepse, metals, forex] = await Promise.all([
    getRealWeather(locale),
    getRealAqi(locale),
    getRealNepse(locale),
    getRealGoldSilver(locale),
    getRealForex(locale),
  ])
  const forexRates = forex.mock ? [] : (forex.data ?? [])
  const forexSource = forex.mock ? undefined : forex.source

  return (
    <div className="mx-auto max-w-page px-4 py-8" lang={lang}>
      <header className="grid gap-6 border-b border-rule pb-7 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.45fr)] lg:items-end">
        <div>
          <p
            className="text-caption font-bold uppercase tracking-[0.18em] text-brand-strong"
            lang="en"
          >
            Public Service Desk
          </p>
          <h1 className="mt-2 font-display text-[clamp(2.05rem,9vw,4rem)] font-extrabold leading-tight text-ink">
            {en ? 'Daily tools for readers in Nepal' : 'नेपालका पाठकका दैनिक उपकरण'}
          </h1>
          <p className="mt-3 max-w-3xl text-body-lg leading-relaxed text-ink-soft">
            {en
              ? 'Weather, air quality, market indicators, date conversion, typing and calendar tools with source and freshness labels.'
              : 'मौसम, वायु गुणस्तर, बजार संकेत, मिति रूपान्तरण, टाइपिङ र पात्रो स्रोत र अद्यावधिक समयसहित राखिएको छ।'}
          </p>
        </div>
        <div className="rounded-lg border border-rule bg-surface-raised p-4">
          <p className="text-meta font-semibold text-ink">{en ? 'Data rule' : 'डाटा नियम'}</p>
          <p className="mt-1 text-meta leading-relaxed text-ink-soft">
            {en
              ? 'Provider names and freshness are shown. Approximate values are never presented as official.'
              : 'स्रोत र अद्यावधिक समय देखाइन्छ। अनुमानित मानलाई आधिकारिक जसरी देखाइँदैन।'}
          </p>
        </div>
      </header>

      <section
        className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"
        aria-label={en ? 'Live daily snapshot' : 'लाइभ दैनिक झलक'}
      >
        <div className="rounded-xl border border-rule bg-surface-raised p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p
                className="text-caption font-bold uppercase tracking-[0.16em] text-brand-strong"
                lang="en"
              >
                Kathmandu now
              </p>
              <h2 className="mt-1 font-display text-h1 font-extrabold text-ink">
                {!weather.mock && weather.data
                  ? `${localizeNumber(weather.data.tempC, locale)}°C`
                  : en
                    ? 'Weather unavailable'
                    : 'मौसम उपलब्ध छैन'}
              </h2>
            </div>
            {!aqi.mock && aqi.data ? <AqiPill aqi={aqi.data.aqi} locale={locale} /> : null}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Metric
              label={en ? 'Weather source' : 'मौसम स्रोत'}
              value={sourceFor(weather.source, locale)}
              note={
                weather.mock
                  ? en
                    ? 'Awaiting verified feed'
                    : 'प्रमाणित फिड प्रतीक्षामा'
                  : relativeTime(weather.updatedAt, locale)
              }
            />
            <Metric
              label="AQI"
              value={
                !aqi.mock && aqi.data
                  ? localizeNumber(aqi.data.aqi, locale)
                  : en
                    ? 'Unavailable'
                    : 'उपलब्ध छैन'
              }
              note={sourceFor(aqi.source, locale)}
            />
            <Metric
              label={en ? 'Use' : 'प्रयोग'}
              value={en ? 'Plan your day' : 'दैनिक योजना'}
              note={en ? 'Weather and air quality together' : 'मौसम र वायु गुणस्तर सँगै'}
            />
          </div>
        </div>

        <div className="rounded-xl border border-rule bg-surface-raised p-5">
          <p
            className="text-caption font-bold uppercase tracking-[0.16em] text-brand-strong"
            lang="en"
          >
            Market glance
          </p>
          <div className="mt-4 grid gap-4">
            <MarketRow
              label="NEPSE"
              value={
                !nepse.mock && nepse.data
                  ? localizeNumber(nepse.data.index.toFixed(2), locale)
                  : en
                    ? 'Unavailable'
                    : 'उपलब्ध छैन'
              }
              delta={
                !nepse.mock && nepse.data
                  ? `${nepse.data.changePercent >= 0 ? '▲' : '▼'} ${localizeNumber(Math.abs(nepse.data.changePercent).toFixed(2), locale)}%`
                  : ''
              }
              positive={(nepse.data?.changePercent ?? 0) >= 0}
              source={sourceFor(nepse.source, locale)}
            />
            <MarketRow
              label={en ? 'Gold' : 'सुन'}
              value={
                !metals.mock && metals.data
                  ? `रु. ${localizeNumber(metals.data.goldTolaNpr.toLocaleString('en-IN'), locale)}`
                  : en
                    ? 'Unavailable'
                    : 'उपलब्ध छैन'
              }
              delta={en ? 'per tola' : 'प्रति तोला'}
              positive
              source={sourceFor(metals.source, locale)}
            />
            <MarketRow
              label={en ? 'Forex' : 'विदेशी मुद्रा'}
              value={
                forexRates[0]
                  ? `USD ${localizeNumber(forexRates[0].sell.toFixed(2), locale)}`
                  : en
                    ? 'Rate unavailable'
                    : 'दर उपलब्ध छैन'
              }
              delta={forexRates[0] ? 'NPR' : ''}
              positive
              source={
                forexSource ?? (en ? 'Official feed not available' : 'आधिकारिक फिड उपलब्ध छैन')
              }
            />
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-[0.62fr_1.38fr]">
        <aside className="rounded-xl border border-rule bg-surface-raised p-5 lg:sticky lg:top-24 lg:self-start">
          <h2 className="font-display text-h2 font-extrabold text-ink">
            {en ? 'Service standards' : 'सेवा मापदण्ड'}
          </h2>
          <ol className="mt-4 grid gap-3 text-body text-ink-soft">
            {(en
              ? [
                  'Quick daily checks',
                  'Converters people actually use',
                  'Official or clearly-labelled data',
                  'No unsupported result or search widgets',
                ]
              : [
                  'दैनिक छिटो जाँच',
                  'साँच्चै प्रयोग हुने कनभर्टर',
                  'आधिकारिक वा स्पष्ट लेबल भएको डाटा',
                  'असमर्थित नतिजा वा खोजी विजेट नराख्ने',
                ]
            ).map((item, index) => (
              <li key={item} className="grid grid-cols-[2rem_1fr] gap-2">
                <span className="font-mono text-caption font-bold text-brand-strong">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </aside>
        <div>
          <UtilityTools locale={locale} forexRates={forexRates} forexSource={forexSource} />
          <NepaliCalendar locale={locale} />
        </div>
      </section>
    </div>
  )
}

function sourceFor(source: string, locale: Locale): string {
  if (/mock/i.test(source))
    return locale === 'en' ? 'Verified feed pending' : 'प्रमाणित फिड प्रतीक्षामा'
  return source
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="border-t border-rule pt-3">
      <p className="text-caption font-semibold uppercase tracking-wide text-mute">{label}</p>
      <p className="mt-1 font-display text-h2 font-bold text-ink">{value}</p>
      <p className="mt-1 text-caption text-ink-soft">{note}</p>
    </div>
  )
}

function AqiPill({ aqi, locale }: { aqi: number; locale: Locale }) {
  const { band, label } = aqiBand(aqi, locale)
  const color =
    band === 'good'
      ? 'text-aqi-good'
      : band === 'moderate'
        ? 'text-aqi-moderate'
        : band === 'severe'
          ? 'text-aqi-severe'
          : 'text-aqi-unhealthy'
  return (
    <span className="rounded-full border border-rule bg-surface px-3 py-1.5 text-meta font-semibold">
      AQI <span className={color}>{localizeNumber(aqi, locale)}</span> · {label}
    </span>
  )
}

function MarketRow({
  label,
  value,
  delta,
  positive,
  source,
}: {
  label: string
  value: string
  delta: string
  positive: boolean
  source: string
}) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-3 border-t border-rule pt-3 first:border-t-0 first:pt-0">
      <span className="text-meta font-bold uppercase tracking-wide text-mute">{label}</span>
      <div>
        <p className="font-display text-h2 font-bold text-ink">
          {value}{' '}
          {delta ? (
            <span
              className={
                positive ? 'text-meta font-semibold text-up' : 'text-meta font-semibold text-down'
              }
            >
              {delta}
            </span>
          ) : null}
        </p>
        <p className="mt-1 text-caption text-ink-soft">{source}</p>
      </div>
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale: Locale = asLocale((await params).locale)
  return {
    title: locale === 'en' ? 'Utilities' : 'उपयोगी सेवा',
    description:
      locale === 'en'
        ? 'Daily tools for Nepali readers: weather, AQI, markets, calendar, date converter and typing tools.'
        : 'नेपाली पाठकका दैनिक उपकरण: मौसम, AQI, बजार, पात्रो, मिति रूपान्तरण र टाइपिङ।',
    alternates: { canonical: localizeHref(locale, '/utilities') },
  }
}
