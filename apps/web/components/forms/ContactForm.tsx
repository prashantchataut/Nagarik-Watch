'use client'

import { useState, useTransition, type FormEvent } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { TurnstileField } from './TurnstileField'

export function ContactForm({ locale }: { locale: Locale }) {
  const [state, setState] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()
  const english = locale === 'en'

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setState('idle')
    setMessage('')
    startTransition(async () => {
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: data.get('name'),
            email: data.get('email'),
            subject: data.get('subject'),
            message: data.get('message'),
            website: data.get('website'),
            turnstileToken: data.get('cf-turnstile-response'),
            locale,
          }),
        })
        const body = (await response.json()) as { error?: string }
        if (!response.ok) throw new Error(body.error || 'Request failed')
        form.reset()
        setState('success')
        setMessage(
          english
            ? 'Your message has been stored for newsroom review.'
            : 'तपाईंको सन्देश न्युजरुम समीक्षाका लागि सुरक्षित भयो।',
        )
      } catch (error) {
        setState('error')
        setMessage(
          error instanceof Error
            ? error.message
            : english
              ? 'The message could not be sent.'
              : 'सन्देश पठाउन सकिएन।',
        )
      }
    })
  }

  const field =
    'mt-1 w-full rounded-md border border-rule bg-surface px-3.5 py-2.5 text-body text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:opacity-60'

  return (
    <form onSubmit={submit} className="grid gap-4" noValidate lang={english ? 'en' : 'ne'}>
      <div className="absolute -left-[10000px]" aria-hidden="true">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-meta font-semibold text-ink">
          {english ? 'Name' : 'नाम'} *
          <input name="name" required maxLength={120} autoComplete="name" disabled={pending} className={field} />
        </label>
        <label className="text-meta font-semibold text-ink">
          {english ? 'Email' : 'इमेल'} *
          <input name="email" type="email" required maxLength={254} autoComplete="email" disabled={pending} className={field} />
        </label>
      </div>
      <label className="text-meta font-semibold text-ink">
        {english ? 'Subject' : 'विषय'} *
        <input name="subject" required maxLength={180} disabled={pending} className={field} />
      </label>
      <label className="text-meta font-semibold text-ink">
        {english ? 'Message' : 'सन्देश'} *
        <textarea name="message" required rows={7} maxLength={5000} disabled={pending} className={field} />
      </label>
      <TurnstileField siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
      {message ? (
        <p
          role={state === 'error' ? 'alert' : 'status'}
          className={`rounded-md border px-4 py-3 text-meta font-semibold ${state === 'error' ? 'border-breaking/30 bg-brand-tint text-brand-strong' : 'border-rule bg-surface text-ink-soft'}`}
        >
          {message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-11 w-fit items-center justify-center rounded-full bg-brand px-6 text-body font-bold text-surface hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-tint focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
      >
        {pending
          ? english ? 'Sending…' : 'पठाउँदै…'
          : english ? 'Send to newsroom' : 'न्युजरुममा पठाउनुहोस्'}
      </button>
      <p className="text-caption leading-relaxed text-mute">
        {english
          ? 'Do not send passwords, banking credentials or material that could put a source at immediate risk. Use the newsroom email to request a safer channel for sensitive evidence.'
          : 'पासवर्ड, बैंकिङ विवरण वा स्रोतलाई तत्काल जोखिममा पार्ने सामग्री नपठाउनुहोस्। संवेदनशील प्रमाणका लागि सुरक्षित च्यानल माग्न न्युजरुम इमेल प्रयोग गर्नुहोस्।'}
      </p>
    </form>
  )
}
