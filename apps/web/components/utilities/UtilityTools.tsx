'use client'

import { useMemo, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'

const PREETI_TO_UNICODE: Record<string, string> = {
  s: 'क',
  v: 'ख',
  u: 'ग',
  3: 'घ',
  r: 'च',
  h: 'ज',
  t: 'त',
  y: 'थ',
  b: 'द',
  w: 'ध',
  g: 'न',
  k: 'प',
  m: 'फ',
  e: 'भ',
  d: 'म',
  o: 'य',
  '/': 'र',
  n: 'ल',
  j: 'व',
  z: 'श',
  if: 'क्ष',
}

export function UtilityTools({ locale }: { locale: Locale }) {
  const [typing, setTyping] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [amount, setAmount] = useState('100')
  const lang = locale === 'en' ? 'en' : 'ne'

  const unicode = useMemo(
    () => typing.replace(/if|./g, (match) => PREETI_TO_UNICODE[match] ?? match),
    [typing],
  )

  const age = useMemo(() => {
    if (!birthDate) return null
    const birth = new Date(birthDate)
    if (!Number.isFinite(birth.getTime())) return null
    const now = new Date()
    let years = now.getFullYear() - birth.getFullYear()
    const monthDelta = now.getMonth() - birth.getMonth()
    if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < birth.getDate())) years -= 1
    return Math.max(0, years)
  }, [birthDate])

  const usd = Number(amount) || 0
  const npr = usd * 133.5

  return (
    <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]" lang={lang}>
      <div className="rounded-lg border border-rule bg-surface-raised p-5">
        <h2 className="font-display text-h2 text-ink">
          {locale === 'en' ? 'Nepali typing helper' : 'नेपाली टाइपिङ सहयोगी'}
        </h2>
        <p className="mt-2 text-body text-ink-soft">
          {locale === 'en'
            ? 'Preeti-to-Unicode starts with a safe partial map. Replace with a full licensed converter before production.'
            : 'Preeti-to-Unicode सुरक्षित आंशिक नक्साबाट सुरु हुन्छ। उत्पादन अघि पूर्ण लाइसेन्सयुक्त कनभर्टर राख्नुहोस्।'}
        </p>
        <label className="mt-4 block text-meta font-semibold text-ink" htmlFor="preeti-input">
          {locale === 'en' ? 'Preeti text' : 'Preeti पाठ'}
        </label>
        <textarea
          id="preeti-input"
          value={typing}
          onChange={(event) => setTyping(event.target.value)}
          className="mt-2 min-h-32 w-full rounded-md border border-rule bg-surface p-3 text-body text-ink outline-none focus:border-brand"
        />
        <label className="mt-4 block text-meta font-semibold text-ink" htmlFor="unicode-output">
          {locale === 'en' ? 'Unicode output' : 'Unicode नतिजा'}
        </label>
        <textarea
          id="unicode-output"
          value={unicode}
          readOnly
          className="mt-2 min-h-32 w-full rounded-md border border-rule bg-surface p-3 text-body text-ink-soft"
        />
      </div>

      <div className="grid gap-6">
        <div className="rounded-lg border border-rule bg-surface-raised p-5">
          <h2 className="font-display text-h2 text-ink">
            {locale === 'en' ? 'Age calculator' : 'उमेर क्याल्कुलेटर'}
          </h2>
          <label className="mt-4 block text-meta font-semibold text-ink" htmlFor="birth-date">
            {locale === 'en' ? 'Date of birth' : 'जन्म मिति'}
          </label>
          <input
            id="birth-date"
            type="date"
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
            className="mt-2 w-full rounded-md border border-rule bg-surface p-3 text-body text-ink outline-none focus:border-brand"
          />
          <p className="mt-4 rounded-md bg-brand-tint p-3 text-body font-semibold text-brand-strong">
            {age === null
              ? locale === 'en'
                ? 'Choose a date to calculate age.'
                : 'उमेर निकाल्न मिति छान्नुहोस्।'
              : locale === 'en'
                ? `${age} years old`
                : `${age} वर्ष`}
          </p>
        </div>

        <div className="rounded-lg border border-rule bg-surface-raised p-5">
          <h2 className="font-display text-h2 text-ink">
            {locale === 'en' ? 'Currency quick convert' : 'मुद्रा छिटो रूपान्तरण'}
          </h2>
          <p className="mt-2 text-caption text-mute">
            {locale === 'en'
              ? 'Demo rate shown until FOREX_API_KEY is connected.'
              : 'FOREX_API_KEY जोडिएसम्म नमुना दर देखाइएको छ।'}
          </p>
          <label className="mt-4 block text-meta font-semibold text-ink" htmlFor="usd-amount">
            USD
          </label>
          <input
            id="usd-amount"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="mt-2 w-full rounded-md border border-rule bg-surface p-3 text-body text-ink outline-none focus:border-brand"
          />
          <p className="mt-4 rounded-md bg-brand-tint p-3 text-body font-semibold text-brand-strong">
            NPR {npr.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </section>
  )
}
