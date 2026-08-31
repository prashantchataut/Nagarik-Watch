'use client'

import { X } from 'lucide-react'
import { useBreaking } from '@/lib/news/breaking-store'

/**
 * Breaking-news strip (तत्काल) — the classic red banner above the masthead.
 * Editors set/clear it from the सम्पादक desk; readers can dismiss it for the
 * current browser session.
 */
export default function BreakingBanner() {
  const { breaking, visible, dismiss } = useBreaking()
  if (!visible || !breaking) return null

  const link = breaking.link
    ? breaking.link.startsWith('#')
      ? breaking.link
      : `#/${breaking.link.replace(/^\/+/, '')}`
    : null

  return (
    <div
      role="region"
      aria-label="तत्काल समाचार"
      className="relative z-40 bg-crimson-deep text-white"
    >
      <div className="mx-auto flex max-w-[1180px] items-center gap-3 px-4 py-2">
        <span className="flex shrink-0 items-center gap-1.5 rounded-sm bg-white px-2 py-0.5 font-headline text-[11.5px] font-extrabold uppercase text-crimson-deep">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-crimson opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-crimson" />
          </span>
          तत्काल
        </span>
        {link ? (
          <a
            href={link}
            className="min-w-0 flex-1 truncate font-headline text-[14.5px] font-bold text-white hover:underline hover:underline-offset-4"
          >
            {breaking.textNe}
          </a>
        ) : (
          <p className="min-w-0 flex-1 truncate font-headline text-[14.5px] font-bold text-white">
            {breaking.textNe}
          </p>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="तत्काल समाचार बन्द गर्नुहोस्"
          className="shrink-0 rounded-sm p-1 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}
