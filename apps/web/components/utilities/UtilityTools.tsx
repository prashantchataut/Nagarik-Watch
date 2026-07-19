'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Locale } from '@nagarikwatch/db'
import {
  adToBs,
  bsToAd,
  formatBsFull,
  preetiToUnicode,
  unicodeToPreeti,
} from '@nagarikwatch/db'

type ForexRate = {
  iso3: string
  name: string
  buy: number
  sell: number
  unit: string
}

function ToolPanel({
  locale,
  title,
  summary,
  children,
}: {
  locale: Locale
  title: string
  summary: string
  children: ReactNode
}) {
  return (
    <section className="utility-tool" lang={locale === 'en' ? 'en' : 'ne'}>
      <header>
        <h2>{title}</h2>
        <p>{summary}</p>
      </header>
      <div className="utility-tool-body">{children}</div>
    </section>
  )
}

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="utility-field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  )
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <output className="utility-result" aria-live="polite">
      <span>{label}</span>
      <strong>{value}</strong>
    </output>
  )
}

export function DateConverterTool({ locale }: { locale: Locale }) {
  const en = locale === 'en'
  const [ad, setAd] = useState('')
  const [year, setYear] = useState('2083')
  const [month, setMonth] = useState('1')
  const [day, setDay] = useState('1')

  useEffect(() => setAd(new Date().toISOString().slice(0, 10)), [])

  const bs = useMemo(() => {
    if (!ad) return ''
    try {
      const value = new Date(`${ad}T00:00:00`)
      if (Number.isNaN(value.getTime())) return ''
      return formatBsFull(adToBs(value), locale)
    } catch {
      return ''
    }
  }, [ad, locale])

  const gregorian = useMemo(() => {
    try {
      const result = bsToAd(Number(year), Number(month), Number(day))
      return result
        ? result.toLocaleDateString(en ? 'en-GB' : 'ne-NP', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        : ''
    } catch {
      return ''
    }
  }, [year, month, day, en])

  return (
    <ToolPanel
      locale={locale}
      title={en ? 'Convert dates in both directions' : 'दुवै दिशामा मिति रूपान्तरण'}
      summary={
        en
          ? 'Uses the verified Bikram Sambat date table for years 2000–2099 BS.'
          : 'बि.सं. २००० देखि २०९९ सम्मको प्रमाणित मिति तालिका प्रयोग हुन्छ।'
      }
    >
      <div className="utility-form-grid">
        <Field label={en ? 'Gregorian date (AD)' : 'इस्वी संवत् मिति (AD)'}>
          <input type="date" value={ad} onChange={(event) => setAd(event.target.value)} />
        </Field>
        <Result
          label={en ? 'Bikram Sambat' : 'विक्रम संवत्'}
          value={bs || (en ? 'Choose a supported date' : 'समर्थित मिति छान्नुहोस्')}
        />
      </div>

      <hr />

      <div className="utility-form-grid">
        <fieldset>
          <legend>{en ? 'Bikram Sambat date' : 'विक्रम संवत् मिति'}</legend>
          <div className="utility-three-fields">
            <Field label={en ? 'Year' : 'वर्ष'}>
              <input
                inputMode="numeric"
                value={year}
                onChange={(event) => setYear(event.target.value.replace(/\D/g, ''))}
              />
            </Field>
            <Field label={en ? 'Month' : 'महिना'}>
              <input
                inputMode="numeric"
                value={month}
                onChange={(event) => setMonth(event.target.value.replace(/\D/g, ''))}
              />
            </Field>
            <Field label={en ? 'Day' : 'दिन'}>
              <input
                inputMode="numeric"
                value={day}
                onChange={(event) => setDay(event.target.value.replace(/\D/g, ''))}
              />
            </Field>
          </div>
        </fieldset>
        <Result
          label={en ? 'Gregorian date' : 'इस्वी संवत्'}
          value={gregorian || (en ? 'Check the BS date' : 'बि.सं. मिति जाँच्नुहोस्')}
        />
      </div>
    </ToolPanel>
  )
}

export function PreetiUnicodeTool({ locale }: { locale: Locale }) {
  const en = locale === 'en'
  const [preeti, setPreeti] = useState('')
  const [unicode, setUnicode] = useState('')
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  async function copy() {
    if (!unicode) return
    try {
      await navigator.clipboard.writeText(unicode)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
    window.setTimeout(() => setCopyState('idle'), 1800)
  }

  const copyLabel =
    copyState === 'copied'
      ? en
        ? 'Copied'
        : 'प्रति लिइयो'
      : copyState === 'failed'
        ? en
          ? 'Copy failed'
          : 'प्रति लिन सकिएन'
        : en
          ? 'Copy Unicode'
          : 'युनिकोड प्रति लिनुहोस्'

  return (
    <ToolPanel
      locale={locale}
      title={en ? 'Convert legacy Preeti text to Unicode' : 'प्रिती पाठलाई युनिकोडमा बदल्नुहोस्'}
      summary={
        en
          ? 'The conversion happens in your browser. Text is not uploaded or stored.'
          : 'रूपान्तरण तपाईंको ब्राउजरमै हुन्छ। पाठ अपलोड वा भण्डारण हुँदैन।'
      }
    >
      <div className="utility-split-editor">
        <Field label="Preeti">
          <textarea
            value={preeti}
            onChange={(event) => {
              const next = event.target.value
              setPreeti(next)
              setUnicode(preetiToUnicode(next))
            }}
            placeholder="g]kfn"
          />
        </Field>
        <Field label={en ? 'Unicode Nepali' : 'युनिकोड नेपाली'}>
          <textarea
            value={unicode}
            onChange={(event) => {
              const next = event.target.value
              setUnicode(next)
              setPreeti(unicodeToPreeti(next))
            }}
            placeholder="नेपाल"
          />
        </Field>
      </div>
      <button type="button" className="utility-action" onClick={copy}>
        {copyLabel}
      </button>
    </ToolPanel>
  )
}

export function CurrencyConverterTool({
  locale,
  rates = [],
  source,
}: {
  locale: Locale
  rates?: ForexRate[]
  source?: string
}) {
  const en = locale === 'en'
  const [iso, setIso] = useState('USD')
  const [amount, setAmount] = useState('100')
  const [direction, setDirection] = useState<'foreign-to-npr' | 'npr-to-foreign'>(
    'foreign-to-npr',
  )
  const rate = rates.find((item) => item.iso3 === iso) ?? rates[0]

  useEffect(() => {
    if (rates.length && !rates.some((item) => item.iso3 === iso)) setIso(rates[0]!.iso3)
  }, [rates, iso])

  const value = useMemo(() => {
    if (!rate) return ''
    const number = Number(amount)
    if (!Number.isFinite(number)) return ''
    const mid = (rate.buy + rate.sell) / 2
    return (direction === 'foreign-to-npr' ? number * mid : number / mid).toLocaleString(
      'en-US',
      { maximumFractionDigits: 2 },
    )
  }, [rate, amount, direction])

  return (
    <ToolPanel
      locale={locale}
      title={en ? 'Convert with the latest verified NPR rate' : 'पछिल्लो प्रमाणित NPR दरमा रूपान्तरण'}
      summary={
        source
          ? `${en ? 'Source' : 'स्रोत'}: ${source}. ${
              en
                ? 'Indicative only; banks may apply different spreads.'
                : 'संकेतात्मक मात्र; बैंकको खरिद–बिक्री अन्तर फरक हुन सक्छ।'
            }`
          : en
            ? 'A verified exchange-rate feed is not available right now.'
            : 'प्रमाणित विनिमय दर अहिले उपलब्ध छैन।'
      }
    >
      {rate ? (
        <>
          <div className="utility-form-grid">
            <fieldset>
              <legend>{en ? 'Conversion' : 'रूपान्तरण'}</legend>
              <div className="utility-three-fields">
                <Field label={en ? 'Currency' : 'मुद्रा'}>
                  <select value={iso} onChange={(event) => setIso(event.target.value)}>
                    {rates.map((item) => (
                      <option key={item.iso3} value={item.iso3}>
                        {item.iso3} · {item.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={en ? 'Direction' : 'दिशा'}>
                  <select
                    value={direction}
                    onChange={(event) => setDirection(event.target.value as typeof direction)}
                  >
                    <option value="foreign-to-npr">{iso} → NPR</option>
                    <option value="npr-to-foreign">NPR → {iso}</option>
                  </select>
                </Field>
                <Field label={en ? 'Amount' : 'रकम'}>
                  <input
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ''))}
                  />
                </Field>
              </div>
            </fieldset>
            <Result label={direction === 'foreign-to-npr' ? 'NPR' : iso} value={value || '0'} />
          </div>
          <p className="utility-source-line">
            {en ? 'Buy' : 'खरिद'} {rate.buy.toFixed(2)} · {en ? 'Sell' : 'बिक्री'}{' '}
            {rate.sell.toFixed(2)}
          </p>
        </>
      ) : (
        <p className="editorial-empty">
          {en
            ? 'The converter activates automatically when the Nepal Rastra Bank feed is reachable.'
            : 'नेपाल राष्ट्र बैंकको फिड उपलब्ध भएपछि रूपान्तरण स्वतः सक्रिय हुन्छ।'}
        </p>
      )}
    </ToolPanel>
  )
}

export function AgeCalculatorTool({ locale }: { locale: Locale }) {
  const en = locale === 'en'
  const [birth, setBirth] = useState('')
  const [today, setToday] = useState('')

  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), [])

  const age = useMemo(() => {
    if (!birth || !today) return null
    const start = new Date(`${birth}T00:00:00`)
    const end = new Date(`${today}T00:00:00`)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return null

    let years = end.getFullYear() - start.getFullYear()
    let months = end.getMonth() - start.getMonth()
    let days = end.getDate() - start.getDate()
    if (days < 0) {
      months -= 1
      days += new Date(end.getFullYear(), end.getMonth(), 0).getDate()
    }
    if (months < 0) {
      years -= 1
      months += 12
    }
    return { years, months, days }
  }, [birth, today])

  return (
    <ToolPanel
      locale={locale}
      title={en ? 'Calculate completed age precisely' : 'पूरा उमेर स्पष्ट रूपमा निकाल्नुहोस्'}
      summary={
        en
          ? 'See completed years, months and days for any valid date range.'
          : 'मान्य मिति अवधिका पूरा वर्ष, महिना र दिन हेर्नुहोस्।'
      }
    >
      <div className="utility-form-grid">
        <fieldset>
          <legend>{en ? 'Dates' : 'मिति'}</legend>
          <div className="utility-two-fields">
            <Field label={en ? 'Date of birth' : 'जन्म मिति'}>
              <input type="date" value={birth} onChange={(event) => setBirth(event.target.value)} />
            </Field>
            <Field label={en ? 'Calculate on' : 'गणना मिति'}>
              <input type="date" value={today} onChange={(event) => setToday(event.target.value)} />
            </Field>
          </div>
        </fieldset>
        <Result
          label={en ? 'Completed age' : 'पूरा उमेर'}
          value={
            age
              ? en
                ? `${age.years} years, ${age.months} months, ${age.days} days`
                : `${age.years} वर्ष, ${age.months} महिना, ${age.days} दिन`
              : en
                ? 'Enter a valid birth date'
                : 'मान्य जन्म मिति राख्नुहोस्'
          }
        />
      </div>
    </ToolPanel>
  )
}

type UnitGroup = 'length' | 'weight' | 'temperature'

const unitGroups = {
  length: {
    units: { metre: 1, kilometre: 1000, foot: 0.3048, mile: 1609.344 },
    ne: 'लम्बाइ',
    en: 'Length',
  },
  weight: {
    units: { kilogram: 1, gram: 0.001, pound: 0.45359237, tola: 0.0116638125 },
    ne: 'तौल',
    en: 'Weight',
  },
  temperature: {
    units: { celsius: 1, fahrenheit: 1, kelvin: 1 },
    ne: 'तापक्रम',
    en: 'Temperature',
  },
} as const

function convertTemperature(value: number, from: string, to: string): number {
  const celsius =
    from === 'fahrenheit' ? ((value - 32) * 5) / 9 : from === 'kelvin' ? value - 273.15 : value
  return to === 'fahrenheit' ? (celsius * 9) / 5 + 32 : to === 'kelvin' ? celsius + 273.15 : celsius
}

export function UnitConverterTool({ locale }: { locale: Locale }) {
  const en = locale === 'en'
  const [group, setGroup] = useState<UnitGroup>('length')
  const keys = Object.keys(unitGroups[group].units)
  const [from, setFrom] = useState('metre')
  const [to, setTo] = useState('kilometre')
  const [amount, setAmount] = useState('1')

  useEffect(() => {
    const next = Object.keys(unitGroups[group].units)
    setFrom(next[0]!)
    setTo(next[1]!)
  }, [group])

  const result = useMemo(() => {
    const number = Number(amount)
    if (!Number.isFinite(number)) return ''
    const converted =
      group === 'temperature'
        ? convertTemperature(number, from, to)
        : (number * (unitGroups[group].units as Record<string, number>)[from]!) /
          (unitGroups[group].units as Record<string, number>)[to]!
    return converted.toLocaleString('en-US', { maximumFractionDigits: 6 })
  }, [amount, from, to, group])

  return (
    <ToolPanel
      locale={locale}
      title={en ? 'Convert everyday measurements' : 'दैनिक मापन रूपान्तरण'}
      summary={
        en
          ? 'Length, weight and temperature conversions run locally in your browser.'
          : 'लम्बाइ, तौल र तापक्रमको रूपान्तरण तपाईंको ब्राउजरमै हुन्छ।'
      }
    >
      <div className="utility-form-grid">
        <fieldset>
          <legend>{en ? 'Measurement' : 'मापन'}</legend>
          <div className="utility-three-fields">
            <Field label={en ? 'Type' : 'प्रकार'}>
              <select value={group} onChange={(event) => setGroup(event.target.value as UnitGroup)}>
                {Object.entries(unitGroups).map(([key, value]) => (
                  <option key={key} value={key}>
                    {en ? value.en : value.ne}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={en ? 'From' : 'बाट'}>
              <select value={from} onChange={(event) => setFrom(event.target.value)}>
                {keys.map((key) => (
                  <option key={key}>{key}</option>
                ))}
              </select>
            </Field>
            <Field label={en ? 'To' : 'मा'}>
              <select value={to} onChange={(event) => setTo(event.target.value)}>
                {keys.map((key) => (
                  <option key={key}>{key}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label={en ? 'Amount' : 'परिमाण'}>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^0-9.-]/g, ''))}
            />
          </Field>
        </fieldset>
        <Result label={to} value={result || ' - '} />
      </div>
    </ToolPanel>
  )
}

export function UtilityTools({
  locale,
  forexRates = [],
  forexSource,
}: {
  locale: Locale
  forexRates?: ForexRate[]
  forexSource?: string
}) {
  return (
    <div className="space-y-8">
      <DateConverterTool locale={locale} />
      <PreetiUnicodeTool locale={locale} />
      <CurrencyConverterTool locale={locale} rates={forexRates} source={forexSource} />
      <AgeCalculatorTool locale={locale} />
      <UnitConverterTool locale={locale} />
    </div>
  )
}
