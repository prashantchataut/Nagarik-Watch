'use client'

import { useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { cn } from '@nagarikwatch/ui'

type ShareBarProps = {
  url: string
  title: string
  locale: Locale
  className?: string
  articleSlug?: string
  articleCategory?: string
}

/**
 * Inline share affordance (no modal — the brief bans modal-as-first-thought). Three
 * controls: copy-link (clipboard API + a transient "Copied" state announced via
 * aria-live), Facebook share, and X/Twitter share. The social targets open in a small
 * window with noopener/noreferrer. Copy degrades silently when the clipboard API is
 * unavailable (older Safari / insecure context) so the bar never throws.
 */
export function ShareBar({
  url,
  title,
  locale,
  className,
  articleSlug,
  articleCategory,
}: ShareBarProps) {
  const dict = getDictionary(locale)
  const [copied, setCopied] = useState(false)
  const abs = resolveAbsolute(url)

  function trackShare() {
    if (!articleSlug) return
    void import('@/components/ranking/RankingImpression').then(({ trackRankingShare }) => {
      trackRankingShare(articleSlug, articleCategory ?? '')
    })
  }

  async function onCopy() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(abs)
      } else {
        legacyCopy(abs)
      }
      setCopied(true)
      trackShare()
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      legacyCopy(abs)
    }
  }

  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(abs)}`
  const x = `https://twitter.com/intent/tweet?url=${encodeURIComponent(abs)}&text=${encodeURIComponent(title)}`

  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      role="group"
      aria-label={dict.shareLabel}
    >
      <span
        className="mr-1 text-meta font-semibold uppercase tracking-wide text-ink-soft"
        lang={locale === 'en' ? 'en' : 'ne'}
      >
        {dict.shareLabel}
      </span>
      <button
        type="button"
        onClick={onCopy}
        className="article-action-link"
        lang={locale === 'en' ? 'en' : 'ne'}
      >
        <LinkIcon />
        {copied ? dict.shareCopied : dict.shareCopyLink}
      </button>
      <a
        href={fb}
        target="_blank"
        rel="noopener noreferrer"
        className="article-icon-action"
        aria-label={dict.shareFacebook}
        onClick={trackShare}
      >
        <FacebookIcon />
      </a>
      <a
        href={x}
        target="_blank"
        rel="noopener noreferrer"
        className="article-icon-action"
        aria-label={dict.shareTwitter}
        onClick={trackShare}
      >
        <XIcon />
      </a>
      <span aria-live="polite" className="sr-only">
        {copied ? dict.shareCopied : ''}
      </span>
    </div>
  )
}

function resolveAbsolute(url: string): string {
  if (typeof window === 'undefined') return url
  try {
    return new URL(url, window.location.href).toString()
  } catch {
    return url
  }
}

function legacyCopy(text: string) {
  if (typeof document === 'undefined') return
  const ta = document.createElement('textarea')
  ta.value = text
  ta.setAttribute('readonly', '')
  ta.style.position = 'absolute'
  ta.style.left = '-9999px'
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
  } catch {
    // Silent: clipboard unavailable; the button simply won't confirm.
  }
  document.body.removeChild(ta)
}

function LinkIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
