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
  /** Compact icon-first row for article footers. */
  variant?: 'default' | 'compact'
}

export function ShareBar({
  url,
  title,
  locale,
  className,
  articleSlug,
  articleCategory,
  variant = 'default',
}: ShareBarProps) {
  const dict = getDictionary(locale)
  const [copied, setCopied] = useState(false)
  const abs = resolveAbsolute(url)
  const compact = variant === 'compact'
  const isEn = locale === 'en'

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

  async function onNativeShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url: abs })
        trackShare()
        return
      } catch {
        // User cancelled or unsupported
      }
    }
    onCopy()
  }

  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(abs)}`
  const x = `https://twitter.com/intent/tweet?url=${encodeURIComponent(abs)}&text=${encodeURIComponent(title)}`
  const whatsapp = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title} ${abs}`)}`

  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      role="group"
      aria-label={dict.shareLabel}
    >
      <span className="mr-1 text-caption font-extrabold text-ink-soft" lang={isEn ? 'en' : 'ne'}>
        {isEn ? 'Share Story:' : 'सेयर गर्नुहोस्:'}
      </span>

      {/* Facebook */}
      <a
        href={fb}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 items-center gap-1.5 rounded bg-[#1877F2] px-3 text-caption font-bold text-white transition-opacity hover:opacity-90 active:scale-95"
        aria-label={dict.shareFacebook}
        onClick={trackShare}
      >
        <FacebookIcon />
        {!compact ? <span>Facebook</span> : null}
      </a>

      {/* X / Twitter */}
      <a
        href={x}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 items-center gap-1.5 rounded bg-black px-3 text-caption font-bold text-white transition-opacity hover:opacity-90 active:scale-95 dark:bg-surface-raised dark:border dark:border-rule"
        aria-label={dict.shareTwitter}
        onClick={trackShare}
      >
        <XIcon />
        {!compact ? <span>X</span> : null}
      </a>

      {/* WhatsApp */}
      <a
        href={whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-9 items-center gap-1.5 rounded bg-[#25D366] px-3 text-caption font-bold text-white transition-opacity hover:opacity-90 active:scale-95"
        aria-label="Share on WhatsApp"
        onClick={trackShare}
      >
        <WhatsAppIcon />
        {!compact ? <span>WhatsApp</span> : null}
      </a>

      {/* Copy / Share Button */}
      <button
        type="button"
        onClick={onNativeShare}
        className="inline-flex h-9 items-center gap-1.5 rounded border border-rule bg-surface px-3 text-caption font-bold text-ink transition-all hover:border-brand hover:bg-brand-tint hover:text-brand-strong active:scale-95"
        lang={isEn ? 'en' : 'ne'}
      >
        <LinkIcon />
        <span>
          {copied ? (isEn ? 'Copied!' : 'लिंक लिइयो!') : isEn ? 'Copy Link' : 'लिंक प्रतिलिपि'}
        </span>
      </button>

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
    /* clipboard unavailable */
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

function WhatsAppIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M17.472 14.382c-.301-.15-1.782-.879-2.058-.98-.276-.1-.477-.15-.678.15-.2.3-.778.98-.954 1.18-.176.2-.351.226-.652.075-.301-.15-1.272-.469-2.423-1.496-.896-.799-1.5-1.787-1.677-2.088-.175-.3-.019-.463.132-.612.136-.135.301-.35.452-.525.15-.176.2-.3.301-.5.1-.2.05-.376-.025-.526-.076-.15-.678-1.634-.93-2.24-.245-.59-.493-.51-.678-.52l-.578-.01c-.2 0-.527.075-.803.376s-1.054 1.03-1.054 2.511 1.08 2.912 1.23 3.113c.15.201 2.124 3.243 5.145 4.548.719.31 1.28.496 1.718.636.722.23 1.378.197 1.9.12.58-.087 1.782-.728 2.033-1.431.251-.703.251-1.306.176-1.431-.076-.125-.276-.201-.577-.351zM12.04 21.75c-1.748 0-3.46-.46-4.966-1.332l-.356-.207-3.693.968.985-3.6-.228-.363a9.71 9.71 0 0 1-1.492-5.166c0-5.385 4.38-9.765 9.766-9.765a9.71 9.71 0 0 1 6.905 2.862 9.71 9.71 0 0 1 2.86 6.903c0 5.386-4.38 9.766-9.765 9.766z" />
    </svg>
  )
}
