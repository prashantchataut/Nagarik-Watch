'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Admin login form. Posts credentials to Better Auth's /api/auth/sign-in/email
 * endpoint, then on success redirects to /admin/dashboard. Errors are surfaced
 * inline (no alert() — impeccable UX). Loading state disables the submit
 * button and swaps its label so the click is acknowledged.
 *
 * The "Forgot password?" link points at a mailto: because the self-serve
 * reset flow is Phase 3. Solo founders can reset via the env var directly.
 */
export function AdminLoginForm() {
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

      <label className="grid gap-1.5 text-meta font-semibold text-ink" lang="ne">
        पासवर्ड
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={pending}
          placeholder="••••••••"
          className="rounded-md border border-rule bg-surface px-3.5 py-2.5 text-body text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint disabled:opacity-60"
        />
      </label>

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
        <a
          href="mailto:contact@nagarikwatch.com?subject=Newsroom%20password%20reset"
          className="text-ink-soft underline-offset-2 hover:text-brand-strong hover:underline"
          lang="ne"
        >
          पासवर्ड भुल्नुभयो?
        </a>
        <a
          href="/auth/signup"
          className="font-semibold text-brand underline-offset-2 hover:underline"
          lang="ne"
        >
          नयाँ खाता बनाउनुहोस्
        </a>
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
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
