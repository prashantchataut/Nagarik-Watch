'use client'

import { useState, useTransition } from 'react'
import type { FormEvent } from 'react'
import { PasswordField } from '@/components/forms/PasswordField'

export function ChangePasswordForm({ locale }: { locale: 'ne' | 'en' }) {
  const ne = locale === 'ne'
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const currentPassword = String(form.get('currentPassword') ?? '')
    const newPassword = String(form.get('newPassword') ?? '')
    const confirmation = String(form.get('confirmation') ?? '')
    if (!currentPassword) {
      setError(ne ? 'हालको पासवर्ड लेख्नुहोस्।' : 'Enter your current password.')
      return
    }
    if (newPassword.length < 8) {
      setError(ne ? 'नयाँ पासवर्ड कम्तीमा ८ अक्षरको हुनुपर्छ।' : 'The new password must be at least 8 characters.')
      return
    }
    if (newPassword === currentPassword) {
      setError(ne ? 'नयाँ पासवर्ड हालको पासवर्डभन्दा फरक हुनुपर्छ।' : 'Choose a password different from the current one.')
      return
    }
    if (newPassword !== confirmation) {
      setError(ne ? 'दुवै नयाँ पासवर्ड उस्तै हुनुपर्छ।' : 'The new passwords must match.')
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ currentPassword, newPassword, revokeOtherSessions: true }),
        })
        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          setError(String(body?.message ?? body?.error?.message ?? (ne ? 'हालको पासवर्ड मिलेन।' : 'Current password is incorrect.')))
          return
        }
        formElement.reset()
        setMessage(ne ? 'पासवर्ड परिवर्तन भयो। अन्य उपकरणका सत्र बन्द गरिएका छन्।' : 'Password updated. Sessions on other devices were revoked.')
      } catch {
        setError(ne ? 'नेटवर्क त्रुटि। फेरि प्रयास गर्नुहोस्।' : 'Network error. Please try again.')
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {message && <div role="status" className="rounded-md border border-rule bg-surface-raised px-4 py-3 text-meta font-semibold text-ink" lang={ne ? 'ne' : 'en'}>{message}</div>}
      {error && <div role="alert" className="rounded-md border border-breaking/30 bg-brand-tint px-4 py-3 text-meta font-semibold text-brand-strong" lang={ne ? 'ne' : 'en'}>{error}</div>}
      <div lang={ne ? 'ne' : 'en'}><PasswordField name="currentPassword" label={ne ? 'हालको पासवर्ड' : 'Current password'} autoComplete="current-password" required disabled={pending} showLabel={ne ? 'देखाउनुहोस्' : 'Show'} hideLabel={ne ? 'लुकाउनुहोस्' : 'Hide'} /></div>
      <div lang={ne ? 'ne' : 'en'}><PasswordField name="newPassword" label={ne ? 'नयाँ पासवर्ड' : 'New password'} autoComplete="new-password" required disabled={pending} showLabel={ne ? 'देखाउनुहोस्' : 'Show'} hideLabel={ne ? 'लुकाउनुहोस्' : 'Hide'} /></div>
      <div lang={ne ? 'ne' : 'en'}><PasswordField name="confirmation" label={ne ? 'नयाँ पासवर्ड फेरि लेख्नुहोस्' : 'Confirm new password'} autoComplete="new-password" required disabled={pending} showLabel={ne ? 'देखाउनुहोस्' : 'Show'} hideLabel={ne ? 'लुकाउनुहोस्' : 'Hide'} /></div>
      <button type="submit" disabled={pending} className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-brand px-5 text-body font-bold text-surface hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60">
        <span lang={ne ? 'ne' : 'en'}>{pending ? (ne ? 'सुरक्षित गर्दै…' : 'Saving…') : (ne ? 'नयाँ पासवर्ड सुरक्षित गर्नुहोस्' : 'Save new password')}</span>
      </button>
    </form>
  )
}
