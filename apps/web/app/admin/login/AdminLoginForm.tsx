'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PasswordField } from '@/components/forms/PasswordField'

/**
 * Admin login form. Posts credentials to Better Auth's /api/auth/sign-in/email
 * endpoint, then on success redirects to /admin/dashboard.
 */
export function AdminLoginForm({
  resetComplete = false,
  databaseOnline = true,
  expectedEmails = [],
}: {
  resetComplete?: boolean
  databaseOnline?: boolean
  expectedEmails?: string[]
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    if (!databaseOnline) {
      setError('खाता डाटाबेस अफलाइन छ। DATABASE_URL मिलाएपछि मात्र लगइन सम्भव छ।')
      return
    }
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') ?? '').trim()
    const password = String(form.get('password') ?? '')

    if (!email || !password) {
      setError('कृपया इमेल र पासवर्ड दुवै भर्नुहोस्।')
      return
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/auth/sign-in/email', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          const code = typeof body?.error?.code === 'string' ? body.error.code : ''
          const message = String(body?.message ?? body?.error?.message ?? '')
          if (res.status === 503 || code === 'AUTH_UNAVAILABLE') {
            setError('लगइन उपलब्ध छैन। खाता डाटाबेस पुग्न सकेन।')
            return
          }
          if (res.status === 401 || /not found|invalid password|INVALID/i.test(message + code)) {
            setError(
              expectedEmails.length
                ? `खाता भेटिएन वा पासवर्ड गलत। Vercel का NEWSROOM_* credentials प्रयोग गर्नुहोस् (${expectedEmails.join(' / ')})।`
                : 'खाता भेटिएन वा पासवर्ड गलत। Vercel मा NEWSROOM_SUPERADMIN_EMAIL/PASSWORD जाँच्नुहोस्।',
            )
            return
          }
          setError(message || 'लगइन असफल। पुनः प्रयास गर्नुहोस्।')
          return
        }
        router.refresh()
        router.push('/admin/dashboard')
      } catch {
        setError('नेटवर्क त्रुटि। कृपया पुनः प्रयास गर्नुहोस्।')
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="newsroom-login-form" noValidate>
      {resetComplete ? (
        <div role="status" className="newsroom-login-form__ok">
          पासवर्ड परिवर्तन भयो। नयाँ पासवर्ड प्रयोग गरेर लगइन गर्नुहोस्।
        </div>
      ) : null}
      {error ? (
        <div role="alert" className="newsroom-login-form__error">
          {error}
        </div>
      ) : null}

      <label className="newsroom-login-form__field">
        <span>स्टाफ इमेल</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          disabled={pending || !databaseOnline}
          placeholder={expectedEmails[0]?.replace('***', 'editor') || 'editor@nagarikwatch.com'}
          className="newsroom-login-form__input"
        />
      </label>

      <PasswordField
        name="password"
        label="पासवर्ड"
        autoComplete="current-password"
        required
        disabled={pending || !databaseOnline}
        showLabel="देखाउनुहोस्"
        hideLabel="लुकाउनुहोस्"
      />

      <button type="submit" disabled={pending || !databaseOnline} className="newsroom-login-form__submit">
        {pending ? 'लगइन हुँदै…' : 'न्युजरुम खोल्नुहोस्'}
      </button>
    </form>
  )
}
