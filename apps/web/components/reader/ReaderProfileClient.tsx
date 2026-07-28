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
      href: localizeHref(locale, '/reader-corner'),
      title: english ? 'Reading desk' : 'पढाइ डेस्क',
      body: english
        ? 'History, recommendations, alerts and preferences in one place.'
        : 'इतिहास, सिफारिस, सूचना र रोजाइ एकै ठाउँमा।',
    },
    {
      href: localizeHref(locale, '/saved'),
      title: english ? 'Saved stories' : 'सुरक्षित समाचार',
      body: english
        ? 'Bookmarks and reads you want to return to.'
        : 'फेरि पढ्न चाहेका बुकमार्क र पढाइ।',
    },
    {
      href: email ? localizeHref(locale, '/auth/change-password') : localizeHref(locale, '/auth/login'),
      title: email
        ? english
          ? 'Password and security'
          : 'पासवर्ड र सुरक्षा'
        : english
          ? 'Sign in'
          : 'लगइन',
      body: email
        ? english
          ? 'Manage sign-in security for this account.'
          : 'यो खाताको लगइन सुरक्षा व्यवस्थापन गर्नुहोस्।'
        : english
          ? 'Optional sign-in for sync across devices.'
          : 'उपकरणबीच सिङ्कका लागि वैकल्पिक लगइन।',
    },
  ]
  if (!email) {
    links.push({
      href: localizeHref(locale, '/auth/signup'),
      title: english ? 'Create account' : 'खाता बनाउनुहोस्',
      body: english ? 'Free. Reading stays open either way.' : 'निःशुल्क। पढाइ सधैं खुला रहन्छ।',
    })
  }

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
            ? 'Your account home for saved stories, reading preferences and device-aware sync.'
            : 'सुरक्षित समाचार, पढाइ रोजाइ र उपकरण-आधारित सिङ्कका लागि तपाईंको खाता गृह।'
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

      <section className="mt-6 border-y border-rule bg-surface-raised px-4 py-5" aria-label={english ? 'Account summary' : 'खाता सारांश'}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-caption font-semibold text-mute">{english ? 'Status' : 'स्थिति'}</p>
            <p className="mt-1 font-display text-h3 text-ink">
              {email ? (english ? 'Signed in' : 'लगइन भएको') : english ? 'Guest device' : 'अतिथि उपकरण'}
            </p>
          </div>
          <div>
            <p className="text-caption font-semibold text-mute">{english ? 'Saved list' : 'सुरक्षित सूची'}</p>
            <p className="mt-1 text-body text-ink-soft">
              {english
                ? 'Bookmarks and reading progress stay available from your desk.'
                : 'बुकमार्क र पढाइ प्रगति तपाईंको डेस्कबाट उपलब्ध रहन्छ।'}
            </p>
          </div>
          <div>
            <p className="text-caption font-semibold text-mute">{english ? 'Sync' : 'सिङ्क'}</p>
            <p className="mt-1 text-body text-ink-soft">
              {email
                ? english
                  ? 'This account can follow you across devices when sync is live.'
                  : 'सिङ्क सक्रिय हुँदा यो खाता उपकरणबीच साथ जान्छ।'
                : english
                  ? 'Sign in if you want your reading desk on more than one device.'
                  : 'धेरै उपकरणमा पढाइ डेस्क चाहिएको हो भने लगइन गर्नुहोस्।'}
            </p>
          </div>
        </div>
      </section>

      <nav className="mt-6 divide-y divide-rule border-y border-rule" aria-label={english ? 'Account links' : 'खाता लिंक'}>
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="grid gap-0.5 py-4 transition-colors duration-fast ease-out-quint hover:bg-brand-tint/30 sm:px-3"
          >
            <span className="font-display text-body-lg font-bold text-ink">{item.title}</span>
            <span className="text-meta text-ink-soft">{item.body}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
