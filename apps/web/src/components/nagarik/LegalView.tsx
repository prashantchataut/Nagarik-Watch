'use client'

import { useState } from 'react'
import { PageHead, container } from './PatroView'
import { href } from '@/lib/news/router'
import { INFO_PAGES } from '@/lib/news/info-pages'


const NAV = [
  ['about', 'हाम्रोबारे'],
  ['ethics', 'सम्पादकीय मापदण्ड'],
  ['advertise', 'विज्ञापन'],
  ['contact', 'सम्पर्क'],
  ['privacy', 'गोपनीयता नीति'],
  ['terms', 'प्रयोगका सर्तहरू'],
  ['cookies', 'कुकी नीति'],
]

const inputClass =
  'w-full rounded-sm border border-rule bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-faint focus:border-crimson focus:outline-none focus:ring-2 focus:ring-crimson/15'

/** Contact / news-tip form — posts to /api/contact (rate-limited). */
function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'पठाउन सकिएन।')
      setDone(true)
      setName('')
      setEmail('')
      setSubject('')
      setMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'पठाउन सकिएन।')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="paper-card mt-2 rounded-sm p-5">
        <p className="font-headline text-[17px] font-extrabold text-market-green">
          सन्देश प्राप्त भयो — धन्यवाद!
        </p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
          हामी सम्पादकीय टोलीले सन्देश पढ्नेछौँ र आवश्यक भएमा ४८ घण्टाभित्र इमेलमा जवाफ दिनेछौँ।
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-3 rounded-sm border border-rule px-4 py-2 font-headline text-[13.5px] font-bold text-ink-soft hover:border-crimson hover:text-crimson"
        >
          अर्को सन्देश पठाउनुहोस्
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="paper-card mt-2 space-y-4 rounded-sm p-5">
      <p className="font-headline text-[17px] font-extrabold text-ink">सन्देश फारम</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">नाम *</span>
          <input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">इमेल *</span>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">विषय *</span>
        <input required minLength={3} value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} placeholder="जस्तै: समाचार सुझाव / त्रुटि सच्याउने / विज्ञापन" />
      </label>
      <label className="block">
        <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">सन्देश *</span>
        <textarea
          required
          minLength={20}
          maxLength={3000}
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${inputClass} resize-y`}
          placeholder="आफ्नो सुझाव, प्रतिक्रिया वा समाचार टिप विस्तारै लेख्नुहोस्…"
        />
      </label>
      {error && (
        <p className="rounded-sm bg-crimson-wash px-3 py-2.5 text-[13.5px] font-medium text-crimson-deep">{error}</p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="rounded-sm bg-crimson px-5 py-2.5 font-headline text-[15px] font-bold text-white transition-colors hover:bg-crimson-deep disabled:opacity-60"
      >
        {busy ? 'पठाँदै…' : 'पठाउनुहोस्'}
      </button>
    </form>
  )
}

export default function LegalView({ slug }: { slug: string }) {
  const page = INFO_PAGES[slug]
  if (!page) {
    return (
      <main id="main" className="mx-auto max-w-[680px] px-4 py-20 text-center">
        <p className="kicker">पृष्ठ भेटिएन</p>
        <h1 className="mt-2 font-headline text-[30px] font-extrabold text-ink">यस्तो पृष्ठ छैन</h1>
        <a href={href('/')} className="mt-4 inline-block font-semibold text-crimson hover:underline">
          गृहपृष्ठ जानुहोस्
        </a>
      </main>
    )
  }
  return (
    <main id="main">
      <div className={container}>
        <PageHead kicker={page.kicker} title={page.title} />
        <div className="max-w-[680px] py-7 md:py-9">
          {page.sections.map((sec) => (
            <section key={sec.heading} className="mb-8">
              <h2 className="font-headline text-[22px] font-extrabold text-ink">{sec.heading}</h2>
              <div className="mt-3 space-y-4">
                {sec.paras.map((p, i) => (
                  <p key={i} className="text-[16.5px] leading-[1.9] text-ink-soft">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          ))}
          {slug === 'contact' && <ContactForm />}
          <div className="border-t border-rule pt-5">
            <p className="mb-2.5 text-[11px] uppercase text-ink-faint">थप पृष्ठहरू</p>
            <div className="flex flex-wrap gap-2">
              {NAV.filter(([s]) => s !== slug).map(([s, label]) => (
                <a
                  key={s}
                  href={href(`/${s}`)}
                  className="rounded-full border border-rule px-3.5 py-1.5 font-headline text-[13.5px] font-semibold text-ink-soft transition-colors hover:border-crimson hover:text-crimson"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterDone, setNewsletterDone] = useState(false)

  const subscribeNewsletter = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail.includes('@')) return
    try {
      await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail }),
      })
      setNewsletterDone(true)
    } catch {
      /* quiet */
    }
  }

  return (
    <footer className="mt-auto border-t-2 border-ink bg-surface-soft no-print">
      {/* साँझ ब्रिफिङ strip (full width) */}
      <div className="crimson-band">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-4 py-3">
          <p className="font-headline text-[15px] font-bold text-white">
            साँझ ब्रिफिङ — दिनका मुख्य समाचार इमेलमा पाउनुहोस्
          </p>
          {newsletterDone ? (
            <p className="rounded-sm bg-white/15 px-3 py-1.5 font-headline text-[13.5px] font-bold text-white">
              सदस्यता दर्ता भयो — धन्यवाद!
            </p>
          ) : (
            <form onSubmit={subscribeNewsletter} className="flex w-full max-w-md gap-2">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="इमेल ठेगाना"
                aria-label="साँझ ब्रिफिङ सदस्यताका लागि इमेल"
                className="w-full rounded-sm border border-white/30 bg-white/10 px-3 py-2 text-[14px] text-white placeholder:text-white/60 focus:border-white focus:outline-none"
              />
              <button
                type="submit"
                className="shrink-0 rounded-sm bg-white px-4 py-2 font-headline text-[14px] font-bold text-crimson-deep transition-colors hover:bg-white/90"
              >
                सदस्यता
              </button>
            </form>
          )}
        </div>
      </div>
      <div className={container}>
        <div className="grid gap-x-8 gap-y-8 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex flex-col leading-none">
              <span className="font-headline text-[10px] font-bold uppercase text-crimson">
                Nagarik Watch
              </span>
              <span className="font-headline text-[30px] font-extrabold text-ink">
                नागरिक वाच
              </span>
            </div>
            <p className="mt-3 max-w-[46ch] text-[14px] leading-relaxed text-ink-soft">
              नेपाली भाषाको स्वतन्त्र डिजिटल समाचार पत्रिका। समाचार, विचार, पात्रो, बजार र उपकरण —
              सबै नागरिकका लागि, एउटै पानोमा।
            </p>
            <p className="mt-4 text-[12.5px] text-ink-faint">
              यो एउटा प्रतिमान (डेमो) संस्करण हो — समाचार तथा डाटा नमूना प्रयोजनका लागि मात्र।
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={href('/journalist')}
                className="rounded-sm border border-crimson/60 px-3 py-1.5 font-headline text-[13px] font-bold text-crimson transition-colors hover:bg-crimson hover:text-white"
              >
                पत्रकार लगइन
              </a>
              <span className="rounded-sm border border-rule px-3 py-1.5 font-headline text-[13px] font-semibold text-ink-soft">
                डेस्क: सम्पादक@nagarikwatch.com
              </span>
            </div>
          </div>
          <nav aria-label="डेस्क लिंक">
            <p className="mb-3 font-headline text-[12px] font-bold uppercase text-ink-faint">
              डेस्क
            </p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              {[
                ['politics', 'राजनीति'],
                ['society', 'समाज'],
                ['business', 'बजार'],
                ['sports', 'खेलकुद'],
                ['entertainment', 'मनोरञ्जन'],
                ['world', 'विश्व'],
                ['opinion', 'विचार'],
                ['literature', 'साहित्य'],
                ['technology', 'प्रविधि'],
                ['health', 'स्वास्थ्य'],
                ['education', 'शिक्षा'],
                ['diaspora', 'प्रवास'],
              ].map(([s, label]) => (
                <li key={s}>
                  <a href={href(`/${s}`)} className="text-[14px] text-ink-soft hover:text-crimson transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="सेवा र पृष्ठ">
            <p className="mb-3 font-headline text-[12px] font-bold uppercase text-ink-faint">
              सेवा
            </p>
            <ul className="space-y-1.5">
              {[
                ['/patro', 'पात्रो'],
                ['/nepse', 'नेप्से'],
                ['/scores', 'लाइभ स्कोर'],
                ['/rashifal', 'राशिफल'],
                ['/tools', 'उपकरणहरू'],
                ['/province', 'सात प्रदेश'],
                ['/saved', 'सेभ गरिएका'],
                ['/en', 'English Edition'],
              ].map(([s, label]) => (
                <li key={s}>
                  <a href={href(s)} className="text-[14px] text-ink-soft hover:text-crimson transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule py-4">
          <p className="text-[12.5px] text-ink-faint">
            © २०८३ नागरिक वाच · सबै अधिकार सुरक्षित
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {NAV.map(([s, label]) => (
              <li key={s}>
                <a
                  href={href(`/${s}`)}
                  className="text-[12.5px] text-ink-faint hover:text-crimson transition-colors"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
