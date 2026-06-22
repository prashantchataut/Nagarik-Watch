'use client'

import { useState } from 'react'
import type { Locale } from '@nagarikwatch/db'

/**
 * NewsletterInline — footer newsletter capture.
 *
 * Client component because the submit needs optimistic state. Until a real
 * ESP endpoint is wired (NEWSLETTER_PROVIDER / NEWSLETTER_API_KEY in .env), the
 * form validates and shows a success state without persisting — the captured
 * email is not stored anywhere, which is honest and avoids a fake database.
 * When the endpoint lands, swap the `submit` body to POST /api/newsletter;
 * the markup and states are unchanged.
 */
export function NewsletterInline({ locale }: { locale: Locale }) {
  const lang = locale === 'en' ? 'en' : 'ne'
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'done' | 'error'>('idle')

  const labels = {
    heading: locale === 'en' ? 'Daily briefing' : 'दैनिक ब्रिफिङ',
    placeholder: locale === 'en' ? 'you@email.com' : 'तपाईं@इमेल.com',
    button: locale === 'en' ? 'Subscribe' : 'सदस्यता',
    success:
      locale === 'en'
        ? 'Subscribed (demo — no provider wired yet).'
        : 'सदस्यता (नमुना — प्रदायक जोडिएको छैन)।',
    error: locale === 'en' ? 'Enter a valid email.' : 'मान्य इमेल लेख्नुहोस्।',
    privacy:
      locale === 'en' ? 'No spam. Unsubscribe anytime.' : 'स्प्याम छैन। जुनसुकै बेला विद्रोह।',
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    if (!ok) {
      setStatus('error')
      return
    }
    // TODO(newsletter): POST to /api/newsletter once NEWSLETTER_PROVIDER is wired.
    setStatus('done')
    setEmail('')
  }

  return (
    <div>
      <p className="text-meta font-semibold uppercase tracking-wide text-ink-soft" lang={lang}>
        {labels.heading}
      </p>
      <form onSubmit={submit} className="mt-3 flex flex-col gap-2" noValidate>
        <div className="flex gap-2">
          <label htmlFor="nw-newsletter-email" className="sr-only">
            {labels.placeholder}
          </label>
          <input
            id="nw-newsletter-email"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (status !== 'idle') setStatus('idle')
            }}
            placeholder={labels.placeholder}
            className="min-w-0 flex-1 rounded-md border border-rule bg-surface px-3 py-2 text-body text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint"
            aria-invalid={status === 'error'}
            aria-describedby="nw-newsletter-status"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-brand px-4 py-2 text-body font-semibold text-surface-raised transition-colors duration-fast ease-out-quint hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-tint"
            lang={lang}
          >
            {labels.button}
          </button>
        </div>
        <p
          id="nw-newsletter-status"
          className="text-caption text-ink-soft"
          lang={lang}
          aria-live="polite"
        >
          {status === 'done' ? labels.success : status === 'error' ? labels.error : labels.privacy}
        </p>
      </form>
    </div>
  )
}
