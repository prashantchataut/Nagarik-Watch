'use client'

import { useState } from 'react'
import { Bookmark, LogOut, Mail, PenLine, User, X } from 'lucide-react'
import {
  href,
} from '@/lib/news/router'
import {
  initialOf,
  logout,
  readerLogin,
  readerSignup,
  useMe,
} from '@/lib/news/auth-store'
import { useSaved } from '@/lib/news/storage'
import { toDevanagari } from '@/lib/news/patro'

type Mode = 'login' | 'signup' | 'profile'

const inputClass =
  'w-full rounded-sm border border-rule bg-paper px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-faint focus:border-crimson focus:outline-none focus:ring-2 focus:ring-crimson/15'

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-headline text-[13px] font-bold text-ink-soft">{label}</span>
      <input {...props} className={inputClass} />
    </label>
  )
}

/** Reader account drawer — login / signup / profile. Journalist login is a
 *  separate flow at #/journalist by design. */
export default function AccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { me } = useMe()
  const { saved } = useSaved()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterDone, setNewsletterDone] = useState(false)

  if (!open) return null

  const effectiveMode: Mode = me ? 'profile' : mode

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'signup') {
        await readerSignup(name, email, password)
      } else {
        await readerLogin(email, password)
      }
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'त्रुटि भयो।')
    } finally {
      setBusy(false)
    }
  }

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
      /* ignore */
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 no-print"
      role="dialog"
      aria-modal="true"
      aria-label="पाठक खाता"
    >
      <button
        type="button"
        aria-label="बन्द गर्नुहोस्"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto bg-paper shadow-2xl">
        <div className="flex items-center justify-between border-b border-rule px-5 py-4">
          <span className="kicker">पाठक खाता</span>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-sm text-ink hover:bg-crimson-wash"
            aria-label="बन्द गर्नुहोस्"
          >
            <X className="size-5" />
          </button>
        </div>

        {effectiveMode === 'profile' && me && me.kind === 'reader' ? (
          <div className="flex-1 space-y-6 p-5">
            <div className="flex items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-crimson font-headline text-[22px] font-extrabold text-white">
                {initialOf(me.name)}
              </span>
              <div>
                <p className="font-headline text-[20px] font-extrabold text-ink">{me.name}</p>
                <p className="text-[13.5px] text-ink-soft">{me.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="paper-card rounded-sm p-4">
                <p className="font-headline text-[26px] font-extrabold text-crimson">
                  {toDevanagari(saved.length)}
                </p>
                <p className="mt-0.5 text-[12.5px] text-ink-soft">सेभ गरिएका समाचार</p>
              </div>
              <div className="paper-card rounded-sm p-4">
                <p className="font-headline text-[26px] font-extrabold text-ink">साँझ ब्रिफिङ</p>
                <p className="mt-0.5 text-[12.5px] text-ink-soft">दैनिक इमेल सेवा</p>
              </div>
            </div>

            <a
              href={href('/saved')}
              onClick={onClose}
              className="flex items-center justify-between rounded-sm border border-rule px-4 py-3.5 font-headline text-[16px] font-semibold text-ink transition-colors hover:border-crimson hover:text-crimson"
            >
              <span className="flex items-center gap-2.5">
                <Bookmark className="size-4.5 text-crimson" /> सेभ गरिएका सूची हेर्नुहोस्
              </span>
              <span className="text-ink-faint">→</span>
            </a>

            <div className="paper-card rounded-sm p-4">
              <p className="font-headline text-[15px] font-extrabold text-ink">साँझ ब्रिफिङ सदस्यता</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                दिनका मुख्य समाचार र बजार अवस्था साँझ ७ बजे इमेलमा पाउनुहोस्।
              </p>
              {newsletterDone ? (
                <p className="mt-3 rounded-sm bg-market-green/10 px-3 py-2 text-[13.5px] font-semibold text-market-green">
                  सदस्यता दर्ता भयो — धन्यवाद!
                </p>
              ) : (
                <form onSubmit={subscribeNewsletter} className="mt-3 flex gap-2">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="इमेल ठेगाना"
                    className={`${inputClass} flex-1`}
                    aria-label="इमेल ठेगाना"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-sm bg-crimson px-4 font-headline text-[14px] font-bold text-white transition-colors hover:bg-crimson-deep"
                  >
                    सदस्यता
                  </button>
                </form>
              )}
            </div>

            <button
              type="button"
              onClick={async () => {
                await logout()
                onClose()
              }}
              className="flex w-full items-center justify-center gap-2 rounded-sm border border-rule px-4 py-3 font-headline text-[15px] font-semibold text-ink transition-colors hover:border-crimson hover:text-crimson"
            >
              <LogOut className="size-4" /> खाताबाट निस्कनुहोस्
            </button>
          </div>
        ) : (
          <div className="flex-1 p-5">
            <div className="mb-5 grid grid-cols-2 border-b border-rule" role="tablist">
              {(['login', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => {
                    setMode(m)
                    setError(null)
                  }}
                  className={`-mb-px border-b-2 py-3 font-headline text-[15px] font-bold transition-colors ${
                    mode === m
                      ? 'border-crimson text-crimson'
                      : 'border-transparent text-ink-soft hover:text-ink'
                  }`}
                >
                  {m === 'login' ? 'लगइन' : 'नयाँ खाता'}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mode === 'signup' && (
                <Field
                  label="पूरा नाम"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  minLength={2}
                />
              )}
              <Field
                label="इमेल"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <Field
                label="पासवर्ड (कम्तीमा ६ अक्षर)"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                minLength={6}
              />
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
                {busy ? 'केही क्षण…' : mode === 'signup' ? 'खाता बनाउनुहोस्' : 'लगइन गर्नुहोस्'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3 text-[12px] text-ink-faint">
              <span className="h-px flex-1 bg-rule" /> वा <span className="h-px flex-1 bg-rule" />
            </div>

            <a
              href={href('/journalist')}
              onClick={onClose}
              className="flex items-center justify-between rounded-sm border border-crimson/50 px-4 py-3.5 transition-colors hover:bg-crimson-wash"
            >
              <span className="flex items-center gap-2.5">
                <PenLine className="size-5 text-crimson" />
                <span>
                  <span className="block font-headline text-[15px] font-bold text-ink">
                    पत्रकार लगइन
                  </span>
                  <span className="block text-[12px] text-ink-soft">
                    समाचार कक्ष प्रवेश — पाठक खाताभन्दा फरक
                  </span>
                </span>
              </span>
              <span className="text-crimson">→</span>
            </a>

            <p className="mt-6 flex items-start gap-2 text-[12px] leading-relaxed text-ink-faint">
              <Mail className="mt-0.5 size-3.5 shrink-0" />
              खाता बनाए समाचार सेभ गर्ने, मत दिने र साँझ ब्रिफिङ पाउने सुविधा उपलब्ध हुन्छ। पाठक र
              पत्रकार खाता पूर्ण रूपमा छुट्टै प्रणालीमा राखिन्छ।
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/** Small account chip for the masthead: greeting avatar when signed in,
 *  generic user icon when signed out. */
export function AccountChip({ onOpen }: { onOpen: () => void }) {
  const { me } = useMe()
  if (me) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="flex items-center gap-2 rounded-sm border border-rule py-1.5 pl-1.5 pr-3 transition-colors hover:border-crimson"
        aria-label={`${me.name} — खाता`}
      >
        <span className="grid size-8 place-items-center rounded-full bg-crimson font-headline text-[14px] font-extrabold text-white">
          {initialOf(me.name)}
        </span>
        <span className="hidden font-headline text-[14px] font-semibold text-ink lg:inline">
          {me.name.split(' ')[0]}
        </span>
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex items-center gap-2 rounded-sm border border-rule px-3 py-2 font-headline text-[14px] font-bold text-ink transition-colors hover:border-crimson hover:text-crimson"
      aria-label="लगइन वा खाता खोल्नुहोस्"
    >
      <User className="size-4.5" />
      <span className="hidden sm:inline">लगइन</span>
    </button>
  )
}
