'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { FormEvent } from 'react'
import { PasswordField } from '@/components/forms/PasswordField'

export function PasswordResetForm({
  locale,
  token,
  invalidToken,
  next,
}: {
  locale: 'ne' | 'en'
  token: string | null
  invalidToken: boolean
  next?: string | null
}) {
  const ne = locale === 'ne'
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(
    invalidToken
      ? ne
        ? 'यो लिंक मान्य छैन वा म्याद सकिएको छ।'
        : 'This link is invalid or has expired.'
      : null,
  )

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    const newPassword = String(form.get('newPassword') ?? '')
    const confirmation = String(form.get('confirmation') ?? '')
    if (!token) {
      setError(ne ? 'यो लिंक मान्य छैन वा म्याद सकिएको छ।' : 'This link is invalid or has expired.')
      return
    }
    if (newPassword.length < 8) {
      setError(
        ne ? 'पासवर्ड कम्तीमा ८ अक्षरको हुनुपर्छ।' : 'Password must be at least 8 characters.',
      )
      return
    }
    if (newPassword !== confirmation) {
      setError(ne ? 'दुवै पासवर्ड उस्तै हुनुपर्छ।' : 'The passwords must match.')
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ newPassword, token }),
        })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(String(body?.message ?? body?.error?.message ?? 'reset failed'))
        }
        const destination = safeNext(next) ?? `${ne ? '' : '/en'}/auth/login`
        router.replace(`${destination}${destination.includes('?') ? '&' : '?'}reset=success`)
        router.refresh()
      } catch {
        setError(
          ne
            ? 'लिंकको म्याद सकिएको हुन सक्छ। नयाँ लिंक माग्नुहोस्।'
            : 'The link may have expired. Request a new one.',
        )
      }
    })
  }

  if (!token || invalidToken) {
    return (
      <div className="grid gap-4" lang={ne ? 'ne' : 'en'}>
        <div
          role="alert"
          className="border border-breaking/30 bg-brand-tint px-4 py-3 text-meta font-semibold text-brand-strong"
        >
          {error}
        </div>
        <Link
          href={`${ne ? '' : '/en'}/auth/forgot-password${safeNext(next) ? `?next=${encodeURIComponent(safeNext(next)!)}` : ''}`}
          className="inline-flex h-11 w-full items-center justify-center border border-brand bg-brand px-5 text-body font-bold text-paper hover:bg-brand-strong"
        >
          {ne ? 'नयाँ लिंक माग्नुहोस्' : 'Request a new link'}
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {error && (
        <div
          role="alert"
          className="border border-breaking/30 bg-brand-tint px-4 py-3 text-meta font-semibold text-brand-strong"
          lang={ne ? 'ne' : 'en'}
        >
          {error}
        </div>
      )}
      <div lang={ne ? 'ne' : 'en'}>
        <PasswordField
          name="newPassword"
          label={ne ? 'नयाँ पासवर्ड' : 'New password'}
          autoComplete="new-password"
          required
          disabled={pending}
          showLabel={ne ? 'देखाउनुहोस्' : 'Show'}
          hideLabel={ne ? 'लुकाउनुहोस्' : 'Hide'}
        />
      </div>
      <div lang={ne ? 'ne' : 'en'}>
        <PasswordField
          name="confirmation"
          label={ne ? 'नयाँ पासवर्ड फेरि लेख्नुहोस्' : 'Confirm new password'}
          autoComplete="new-password"
          required
          disabled={pending}
          showLabel={ne ? 'देखाउनुहोस्' : 'Show'}
          hideLabel={ne ? 'लुकाउनुहोस्' : 'Hide'}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex h-11 w-full items-center justify-center border border-brand bg-brand px-5 text-body font-bold text-paper hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span lang={ne ? 'ne' : 'en'}>
          {pending
            ? ne
              ? 'परिवर्तन हुँदै…'
              : 'Updating…'
            : ne
              ? 'पासवर्ड परिवर्तन गर्नुहोस्'
              : 'Update password'}
        </span>
      </button>
    </form>
  )
}

function safeNext(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null
  try {
    const url = new URL(value, 'https://nagarikwatch.local')
    return url.origin === 'https://nagarikwatch.local'
      ? `${url.pathname}${url.search}${url.hash}`
      : null
  } catch {
    return null
  }
}
