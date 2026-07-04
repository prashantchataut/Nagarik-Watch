'use client'

import { useState } from 'react'
import type { Locale } from '@nagarikwatch/db'

type Status = 'idle' | 'submitting' | 'done' | 'error'

export function NewsletterInline({ locale }: { locale: Locale }) {
  const lang = locale === 'en' ? 'en' : 'ne'
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  const labels = {
    heading: locale === 'en' ? 'Daily briefing' : 'दैनिक ब्रिफिङ',
    placeholder: locale === 'en' ? 'you@email.com' : 'तपाईं@इमेल.com',
    button: locale === 'en' ? 'Subscribe' : 'सदस्यता',
    submitting: locale === 'en' ? 'Saving…' : 'सुरक्षित हुँदै…',
    success: locale === 'en' ? 'Check your inbox to confirm the subscription.' : 'सदस्यता पुष्टि गर्न आफ्नो इमेल जाँच्नुहोस्।',
    error: locale === 'en' ? 'Newsletter is unavailable right now.' : 'न्युजलेटर अहिले उपलब्ध छैन।',
    invalid: locale === 'en' ? 'Enter a valid email.' : 'मान्य इमेल लेख्नुहोस्।',
    privacy: locale === 'en' ? 'No spam. Unsubscribe anytime.' : 'स्प्याम हुँदैन। जुनसुकै बेला सदस्यता रद्द गर्न सकिन्छ।',
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    if (!ok) {
      setStatus('error')
      setMessage(labels.invalid)
      return
    }

    setStatus('submitting')
    setMessage(labels.submitting)

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })
      if (!response.ok) throw new Error('subscribe failed')
      setStatus('done')
      setMessage(labels.success)
      setEmail('')
    } catch {
      setStatus('error')
      setMessage(labels.error)
    }
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
              if (status !== 'idle') {
                setStatus('idle')
                setMessage('')
              }
            }}
            placeholder={labels.placeholder}
            className="min-w-0 flex-1 rounded-md border border-rule bg-surface px-3 py-2 text-body text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint"
            aria-invalid={status === 'error'}
            aria-describedby="nw-newsletter-status"
            disabled={status === 'submitting'}
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-brand px-4 py-2 text-body font-semibold text-surface-raised transition-colors duration-fast ease-out-quint hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:opacity-60"
            lang={lang}
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? labels.submitting : labels.button}
          </button>
        </div>
        <p id="nw-newsletter-status" className="text-caption text-ink-soft" lang={lang} aria-live="polite">
          {message || labels.privacy}
        </p>
      </form>
    </div>
  )
}
