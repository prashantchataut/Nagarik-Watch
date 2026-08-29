'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { adToBs, bsToAd, formatBsFull, preetiToUnicode, unicodeToPreeti } from '@nagarikwatch/db'

type ForexRate = {
  iso3: string
  name: string
  buy: number
  sell: number
  unit: string
}

const fieldInputClass =
  'min-h-11 w-full rounded-md border border-rule bg-surface px-3 py-2 text-body text-ink transition-colors duration-fast ease-out-quint focus:outline-2 focus:outline-offset-1 focus:outline-brand'

function ToolWorkspace({
  locale,
  summary,
  children,
}: {
  locale: Locale
  summary?: string
  children: ReactNode
}) {
  return (
    <section
      className="utility-tool-workspace border border-rule bg-surface-raised"
      lang={locale === 'en' ? 'en' : 'ne'}
    >
      {summary ? (
        <p className="border-b border-rule bg-brand-tint/25 px-4 py-3 text-meta leading-relaxed text-ink-soft sm:px-5">
          {summary}
        </p>
      ) : null}
      <div className="grid gap-5 p-4 sm:gap-6 sm:p-5">{children}</div>
    </section>
  )
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-meta font-bold text-ink-soft">{label}</span>
      {children}
      {hint ? <small className="text-caption leading-snug text-mute">{hint}</small> : null}
    </label>
  )
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <output
      className="grid content-center gap-1 border border-rule bg-brand-tint/45 px-4 py-3 sm:px-5 sm:py-4"
      aria-live="polite"
    >
      <span className="text-caption font-bold text-ink-soft">{label}</span>
      <strong className="font-display text-h3 font-extrabold leading-tight text-brand-strong tabular-nums">
        {value}
      </strong>
    </output>
  )
}

function FormRow({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(12rem,0.9fr)] lg:items-stretch lg:gap-6">
      {children}
    </div>
  )
}

function SectionRule() {
  return <div className="border-t border-rule" role="separator" />
}

function PrimaryButton({
  children,
  onClick,
  type = 'button',
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="inline-flex min-h-11 items-center justify-center rounded-md border border-brand bg-brand px-4 text-meta font-bold text-paper transition-colors duration-fast ease-out-quint hover:bg-brand-strong active:scale-[0.98]"
    >
      {children}
    </button>
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
      const value = new Date(`${ad}T12:00:00Z`)
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
    <ToolWorkspace
      locale={locale}
      summary={
        en
          ? 'Uses the verified Bikram Sambat date table for years 2000-2099 BS.'
          : 'बि.सं. २००० देखि २०९९ सम्मको प्रमाणित मिति तालिका प्रयोग हुन्छ।'
      }
    >
      <FormRow>
        <Field label={en ? 'Gregorian date (AD)' : 'इस्वी संवत् मिति (AD)'}>
          <input
            type="date"
            className={fieldInputClass}
            value={ad}
            onChange={(event) => setAd(event.target.value)}
          />
        </Field>
        <Result
          label={en ? 'Bikram Sambat' : 'विक्रम संवत्'}
          value={bs || (en ? 'Choose a supported date' : 'समर्थित मिति छान्नुहोस्')}
        />
      </FormRow>

      <SectionRule />

      <FormRow>
        <fieldset className="min-w-0">
          <legend className="mb-3 text-body font-bold text-ink">
            {en ? 'Bikram Sambat date' : 'विक्रम संवत् मिति'}
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={en ? 'Year' : 'वर्ष'}>
              <input
                className={fieldInputClass}
                inputMode="numeric"
                value={year}
                onChange={(event) => setYear(event.target.value.replace(/\D/g, ''))}
              />
            </Field>
            <Field label={en ? 'Month' : 'महिना'}>
              <input
                className={fieldInputClass}
                inputMode="numeric"
                value={month}
                onChange={(event) => setMonth(event.target.value.replace(/\D/g, ''))}
              />
            </Field>
            <Field label={en ? 'Day' : 'दिन'}>
              <input
                className={fieldInputClass}
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
      </FormRow>
    </ToolWorkspace>
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

  function clear() {
    setPreeti('')
    setUnicode('')
  }

  function loadExample() {
    const example = "g]kfn ;'Gb/ b]z xf] ."
    setPreeti(example)
    setUnicode(preetiToUnicode(example))
  }

  const copyLabel =
    copyState === 'copied'
      ? en
        ? 'Copied to Clipboard!'
        : 'युनिकोड प्रतिलिपि गरियो!'
      : copyState === 'failed'
        ? en
          ? 'Copy Failed'
          : 'प्रति लिन सकिएन'
        : en
          ? 'Copy Unicode'
          : 'युनिकोड प्रतिलिपि गर्नुहोस्'

  return (
    <ToolWorkspace
      locale={locale}
      summary={
        en
          ? 'Real-time bidirectional Preeti to Unicode converter. Conversion runs entirely in your browser.'
          : 'प्रिती फन्टबाट नेपाली युनिकोडमा तत्काल रूपान्तरण। पाठ पूर्णतया तपाईंको ब्राउजरमै प्रोसेस हुन्छ।'
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Field
          label={en ? 'Preeti Font Text' : 'प्रिती फन्ट पाठ (Preeti)'}
          hint={`${preeti.length} ${en ? 'characters' : 'अक्षर'}`}
        >
          <textarea
            className={`${fieldInputClass} min-h-[14rem] resize-y leading-relaxed font-mono`}
            value={preeti}
            onChange={(event) => {
              const next = event.target.value
              setPreeti(next)
              setUnicode(preetiToUnicode(next))
            }}
            placeholder="g]kfn ;'Gb/ b]z xf] ."
          />
        </Field>

        <Field
          label={en ? 'Unicode Nepali Text' : 'युनिकोड नेपाली (Unicode)'}
          hint={`${unicode.length} ${en ? 'characters' : 'अक्षर'}`}
        >
          <textarea
            className={`${fieldInputClass} min-h-[14rem] resize-y leading-relaxed font-devanagari text-lg`}
            value={unicode}
            onChange={(event) => {
              const next = event.target.value
              setUnicode(next)
              setPreeti(unicodeToPreeti(next))
            }}
            placeholder="नेपाल सुन्दर देश हो।"
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <PrimaryButton onClick={copy}>{copyLabel}</PrimaryButton>
        <button
          type="button"
          onClick={clear}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-rule bg-surface px-4 text-meta font-bold text-ink transition-colors hover:border-brand hover:text-brand-strong"
        >
          {en ? 'Clear' : 'खाली गर्नुहोस्'}
        </button>
        <button
          type="button"
          onClick={loadExample}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-dashed border-rule px-4 text-caption font-bold text-ink-soft transition-colors hover:border-brand hover:text-brand-strong"
        >
          {en ? 'Load example text' : 'उदाहरण पाठ लोड गर्नुहोस्'}
        </button>
      </div>
    </ToolWorkspace>
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
  const [direction, setDirection] = useState<'foreign-to-npr' | 'npr-to-foreign'>('foreign-to-npr')
  const rate = rates.find((item) => item.iso3 === iso) ?? rates[0]

  useEffect(() => {
    if (rates.length && !rates.some((item) => item.iso3 === iso)) setIso(rates[0]!.iso3)
  }, [rates, iso])

  const value = useMemo(() => {
    if (!rate) return ''
    const number = Number(amount)
    if (!Number.isFinite(number)) return ''
    const appliedRate = direction === 'foreign-to-npr' ? rate.buy : rate.sell
    return (
      direction === 'foreign-to-npr' ? number * appliedRate : number / appliedRate
    ).toLocaleString('en-US', {
      maximumFractionDigits: 2,
    })
  }, [rate, amount, direction])

  const summary = source
    ? `${en ? 'Source' : 'स्रोत'}: ${source}. ${
        en
          ? 'Foreign to NPR uses the published buy rate; NPR to foreign uses the published sell rate. Banks may still add fees.'
          : 'विदेशी मुद्राबाट रुपैयाँमा खरिद दर र रुपैयाँबाट विदेशी मुद्रामा बिक्री दर प्रयोग हुन्छ। बैंकले छुट्टै शुल्क लिन सक्छ।'
      }`
    : en
      ? 'A verified exchange-rate feed is not available right now.'
      : 'प्रमाणित विनिमय दर अहिले उपलब्ध छैन।'

  return (
    <ToolWorkspace locale={locale} summary={summary}>
      {rate ? (
        <>
          <FormRow>
            <fieldset className="min-w-0">
              <legend className="mb-3 text-body font-bold text-ink">
                {en ? 'Conversion' : 'रूपान्तरण'}
              </legend>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label={en ? 'Currency' : 'मुद्रा'}>
                  <select
                    className={fieldInputClass}
                    value={iso}
                    onChange={(event) => setIso(event.target.value)}
                  >
                    {rates.map((item) => (
                      <option key={item.iso3} value={item.iso3}>
                        {item.iso3} ({item.name})
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={en ? 'Direction' : 'दिशा'}>
                  <select
                    className={fieldInputClass}
                    value={direction}
                    onChange={(event) => setDirection(event.target.value as typeof direction)}
                  >
                    <option value="foreign-to-npr">{iso} → NPR</option>
                    <option value="npr-to-foreign">NPR → {iso}</option>
                  </select>
                </Field>
                <Field label={en ? 'Amount' : 'रकम'}>
                  <input
                    className={fieldInputClass}
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ''))}
                  />
                </Field>
              </div>
            </fieldset>
            <Result label={direction === 'foreign-to-npr' ? 'NPR' : iso} value={value || '0'} />
          </FormRow>
          <p className="text-caption text-mute">
            {en ? 'Buy' : 'खरिद'} {rate.buy.toFixed(2)}, {en ? 'sell' : 'बिक्री'}{' '}
            {rate.sell.toFixed(2)}
          </p>
        </>
      ) : (
        <p className="border border-rule bg-surface px-3 py-3 text-meta leading-relaxed text-ink-soft">
          {en
            ? 'The converter activates when the Nepal Rastra Bank feed is reachable.'
            : 'नेपाल राष्ट्र बैंकको फिड उपलब्ध भएपछि रूपान्तरण सक्रिय हुन्छ।'}
        </p>
      )}
    </ToolWorkspace>
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
    <ToolWorkspace
      locale={locale}
      summary={
        en
          ? 'Completed years, months and days for any valid date range.'
          : 'मान्य मिति अवधिका पूरा वर्ष, महिना र दिन।'
      }
    >
      <FormRow>
        <fieldset className="min-w-0">
          <legend className="mb-3 text-body font-bold text-ink">{en ? 'Dates' : 'मिति'}</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={en ? 'Date of birth' : 'जन्म मिति'}>
              <input
                type="date"
                className={fieldInputClass}
                value={birth}
                onChange={(event) => setBirth(event.target.value)}
              />
            </Field>
            <Field label={en ? 'Calculate on' : 'गणना मिति'}>
              <input
                type="date"
                className={fieldInputClass}
                value={today}
                onChange={(event) => setToday(event.target.value)}
              />
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
      </FormRow>
    </ToolWorkspace>
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
    <ToolWorkspace
      locale={locale}
      summary={
        en
          ? 'Length, weight and temperature conversions run locally in your browser.'
          : 'लम्बाइ, तौल र तापक्रमको रूपान्तरण तपाईंको ब्राउजरमै हुन्छ।'
      }
    >
      <FormRow>
        <fieldset className="min-w-0">
          <legend className="mb-3 text-body font-bold text-ink">
            {en ? 'Measurement' : 'मापन'}
          </legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label={en ? 'Type' : 'प्रकार'}>
              <select
                className={fieldInputClass}
                value={group}
                onChange={(event) => setGroup(event.target.value as UnitGroup)}
              >
                {Object.entries(unitGroups).map(([key, value]) => (
                  <option key={key} value={key}>
                    {en ? value.en : value.ne}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={en ? 'From' : 'बाट'}>
              <select
                className={fieldInputClass}
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              >
                {keys.map((key) => (
                  <option key={key}>{key}</option>
                ))}
              </select>
            </Field>
            <Field label={en ? 'To' : 'मा'}>
              <select
                className={fieldInputClass}
                value={to}
                onChange={(event) => setTo(event.target.value)}
              >
                {keys.map((key) => (
                  <option key={key}>{key}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-3">
            <Field label={en ? 'Amount' : 'परिमाण'}>
              <input
                className={fieldInputClass}
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value.replace(/[^0-9.-]/g, ''))}
              />
            </Field>
          </div>
        </fieldset>
        <Result label={to} value={result || '-'} />
      </FormRow>
    </ToolWorkspace>
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
    <div className="grid gap-6">
      <DateConverterTool locale={locale} />
      <PreetiUnicodeTool locale={locale} />
      <CurrencyConverterTool locale={locale} rates={forexRates} source={forexSource} />
      <AgeCalculatorTool locale={locale} />
      <UnitConverterTool locale={locale} />
    </div>
  )
}
