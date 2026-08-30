'use client'

import { useEffect, useState } from 'react'
import { FileText, LogOut, PenLine, Send } from 'lucide-react'
import { desks, stories } from '@/lib/news/data'
import { href } from '@/lib/news/router'
import { initialOf, journalistLogin, logout, useMe } from '@/lib/news/auth-store'
import { toDevanagari, formatBsFull, adToBs } from '@/lib/news/patro'

const inputClass =
  'w-full rounded-sm border border-rule bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-faint focus:border-crimson focus:outline-none focus:ring-2 focus:ring-crimson/15'

interface Pitch {
  id: string
  headline: string
  desk: string
  summary: string
  status: string
  editorNote: string | null
  createdAt: string
}

const STATUS_NE: Record<string, string> = {
  submitted: 'पठाइएको',
  in_review: 'समीक्षामा',
  accepted: 'स्वीकार',
  declined: 'अस्वीकार',
}

const STATUS_CLASS: Record<string, string> = {
  submitted: 'bg-crimson-wash text-crimson',
  in_review: 'bg-gold/20 text-[#8a6d1a]',
  accepted: 'bg-market-green/15 text-market-green',
  declined: 'bg-ink/10 text-ink-soft',
}

/** Journalist login + mini newsroom desk (#/journalist).
 *  Completely separate from reader accounts, per the newsroom's policy. */
export default function JournalistView() {
  const { me } = useMe()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [pitches, setPitches] = useState<Pitch[] | null>(null)
  const [deskOverride, setDeskOverride] = useState<string | null>(null)
  const [headline, setHeadline] = useState('')
  const [summary, setSummary] = useState('')
  const [body, setBody] = useState('')
  const [submitMsg, setSubmitMsg] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isJournalist = me?.kind === 'journalist'
  const desk = deskOverride ?? (me?.kind === 'journalist' ? me.desk : 'politics')

  useEffect(() => {
    if (!isJournalist) return
    let cancelled = false
    fetch('/api/desk/pitches', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { pitches: [] }))
      .then((j: { pitches: Pitch[] }) => {
        if (!cancelled) setPitches(j.pitches)
      })
      .catch(() => {
        if (!cancelled) setPitches([])
      })
    return () => {
      cancelled = true
    }
  }, [isJournalist])

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await journalistLogin(email, password)
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'त्रुटि भयो।')
    } finally {
      setBusy(false)
    }
  }

  const submitPitch = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitMsg(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/desk/pitches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline, desk, summary, body }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'पठाउन सकिएन।')
      setSubmitMsg('पिच सम्पादकीय डेस्कमा पुग्यो — धन्यवाद!')
      setHeadline('')
      setSummary('')
      setBody('')
      const refreshed = await fetch('/api/desk/pitches', { cache: 'no-store' })
      if (refreshed.ok) {
        const j = (await refreshed.json()) as { pitches: Pitch[] }
        setPitches(j.pitches)
      }
    } catch (err) {
      setSubmitMsg(err instanceof Error ? err.message : 'त्रुटि भयो।')
    } finally {
      setSubmitting(false)
    }
  }

  const todayBs = formatBsFull(adToBs(new Date()))

  /* ---------------- login screen ---------------- */
  if (!isJournalist) {
    return (
      <main id="main">
        <div className="crimson-band no-print">
          <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-2.5">
            <p className="font-headline text-[14px] font-bold text-white">
              नागरिक वाच समाचार कक्ष · पत्रकार प्रवेश
            </p>
            <a href={href('/')} className="font-headline text-[13px] font-semibold text-white/90 hover:text-white">
              गृहपृष्ठ →
            </a>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1180px] px-4">
          <div className="grid gap-x-10 gap-y-8 py-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <p className="kicker">समाचार कक्ष</p>
              <h1 className="mt-1.5 font-headline text-[clamp(30px,4.6vw,44px)] font-extrabold leading-tight text-ink">
                पत्रकार लगइन
              </h1>
              <p className="mt-3 max-w-[56ch] text-[15.5px] leading-relaxed text-ink-soft">
                यो प्रवेश पाठक खाताभन्दा पूर्ण रूपमा छुट्टै छ। पत्रकारले लगइन गरेपछि आफ्नो डेस्कका
                सामग्री हेर्न, नयाँ पिच पठाउन र सम्पादकीय प्रतिक्रिया अनुगमन गर्न सक्नुहुन्छ।
              </p>
              <div className="paper-card mt-6 rounded-sm p-5">
                <p className="font-headline text-[15px] font-extrabold text-ink">डेमो खाता</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-soft">
                  परीक्षणका लागि: <span className="font-semibold text-ink">manisha@nagarikwatch.com</span>{' '}
                  / <span className="font-semibold text-ink">demo1234</span>
                  <br />
                  (राजनीति, बजार र विचार डेस्कका डेमो खाता पनि उपलब्ध छन्।)
                </p>
              </div>
            </div>

            <form onSubmit={login} className="paper-card h-fit space-y-4 rounded-sm p-6">
              <label className="block">
                <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">
                  कर्मचारी इमेल
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  autoComplete="username"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">
                  पासवर्ड
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="current-password"
                />
              </label>
              {error && (
                <p className="rounded-sm bg-crimson-wash px-3 py-2.5 text-[13.5px] font-medium text-crimson-deep">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-sm bg-crimson py-3 font-headline text-[16px] font-bold text-white transition-colors hover:bg-crimson-deep disabled:opacity-60"
              >
                {busy ? 'केही क्षण…' : 'समाचार कक्षमा प्रवेश'}
              </button>
              <p className="text-center text-[12px] text-ink-faint">
                खाता नभएका सम्पादक/पत्रकारले सम्पादकीय निर्देशकसँग सम्पर्क गर्नुहोस्।
              </p>
            </form>
          </div>
        </div>
      </main>
    )
  }

  /* ---------------- mini newsroom desk ---------------- */
  const meJournalist = me.kind === 'journalist' ? me : null
  const deskStories = stories.filter((s) => s.desk === meJournalist?.desk).slice(0, 5)

  return (
    <main id="main">
      <div className="crimson-band no-print">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          <p className="font-headline text-[14px] font-bold text-white">
            समाचार कक्ष · {meJournalist?.name} ({todayBs})
          </p>
          <div className="flex items-center gap-3">
            <a
              href={href(`/${meJournalist?.desk}`)}
              className="font-headline text-[13px] font-semibold text-white/90 hover:text-white"
            >
              मेरो डेस्क →
            </a>
            <button
              type="button"
              onClick={() => void logout()}
              className="flex items-center gap-1.5 rounded-sm border border-white/40 px-2.5 py-1 font-headline text-[12.5px] font-bold text-white transition-colors hover:bg-white hover:text-crimson-deep"
            >
              <LogOut className="size-3.5" /> निस्कनुहोस्
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1180px] px-4">
        <div className="flex flex-wrap items-center justify-between gap-4 py-7">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center rounded-full bg-crimson font-headline text-[22px] font-extrabold text-white">
              {meJournalist ? initialOf(meJournalist.name) : '?'}
            </span>
            <div>
              <h1 className="font-headline text-[26px] font-extrabold text-ink">
                {meJournalist?.name}
              </h1>
              <p className="text-[13.5px] text-ink-soft">
                {meJournalist?.email} · डेस्क:{' '}
                <span className="font-semibold text-crimson">
                  {desks.find((d) => d.slug === meJournalist?.desk)?.nameNe ?? meJournalist?.desk}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-x-10 gap-y-8 pb-12 lg:grid-cols-[1.25fr_1fr]">
          {/* pitch submission */}
          <section aria-label="नयाँ पिच">
            <h2 className="font-headline text-[20px] font-extrabold text-ink">
              नयाँ पिच पठाउनुहोस्
            </h2>
            <form onSubmit={submitPitch} className="paper-card mt-3 space-y-4 rounded-sm p-5">
              <label className="block">
                <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">
                  शीर्षक
                </span>
                <input
                  required
                  minLength={5}
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  className={inputClass}
                  placeholder="उदाहरण: स्थानीय तहमा शिक्षा बजेट खर्चको अवस्था"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">
                    डेस्क
                  </span>
                  <select
                    value={desk}
                    onChange={(e) => setDeskOverride(e.target.value)}
                    className={inputClass}
                  >
                    {desks.map((d) => (
                      <option key={d.slug} value={d.slug}>
                        {d.nameNe}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">
                    सारांश
                  </span>
                  <input
                    required
                    minLength={10}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className={inputClass}
                    placeholder="के, कहाँ, किन — एक पङ्क्तिमा"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">
                  विस्तृत टिपोट (वैकल्पिक)
                </span>
                <textarea
                  rows={5}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className={`${inputClass} resize-y`}
                  placeholder="स्रोत, तथ्यांक, भेट गर्नुपर्ने मानिस…"
                />
              </label>
              {submitMsg && (
                <p className="rounded-sm bg-market-green/10 px-3 py-2.5 text-[13.5px] font-medium text-market-green">
                  {submitMsg}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-sm bg-crimson px-5 py-3 font-headline text-[15px] font-bold text-white transition-colors hover:bg-crimson-deep disabled:opacity-60"
              >
                <Send className="size-4" /> {submitting ? 'पठाँदै…' : 'सम्पादकीय डेस्कमा पठाउनुहोस्'}
              </button>
            </form>

            {/* my pitches */}
            <h2 className="mt-8 font-headline text-[20px] font-extrabold text-ink">
              मेरा पिचहरू
            </h2>
            {pitches === null ? (
              <p className="mt-3 text-[14px] text-ink-faint">लोड हुँदै…</p>
            ) : pitches.length === 0 ? (
              <p className="paper-card mt-3 rounded-sm p-5 text-[14px] text-ink-faint">
                अझै कुनै पिच पठाइएको छैन। माथिको फारमबाट पहिलो पिच पठाउनुहोस्।
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {pitches.map((p) => (
                  <li key={p.id} className="paper-card rounded-sm p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-headline text-[16.5px] font-bold text-ink">{p.headline}</p>
                      <span
                        className={`rounded-sm px-2 py-0.5 font-headline text-[11.5px] font-bold ${
                          STATUS_CLASS[p.status] ?? 'bg-ink/10 text-ink-soft'
                        }`}
                      >
                        {STATUS_NE[p.status] ?? p.status}
                      </span>
                    </div>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">{p.summary}</p>
                    {p.editorNote && (
                      <p className="mt-2 border-l-2 border-gold pl-3 text-[13px] text-ink-soft">
                        सम्पादक: {p.editorNote}
                      </p>
                    )}
                    <p className="mt-2 text-[11.5px] text-ink-faint">
                      {new Date(p.createdAt).toLocaleDateString('ne-NP')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* my desk content */}
          <aside aria-label="मेरो डेस्क">
            <h2 className="font-headline text-[20px] font-extrabold text-ink">डेस्कका सामग्री</h2>
            <p className="mt-1 text-[13px] text-ink-soft">
              {desks.find((d) => d.slug === meJournalist?.desk)?.nameNe} डेस्कमा हाल प्रकाशित सामग्री —{' '}
              {toDevanagari(stories.filter((s) => s.desk === meJournalist?.desk).length)} वटा
            </p>
            <ul className="mt-3 divide-y divide-rule border-y border-rule">
              {deskStories.map((s) => (
                <li key={s.slug}>
                  <a
                    href={href(`/${s.desk}/${s.slug}`)}
                    className="group flex items-start gap-3 py-3.5"
                  >
                    <FileText className="mt-1 size-4 shrink-0 text-crimson" />
                    <span>
                      <span className="block font-headline text-[15.5px] font-bold leading-snug text-ink group-hover:text-crimson">
                        {s.titleNe}
                      </span>
                      <span className="mt-0.5 block text-[12px] text-ink-faint">
                        {toDevanagari(s.readingMinutes)} मिनेट पढाइ · {s.author}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
            <div className="paper-card mt-4 rounded-sm p-4">
              <p className="flex items-center gap-2 font-headline text-[14px] font-extrabold text-ink">
                <PenLine className="size-4 text-crimson" /> सम्पादकीय सुझाव
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                पिसँगै दुईभन्दा बढी स्रोत र मिति–तथ्यांक राख्नुहोस्। तस्वीर भए लिंकसहित पठाउनुहोस्।
                डेस्क सम्पादकले २४ घण्टाभित्र प्रतिक्रिया दिन्छन्।
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
