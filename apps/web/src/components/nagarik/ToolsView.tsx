'use client'

import { useMemo, useState } from 'react'
import {
  ArrowLeftRight,
  CalendarRange,
  Check,
  ClipboardCopy,
  Keyboard,
  Sparkles,
} from 'lucide-react'
import {
  preetiToUnicode,
  unicodeToPreeti,
  normalizeForConvert,
} from '@/lib/preeti'
import {
  adToBs,
  bsToAd,
  BS_MONTHS,
  BS_MONTHS_EN,
  formatBsFull,
  toDevanagari,
  WEEKDAYS_FULL_NE,
} from '@/lib/news/patro'
import { PageHead, container } from './PatroView'
import { href } from '@/lib/news/router'

/* ------------------------------- Hub ------------------------------------- */

export function ToolsHub() {
  const tools = [
    {
      href: '/tools/preeti',
      icon: Keyboard,
      title: 'प्रिती → युनिकोड',
      desc: 'पुराना प्रिती फन्टमा टाइप गरिएका अक्षरहरू युनिकोड देवनागरीमा रूपान्तरण गर्नुहोस् — दुवै दिशामा।',
    },
    {
      href: '/tools/date',
      icon: CalendarRange,
      title: 'मिति रूपान्तरक',
      desc: 'वि.सं. र ई.सं. मिति एकआपसमा बदल्नुहोस्। आजको मिति स्वतः देखाइएको छ।',
    },
    {
      href: '/patro',
      icon: Sparkles,
      title: 'पात्रो',
      desc: 'पूरा नेपाली महिना पात्रो, चाडपर्व र तिथि विवरण।',
    },
  ]
  return (
    <main id="main">
      <div className={container}>
        <PageHead
          kicker="उपकरणहरू"
          title="पाठक उपकरण"
          sub="समाचारभन्दा बाहिर पनि दैनिक जीवनमा काम लाग्ने साना औजारहरू — सबै यही यन्त्रमै चल्छन्।"
        />
        <div className="grid gap-4 py-7 sm:grid-cols-2 md:grid-cols-3 md:py-9">
          {tools.map((t) => (
            <a
              key={t.href}
              href={href(t.href)}
              className="group paper-card rounded-sm p-5 transition-colors hover:border-crimson"
            >
              <span className="grid size-12 place-items-center rounded-sm bg-crimson-wash text-crimson">
                <t.icon className="size-6" />
              </span>
              <h2 className="mt-3 font-headline text-[19px] font-extrabold text-ink group-hover:text-crimson transition-colors">
                {t.title}
              </h2>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{t.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}

/* --------------------------- Preeti converter ------------------------------ */

const SAMPLE_PREETI = 'gful/s jfr'

export function PreetiTool() {
  const [input, setInput] = useState(SAMPLE_PREETI)
  const [dir, setDir] = useState<'p2u' | 'u2p'>('p2u')
  const [copied, setCopied] = useState(false)

  const output = useMemo(() => {
    const normalized = normalizeForConvert(input)
    return dir === 'p2u' ? preetiToUnicode(normalized) : unicodeToPreeti(normalized)
  }, [input, dir])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(output)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore */
    }
  }

  return (
    <main id="main">
      <div className={container}>
        <PageHead
          kicker="उपकरण"
          title="प्रिती ⇄ युनिकोड"
          sub="पुराना प्रिती टाइपराइटर फन्टका अक्षर आधुनिक युनिकोड देवनागरीमा बदल्नुहोस् (र उल्टो पनि)। रूपान्तरण पूर्ण रूपमा तपाईंकै यन्त्रमा हुन्छ — कुनै लेख बाहिर पठाइँदैन।"
        />

        <div className="grid gap-6 py-7 md:py-9 lg:grid-cols-2">
          <section aria-label="आगत">
            <div className="mb-2.5 flex items-center justify-between">
              <label htmlFor="preeti-in" className="font-headline text-[16px] font-extrabold text-ink">
                {dir === 'p2u' ? 'प्रिती (ल्याटिन अक्षर)' : 'युनिकोड देवनागरी'}
              </label>
              <button
                type="button"
                onClick={() => setDir(dir === 'p2u' ? 'u2p' : 'p2u')}
                className="flex items-center gap-1.5 rounded-sm border border-rule px-3 py-1.5 font-headline text-[13px] font-bold text-ink transition-colors hover:border-crimson hover:text-crimson"
              >
                <ArrowLeftRight className="size-4" />
                {dir === 'p2u' ? 'युनिकोड→प्रिती गर्नुहोस्' : 'प्रिती→युनिकोड गर्नुहोस्'}
              </button>
            </div>
            <textarea
              id="preeti-in"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={9}
              dir="auto"
              spellCheck={false}
              className="w-full rounded-sm border border-rule bg-surface p-3.5 font-mono text-[16px] leading-relaxed text-ink placeholder:text-ink-faint focus:border-crimson focus:outline-none"
              placeholder={dir === 'p2u' ? 'यहाँ प्रिती टेक्स्ट टाँस्नुहोस्…' : 'यहाँ देवनागरी लेख्नुहोस्…'}
            />
            <p className="mt-2 text-[12.5px] text-ink-faint">
              नमूना: <code className="rounded bg-surface-soft px-1.5 py-0.5">gful/s jfr</code> →{' '}
              <span className="font-semibold text-ink">नागरिक वाच</span> ·{' '}
              <code className="rounded bg-surface-soft px-1.5 py-0.5">;dfrf/</code> →{' '}
              <span className="font-semibold text-ink">समाचार</span>
            </p>
          </section>

          <section aria-label="निर्गत">
            <div className="mb-2.5 flex items-center justify-between">
              <label htmlFor="preeti-out" className="font-headline text-[16px] font-extrabold text-ink">
                {dir === 'p2u' ? 'युनिकोड देवनागरी' : 'प्रिती (ल्याटिन अक्षर)'}
              </label>
              <button
                type="button"
                onClick={copy}
                className="flex items-center gap-1.5 rounded-sm border border-rule px-3 py-1.5 font-headline text-[13px] font-bold text-ink transition-colors hover:border-crimson hover:text-crimson"
              >
                {copied ? <Check className="size-4 text-market-green" /> : <ClipboardCopy className="size-4" />}
                {copied ? 'कापियो!' : 'काप्नुहोस्'}
              </button>
            </div>
            <textarea
              id="preeti-out"
              value={output}
              readOnly
              rows={9}
              dir="auto"
              className="w-full rounded-sm border-2 border-crimson/40 bg-crimson-wash/30 p-3.5 text-[17px] leading-relaxed text-ink focus:outline-none"
            />
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-faint">
              रूपान्तरण एल्गोरिदम नागरिक वाच न्यूजरुमको नक्सा-आधारित इन्जिन (३१ शब्दमा रूपान्तरित
              परीक्षित) हो। दुर्लभ संयुक्ताक्षर जस्तै केही क्लस्टर म्यानुअल जाँच बाँकी रहन सक्छन्।
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

/* --------------------------- Date converter ------------------------------- */

export function DateConverterTool() {
  const todayBs = useMemo(() => adToBs(new Date()), [])
  const [bs, setBs] = useState(todayBs)
  const [ad, setAd] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

  const bsToAdResult = useMemo(() => {
    const date = bsToAd(bs.year, bs.month, bs.day)
    if (!date) return null
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return {
      label: `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`,
      weekday: WEEKDAYS_FULL_NE[date.getDay()],
    }
  }, [bs])

  const adToBsResult = useMemo(() => {
    const [y, m, d] = ad.split('-').map(Number)
    if (!y || !m || !d) return null
    const date = new Date(Date.UTC(y, m - 1, d, 12))
    return adToBs(date)
  }, [ad])

  return (
    <main id="main">
      <div className={container}>
        <PageHead
          kicker="उपकरण"
          title="मिति रूपान्तरक"
          sub="वि.सं. र ई.सं. मिति एकआपसमा बदल्नुहोस्। रूपान्तरण तालिका बि.सं. २०००–२०९९ सम्म सही छ।"
        />

        <div className="grid gap-6 py-7 md:py-9 lg:grid-cols-2">
          {/* BS → AD */}
          <section className="paper-card rounded-sm p-5" aria-label="वि.सं. बाट ई.सं.">
            <h2 className="font-headline text-[18px] font-extrabold text-ink">
              वि.सं. → ई.सं.
            </h2>
            <div className="mt-3.5 grid grid-cols-[1.2fr_1fr_0.8fr] gap-2.5">
              <label className="block">
                <span className="mb-1 block text-[12px] text-ink-faint">वर्ष</span>
                <input
                  type="number"
                  min={2000}
                  max={2099}
                  value={bs.year}
                  onChange={(e) => setBs({ ...bs, year: Number(e.target.value) })}
                  className="w-full rounded-sm border border-rule bg-paper px-2.5 py-2 font-headline text-[16px] font-bold tabular-nums text-ink focus:border-crimson focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] text-ink-faint">महिना</span>
                <select
                  value={bs.month}
                  onChange={(e) => setBs({ ...bs, month: Number(e.target.value) })}
                  className="w-full rounded-sm border border-rule bg-paper px-2.5 py-2 font-headline text-[15px] font-semibold text-ink focus:border-crimson focus:outline-none"
                >
                  {BS_MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] text-ink-faint">गते</span>
                <input
                  type="number"
                  min={1}
                  max={32}
                  value={bs.day}
                  onChange={(e) => setBs({ ...bs, day: Number(e.target.value) })}
                  className="w-full rounded-sm border border-rule bg-paper px-2.5 py-2 font-headline text-[16px] font-bold tabular-nums text-ink focus:border-crimson focus:outline-none"
                />
              </label>
            </div>
            <div className="mt-4 rounded-sm bg-crimson-wash/60 p-4">
              <p className="text-[12px] uppercase text-ink-faint">परिणाम</p>
              {bsToAdResult ? (
                <p className="mt-1 font-headline text-[24px] font-extrabold text-crimson">
                  {bsToAdResult.label}
                </p>
              ) : (
                <p className="mt-1 text-[15px] text-crimson">
                  यो मिति तालिकामा छैन — गते वा महिना जाँच्नुहोस्।
                </p>
              )}
              {bsToAdResult && (
                <p className="mt-0.5 text-[14px] text-ink-soft">
                  {bsToAdResult.weekday} · वि.सं. {formatBsFull(bs)}
                </p>
              )}
            </div>
          </section>

          {/* AD → BS */}
          <section className="paper-card rounded-sm p-5" aria-label="ई.सं. बाट वि.सं.">
            <h2 className="font-headline text-[18px] font-extrabold text-ink">
              ई.सं. → वि.सं.
            </h2>
            <label className="mt-3.5 block">
              <span className="mb-1 block text-[12px] text-ink-faint">मिति (ई.सं.)</span>
              <input
                type="date"
                value={ad}
                onChange={(e) => setAd(e.target.value)}
                className="w-full rounded-sm border border-rule bg-paper px-3 py-2.5 font-headline text-[16px] font-semibold text-ink focus:border-crimson focus:outline-none"
              />
            </label>
            <div className="mt-4 rounded-sm bg-crimson-wash/60 p-4">
              <p className="text-[12px] uppercase text-ink-faint">परिणाम</p>
              {adToBsResult ? (
                <p className="mt-1 font-headline text-[24px] font-extrabold text-crimson">
                  {formatBsFull(adToBsResult)}
                </p>
              ) : (
                <p className="mt-1 text-[15px] text-crimson">मान्य मिति छान्नुहोस्।</p>
              )}
              {adToBsResult && (
                <p className="mt-0.5 text-[14px] text-ink-soft">
                  {BS_MONTHS_EN[adToBsResult.month - 1]} {adToBsResult.day}, {adToBsResult.year} BS
                </p>
              )}
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-ink-faint">
              आज: वि.सं. {formatBsFull(todayBs)} · गते {toDevanagari(todayBs.day)}।
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
