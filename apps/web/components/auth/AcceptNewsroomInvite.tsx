'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { signOutRequest } from '@/lib/auth/sign-out-client'

const btnPrimary =
  'inline-flex h-12 items-center justify-center bg-brand px-5 text-body font-bold text-paper hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60'
const btnGhost =
  'inline-flex h-12 items-center justify-center border border-rule px-5 text-body font-bold text-ink hover:border-brand hover:text-brand-strong'

export function AcceptNewsroomInvite({
  locale,
  token,
  signedIn,
}: {
  locale: 'ne' | 'en'
  token: string | null
  signedIn: boolean
}) {
  const ne = locale === 'ne'
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'accepted' | 'error'>(token ? 'idle' : 'error')
  const [message, setMessage] = useState<string | null>(
    token ? null : ne ? 'निमन्त्रणा लिंक अपूर्ण छ।' : 'The invitation link is incomplete.',
  )
  const next = `${ne ? '' : '/en'}/auth/invite?token=${encodeURIComponent(token ?? '')}`

  if (!signedIn) {
    return (
      <div className="grid gap-3" lang={ne ? 'ne' : 'en'}>
        <p className="text-body text-ink-soft">
          {ne
            ? 'निमन्त्रणा स्वीकार गर्न, निमन्त्रणा आएको यही इमेल प्रयोग गरेर खाता बनाउनुहोस् वा लगइन गर्नुहोस्।'
            : 'Sign up or sign in with the same email that received the invitation.'}
        </p>
        <Link
          href={`${ne ? '' : '/en'}/auth/signup?next=${encodeURIComponent(next)}`}
          className={btnPrimary}
        >
          {ne ? 'खाता बनाउनुहोस्' : 'Create account'}
        </Link>
        <Link
          href={`${ne ? '' : '/en'}/auth/login?next=${encodeURIComponent(next)}`}
          className={btnGhost}
        >
          {ne ? 'लगइन गर्नुहोस्' : 'Sign in'}
        </Link>
      </div>
    )
  }

  function accept() {
    if (!token) return
    setMessage(null)
    startTransition(async () => {
      try {
        const response = await fetch('/api/auth/accept-invite', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        const body = await response.json().catch(() => ({}))
        if (!response.ok) {
          const reason = body?.error
          const text =
            reason === 'email_mismatch'
              ? ne
                ? 'तपाईंको लगइन इमेल र निमन्त्रणा इमेल मिलेन।'
                : 'Your signed-in email does not match the invitation.'
              : reason === 'expired'
                ? ne
                  ? 'यो निमन्त्रणा लिंकको म्याद सकिएको छ।'
                  : 'This invitation has expired.'
                : ne
                  ? 'यो निमन्त्रणा मान्य छैन वा पहिले नै प्रयोग भइसकेको छ।'
                  : 'This invitation is invalid or has already been used.'
          setStatus('error')
          setMessage(text)
          return
        }
        await signOutRequest().catch(() => undefined)
        setStatus('accepted')
        setMessage(
          ne
            ? 'निमन्त्रणा स्वीकार भयो। नयाँ भूमिका लागू गर्न फेरि लगइन गर्नुहोस्।'
            : 'Invitation accepted. Sign in again to activate the new role.',
        )
      } catch {
        setStatus('error')
        setMessage(
          ne ? 'नेटवर्क त्रुटि। फेरि प्रयास गर्नुहोस्।' : 'Network error. Please try again.',
        )
      }
    })
  }

  return (
    <div className="grid gap-4" lang={ne ? 'ne' : 'en'}>
      {message ? (
        <div
          role={status === 'error' ? 'alert' : 'status'}
          className={`border px-4 py-3 text-meta font-semibold ${
            status === 'error'
              ? 'border-breaking/30 bg-brand-tint text-brand-strong'
              : 'border-rule bg-surface-raised text-ink'
          }`}
        >
          {message}
        </div>
      ) : null}
      {status === 'accepted' ? (
        <Link href={`${ne ? '' : '/en'}/auth/login?invite=accepted`} className={btnPrimary}>
          {ne ? 'फेरि लगइन गर्नुहोस्' : 'Sign in again'}
        </Link>
      ) : (
        <button type="button" onClick={accept} disabled={pending || !token} className={btnPrimary}>
          {pending
            ? ne
              ? 'स्वीकार हुँदै…'
              : 'Accepting…'
            : ne
              ? 'निमन्त्रणा स्वीकार गर्नुहोस्'
              : 'Accept invitation'}
        </button>
      )}
    </div>
  )
}
