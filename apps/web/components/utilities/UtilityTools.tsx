'use client'

import { useMemo, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { adToBs, bsToAd, formatBsFull, preetiToUnicode, unicodeToPreeti } from '@nagarikwatch/db'

// Local structural type matching the ForexRate returned by the server-side live feed.
// Defined here (not imported from lib/live/real.ts) because that module is 'server-only'
// and this is a client component — we only ever receive the values as props.
type ForexRate = { iso3: string; name: string; buy: number; sell: number; unit: string }

type UtilityToolsProps = {
  locale: Locale
  /** Today's NPR forex rates. When empty, the currency tool clearly says rates are unavailable. */
  forexRates?: ForexRate[]
  /** Source label for the rate provenance line (e.g. "Nepal Rastra Bank"). */
  forexSource?: string
}

/**
 * Reader-facing utility converters — the daily tools Nepali portals compete on.
 * All four are pure client-side math (no fetch on interaction), so they stay instant
 * and work offline once the page is loaded:
 *   1. AD ⇄ BS date converter (bidirectional, verified against the founder anchor).
 *   2. Preeti ⇄ Unicode (full keyboard map, both directions).
 *   3. Currency converter against the live NPR rate (passed in from the server).
 *   4. Age calculator.
 */
export function UtilityTools({ locale, forexRates = [], forexSource }: UtilityToolsProps) {
  return (
    <section className="mt-10 grid gap-6 lg:grid-cols-2">
      <DateConverter locale={locale} />
      <PreetiConverter locale={locale} />
      <CurrencyConverter locale={locale} rates={forexRates} source={forexSource} />
      <AgeCalculator locale={locale} />
    </section>
  )
}

function Card({
  title,
  subtitle,
  locale,
  children,
}: {
  title: string
  subtitle?: string
  locale: Locale
  children: React.ReactNode
}) {
  const lang = locale === 'en' ? 'en' : 'ne'
  return (
    <div className="rounded-lg border border-rule bg-surface-raised p-5" lang={lang}>
      <h2 className="font-display text-h2 text-ink">{title}</h2>
      {subtitle && <p className="mt-1 text-body text-ink-soft">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  )
}

function ResultBox({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-md bg-brand-tint p-3 text-body font-semibold text-brand-strong">
      {children}
    </p>
  )
}

function CopyButton({
  onClick,
  copied,
  en,
}: {
  onClick: () => void
  copied: boolean
  en: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 inline-flex items-center rounded-full border border-rule px-3 py-1 text-meta font-semibold text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint hover:text-brand-strong"
    >
      {copied ? (en ? 'Copied' : 'प्रति लिइयो') : en ? 'Copy' : 'प्रति लिनुहोस्'}
    </button>
  )
}

function DateConverter({ locale }: { locale: Locale }) {
  const todayISO = new Date().toISOString().slice(0, 10)
  const [ad, setAd] = useState(todayISO)
  const [bsYear, setBsYear] = useState('')
  const [bsMonth, setBsMonth] = useState('')
  const [bsDay, setBsDay] = useState('')

  const adToBsResult = useMemo(() => {
    const d = new Date(`${ad}T00:00:00Z`)
    if (Number.isNaN(d.getTime())) return null
    const bs = adToBs(d)
    return formatBsFull(bs, locale)
  }, [ad, locale])

  const bsToAdResult = useMemo(() => {
    const y = Number(bsYear)
    const m = Number(bsMonth)
    const d = Number(bsDay)
    if (!y || !m || !d) return null
    const result = bsToAd(y, m, d)
    if (!result) return locale === 'en' ? 'Out of supported range (2000–2099)' : 'सीमित (२०००–२०९९)'
    return result.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }, [bsYear, bsMonth, bsDay, locale])

  const en = locale === 'en'
  return (
    <Card
      locale={locale}
      title={en ? 'AD ⇄ BS date converter' : 'अंग्रेजी ⇄ बि.सं. मिति'}
      subtitle={en ? 'Bikram Sambat, supported 2000–2099' : 'विक्रम संवत्, २०००–२०९९'}
    >
      <label className="block text-meta font-semibold text-ink" htmlFor="ad-input">
        {en ? 'Gregorian (AD) date' : 'अंग्रेजी (AD) मिति'}
      </label>
      <input
        id="ad-input"
        type="date"
        value={ad}
        onChange={(e) => setAd(e.target.value)}
        className="mt-2 w-full rounded-md border border-rule bg-surface p-3 text-body text-ink outline-none focus:border-brand"
      />
      <ResultBox>{adToBsResult ?? (en ? 'Pick a date' : 'मिति छान्नुहोस्')}</ResultBox>

      <label className="mt-5 block text-meta font-semibold text-ink" htmlFor="bs-y">
        {en ? 'BS date (year / month / day)' : 'बि.सं. मिति (वर्ष / महिना / दिन)'}
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="bs-y"
          inputMode="numeric"
          placeholder="2083"
          value={bsYear}
          onChange={(e) => setBsYear(e.target.value.replace(/[^0-9]/g, ''))}
          className="w-full rounded-md border border-rule bg-surface p-3 text-body text-ink outline-none focus:border-brand"
        />
        <input
          inputMode="numeric"
          placeholder={en ? 'mm' : 'महिना'}
          value={bsMonth}
          onChange={(e) => setBsMonth(e.target.value.replace(/[^0-9]/g, ''))}
          className="w-24 rounded-md border border-rule bg-surface p-3 text-body text-ink outline-none focus:border-brand"
        />
        <input
          inputMode="numeric"
          placeholder={en ? 'dd' : 'दिन'}
          value={bsDay}
          onChange={(e) => setBsDay(e.target.value.replace(/[^0-9]/g, ''))}
          className="w-24 rounded-md border border-rule bg-surface p-3 text-body text-ink outline-none focus:border-brand"
        />
      </div>
      <ResultBox>{bsToAdResult ?? (en ? 'Enter a BS date' : 'बि.सं. मिति राख्नुहोस्')}</ResultBox>
    </Card>
  )
}

function PreetiConverter({ locale }: { locale: Locale }) {
  const [preeti, setPreeti] = useState('')
  const [unicode, setUnicode] = useState('')
  const [copied, setCopied] = useState<'p' | 'u' | null>(null)
  const en = locale === 'en'

  const copy = async (which: 'p' | 'u', text: string) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(which)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      // clipboard blocked — silently ignore; the field stays selectable.
    }
  }

  return (
    <Card
      locale={locale}
      title={en ? 'Preeti ⇄ Unicode' : 'प्रिती ⇄ युनिकोड'}
      subtitle={en ? 'Full Preeti keyboard map, both directions' : 'पूर्ण प्रिती नक्सा, दुवै दिशा'}
    >
      <label className="block text-meta font-semibold text-ink" htmlFor="preeti-in">
        {en ? 'Preeti' : 'प्रिती'}
      </label>
      <textarea
        id="preeti-in"
        value={preeti}
        onChange={(e) => {
          setPreeti(e.target.value)
          setUnicode(preetiToUnicode(e.target.value))
        }}
        className="mt-2 min-h-24 w-full rounded-md border border-rule bg-surface p-3 text-body text-ink outline-none focus:border-brand"
        placeholder="g]kfn"
      />
      <CopyButton onClick={() => copy('p', preeti)} copied={copied === 'p'} en={en} />

      <label className="mt-4 block text-meta font-semibold text-ink" htmlFor="uni-out">
        {en ? 'Unicode' : 'युनिकोड'}
      </label>
      <textarea
        id="uni-out"
        value={unicode}
        onChange={(e) => {
          setUnicode(e.target.value)
          setPreeti(unicodeToPreeti(e.target.value))
        }}
        className="mt-2 min-h-24 w-full rounded-md border border-rule bg-surface p-3 text-body text-ink outline-none focus:border-brand"
        placeholder="नेपाल"
      />
      <CopyButton onClick={() => copy('u', unicode)} copied={copied === 'u'} en={en} />
    </Card>
  )
}

function CurrencyConverter({
  locale,
  rates,
  source,
}: {
  locale: Locale
  rates: ForexRate[]
  source?: string
}) {
  const en = locale === 'en'
  const sorted = useMemo(() => [...rates].sort((a, b) => a.iso3.localeCompare(b.iso3)), [rates])
  const [currency, setCurrency] = useState('USD')
  const [amount, setAmount] = useState('100')
  const [direction, setDirection] = useState<'toNpr' | 'fromNpr'>('toNpr')

  const rate = sorted.find((r) => r.iso3 === currency)
  const amountNum = Number(amount) || 0

  const result = useMemo(() => {
    if (!rate) return null
    const mid = (rate.buy + rate.sell) / 2
    if (direction === 'toNpr') return amountNum * mid
    return mid === 0 ? 0 : amountNum / mid
  }, [rate, amountNum, direction])

  return (
    <Card
      locale={locale}
      title={en ? 'Currency converter' : 'मुद्रा रूपान्तरण'}
      subtitle={
        rates.length === 0
          ? en
            ? 'Official rate feed is not available right now'
            : 'आधिकारिक दर फिड अहिले उपलब्ध छैन'
          : source
            ? `${en ? 'Rate source' : 'दर स्रोत'}: ${source}`
            : undefined
      }
    >
      {rates.length === 0 ? (
        <p className="text-body text-ink-soft">
          {en
            ? 'NPR conversion will appear when the newsroom enables a licensed foreign-exchange feed.'
            : 'न्यूजरुमले स्वीकृत विदेशी मुद्रा फिड सक्रिय गरेपछि रूपान्तरण देखिन्छ।'}
        </p>
      ) : (
        <>
          <div className="flex gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-md border border-rule bg-surface p-3 text-body text-ink outline-none focus:border-brand"
            >
              {sorted.map((r) => (
                <option key={r.iso3} value={r.iso3}>
                  {r.iso3} — {r.name}
                </option>
              ))}
            </select>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as 'toNpr' | 'fromNpr')}
              className="w-32 rounded-md border border-rule bg-surface p-3 text-body text-ink outline-none focus:border-brand"
            >
              <option value="toNpr">→ NPR</option>
              <option value="fromNpr">NPR →</option>
            </select>
          </div>
          <label className="mt-3 block text-meta font-semibold text-ink" htmlFor="fx-amt">
            {direction === 'toNpr' ? currency : 'NPR'}
          </label>
          <input
            id="fx-amt"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
            className="mt-2 w-full rounded-md border border-rule bg-surface p-3 text-body text-ink outline-none focus:border-brand"
          />
          <ResultBox>
            {result === null
              ? en
                ? 'Select a currency'
                : 'मुद्रा छान्नुहोस्'
              : `${result.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${
                  direction === 'toNpr' ? 'NPR' : currency
                }`}
          </ResultBox>
          {rate && (
            <p className="mt-2 text-caption text-mute">
              {en ? 'Mid rate' : 'मध्य दर'}: 1 {currency} ={' '}
              {((rate.buy + rate.sell) / 2).toLocaleString('en-US', {
                maximumFractionDigits: 2,
              })}{' '}
              NPR
            </p>
          )}
        </>
      )}
    </Card>
  )
}

function AgeCalculator({ locale }: { locale: Locale }) {
  const en = locale === 'en'
  const [birth, setBirth] = useState('')
  const age = useMemo(() => {
    if (!birth) return null
    const b = new Date(birth)
    if (!Number.isFinite(b.getTime())) return null
    const now = new Date()
    let years = now.getFullYear() - b.getFullYear()
    const monthDelta = now.getMonth() - b.getMonth()
    if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < b.getDate())) years -= 1
    return Math.max(0, years)
  }, [birth])

  return (
    <Card locale={locale} title={en ? 'Age calculator' : 'उमेर क्याल्कुलेटर'}>
      <label className="block text-meta font-semibold text-ink" htmlFor="birth">
        {en ? 'Date of birth' : 'जन्म मिति'}
      </label>
      <input
        id="birth"
        type="date"
        value={birth}
        onChange={(e) => setBirth(e.target.value)}
        className="mt-2 w-full rounded-md border border-rule bg-surface p-3 text-body text-ink outline-none focus:border-brand"
      />
      <ResultBox>
        {age === null
          ? en
            ? 'Choose a date'
            : 'मिति छान्नुहोस्'
          : en
            ? `${age} years`
            : `${age} वर्ष`}
      </ResultBox>
    </Card>
  )
}
