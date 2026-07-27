'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { HubIndexHeader } from '@/components/HubIndexHeader'

type SessionPayload = {
  user?: { email?: string; name?: string | null }
}

/**
 * Static-friendly profile: tries live session API when present; otherwise
 * offers sign-in and always links to device bookmarks.
 */
export function ReaderProfileClient({ locale }: { locale: Locale }) {
  const english = locale === 'en'
  const lang = english ? 'en' : 'ne'
  const [email, setEmail] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/auth/get-session', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return null
        return (await response.json()) as SessionPayload
      })
      .then((body) => {
        if (cancelled) return
        setEmail(body?.user?.email?.trim() || null)
      })
      .catch(() => {
        if (!cancelled) setEmail(null)
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const links = [
    {
      href: localizeHref(locale, '/saved'),
      title: english ? 'Saved stories' : 'सुरक्षित समाचार',
      body: english ? 'Bookmarks kept on this device.' : 'यस उपकरणमा सुरक्षित गरिएका समाचार।',
    },
    {
      href: localizeHref(locale, '/auth/login'),
      title: english ? 'Sign in' : 'लगइन',
      body: english
        ? 'Optional account for syncing across devices.'
        : 'उपकरणबीच सिंक गर्न वैकल्पिक खाता।',
    },
    {
      href: localizeHref(locale, '/auth/signup'),
      title: english ? 'Create account' : 'खाता बनाउनुहोस्',
      body: english ? 'Free. Reading stays open either way.' : 'निःशुल्क। पढाइ सधैं खुला रहन्छ।',
    },
  ]

  const statusLine = !ready
    ? english
      ? 'Loading…'
      : 'लोड हुँदै…'
    : email
      ? email
      : english
        ? 'Browsing as guest on this device'
        : 'यस उपकरणमा अतिथिका रूपमा'

  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:py-10" lang={lang}>
      <HubIndexHeader
        title={english ? 'Account' : 'खाता'}
        lead={
          english
            ? 'Saved stories stay on this device. Sign in when account sync is available.'
            : 'सुरक्षित समाचार यस उपकरणमा रहन्छ। खाता सिंक उपलब्ध हुँदा लगइन गर्नुहोस्।'
        }
        lang={lang}
      />

      <p className="mt-4 text-meta font-semibold text-ink-soft">{statusLine}</p>

      {!email && ready ? (
        <p
          className="mt-3 border border-rule bg-surface-raised px-3 py-2 text-meta leading-relaxed text-ink-soft"
          role="status"
        >
          {english
            ? 'You can save stories on this device without an account.'
            : 'खाता बिना पनि यस उपकरणमा समाचार सुरक्षित गर्न सकिन्छ।'}
        </p>
      ) : null}

      <nav className="mt-6 divide-y divide-rule border-y border-rule" aria-label={english ? 'Account links' : 'खाता लिंक'}>
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="grid gap-0.5 py-4 transition-colors duration-fast ease-out-quint hover:bg-brand-tint/30 sm:px-2"
          >
            <span className="font-display text-body-lg font-bold text-ink">{item.title}</span>
            <span className="text-meta text-ink-soft">{item.body}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
