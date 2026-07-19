'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import type { FormEvent } from 'react'

export function PasswordResetRequestForm({ locale, next }: { locale: 'ne' | 'en'; next?: string | null }) {
  const ne = locale === 'ne'
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const safeReturn = safeNext(next)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email') ?? '').trim().toLowerCase()
    if (!email) {
      setError(ne ? 'कृपया आफ्नो इमेल ठेगाना लेख्नुहोस्।' : 'Please enter your email address.')
      return
    }

    startTransition(async () => {
      try {
        const resetPath = `${ne ? '' : '/en'}/auth/reset-password`
        const resetUrl = new URL(resetPath, window.location.origin)
        if (safeReturn) resetUrl.searchParams.set('next', safeReturn)
        const response = await fetch('/api/auth/request-password-reset', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, redirectTo: resetUrl.toString() }),
        })
        if (!response.ok) throw new Error('request failed')
        setMessage(
          ne
            ? 'यो इमेलसँग खाता दर्ता भएको छ भने, केही मिनेटभित्र सुरक्षित लिंक पठाइनेछ। स्पाम फोल्डर पनि जाँच्नुहोस्।'
            : 'If an account exists for this email, a secure link will arrive within a few minutes. Check your spam folder too.',
        )
      } catch {
        setError(
          ne
            ? 'अहिले अनुरोध पूरा गर्न सकिएन। केही बेरपछि फेरि प्रयास गर्नुहोस्।'
            : 'We could not complete the request right now. Please try again shortly.',
        )
      }
    })
  }

  const loginHref = safeReturn === '/admin/login'
    ? '/admin/login'
    : `${ne ? '' : '/en'}/auth/login${safeReturn ? `?next=${encodeURIComponent(safeReturn)}` : ''}`

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {message && (
        <div role="status" className="rounded-md border border-rule bg-surface-raised px-4 py-3 text-meta font-semibold text-ink" lang={ne ? 'ne' : 'en'}>{message}</div>
      )}
      {error && (
        <div role="alert" className="rounded-md border border-breaking/30 bg-brand-tint px-4 py-3 text-meta font-semibold text-brand-strong" lang={ne ? 'ne' : 'en'}>{error}</div>
      )}
      <label className="grid gap-1.5 text-meta font-semibold text-ink" lang={ne ? 'ne' : 'en'}>
        {ne ? 'खातामा प्रयोग भएको इमेल' : 'Account email'}
        <input name="email" type="email" autoComplete="email" required disabled={pending} placeholder="you@example.com" className="rounded-md border border-rule bg-surface px-3.5 py-2.5 text-body text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:opacity-60" />
      </label>
      <button type="submit" disabled={pending} className="mt-2 inline-flex h-11 w-full items-center justify-center border border-brand bg-brand px-5 text-body font-bold text-surface transition-colors duration-fast ease-out-quint hover:bg-brand-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-60">
        <span lang={ne ? 'ne' : 'en'}>{pending ? (ne ? 'पठाउँदै…' : 'Sending…') : (ne ? 'सुरक्षित लिंक पठाउनुहोस्' : 'Send secure link')}</span>
      </button>
      <Link href={loginHref} className="text-center text-caption font-semibold text-brand underline-offset-2 hover:underline" lang={ne ? 'ne' : 'en'}>{ne ? 'लगइनमा फर्कनुहोस्' : 'Back to sign in'}</Link>
    </form>
  )
}

function safeNext(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null
  try {
    const url = new URL(value, 'https://nagarikwatch.local')
    return url.origin === 'https://nagarikwatch.local' ? `${url.pathname}${url.search}${url.hash}` : null
  } catch {
    return null
  }
}
