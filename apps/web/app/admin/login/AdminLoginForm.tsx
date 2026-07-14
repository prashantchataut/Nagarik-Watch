'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PasswordField } from '@/components/forms/PasswordField'

/**
 * Admin login form. Posts credentials to Better Auth's /api/auth/sign-in/email
 * endpoint, then on success redirects to /admin/dashboard. Errors are surfaced
 * inline (no alert() — impeccable UX). Loading state disables the submit
 * button and swaps its label so the click is acknowledged.
 *
 * Password recovery uses the same audited Better Auth reset flow as readers;
 * newsroom roles are preserved because only the credential is replaced.
 */
export function AdminLoginForm({ resetComplete = false }: { resetComplete?: boolean }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
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
          const msg =
            body?.message ??
            body?.error?.message ??
            'इमेल वा पासवर्ड मेल खाएन। कृपया पुनः प्रयास गर्नुहोस्।'
          setError(String(msg))
          return
        }
        // Force a fresh server render so the session cookie is read.
        router.refresh()
        router.push('/admin/dashboard')
      } catch {
        setError('नेटवर्क त्रुटि। कृपया पुनः प्रयास गर्नुहोस्।')
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      {resetComplete ? (
        <div role="status" className="rounded-md border border-rule bg-surface-raised px-4 py-3 text-meta font-semibold text-ink" lang="ne">
          पासवर्ड परिवर्तन भयो। नयाँ पासवर्ड प्रयोग गरेर लगइन गर्नुहोस्।
        </div>
      ) : null}
      {error && (
        <div
          role="alert"
          className="rounded-md border border-breaking/30 bg-brand-tint px-4 py-3 text-meta font-semibold text-brand-strong"
          lang="ne"
        >
          {error}
        </div>
      )}

      <label className="grid gap-1.5 text-meta font-semibold text-ink" lang="ne">
        इमेल
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={pending}
          placeholder="editor@nagarikwatch.com"
          className="rounded-md border border-rule bg-surface px-3.5 py-2.5 text-body text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:opacity-60"
        />
      </label>

      <div lang="ne">
        <PasswordField
          name="password"
          label="पासवर्ड"
          autoComplete="current-password"
          required
          disabled={pending}
          showLabel="देखाउनुहोस्"
          hideLabel="लुकाउनुहोस्"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex h-12 items-center justify-center rounded-full bg-brand px-5 text-body font-bold text-surface transition-colors duration-fast ease-out-quint hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-tint focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? (
          <span className="flex items-center gap-2" lang="ne">
            <Spinner /> लगइन हुँदै…
          </span>
        ) : (
          <span lang="ne">साइन इन गर्नुहोस्</span>
        )}
      </button>

      <div className="mt-1 flex items-center justify-between text-caption">
        <Link
          href="/auth/forgot-password?next=%2Fadmin%2Flogin"
          className="text-ink-soft underline-offset-2 hover:text-brand-strong hover:underline"
          lang="ne"
        >
          पासवर्ड भुल्नुभयो?
        </Link>
        <span className="text-mute" lang="ne">
          स्टाफ खाता मालिकले मात्र बनाउँछ
        </span>
      </div>
    </form>
  )
}

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}
