import type { SVGProps } from 'react'
import { cn } from '@nagarikwatch/ui'

type LogoMarkProps = SVGProps<SVGSVGElement> & { title: string }

/**
 * Mark direction came from the image-model exploration: an alert eye for watchfulness,
 * a Devanagari-inspired pen stroke for reporting, and a small rising sun for public record.
 * The final asset is hand-cleaned SVG so the wordmark remains sharp and never inherits
 * garbled image text from a generative output.
 */
export function LogoMark({ title, className, ...props }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 128 128"
      role="img"
      aria-label={title}
      className={cn('h-10 w-10', className)}
      {...props}
    >
      <title>{title}</title>
      <rect x="8" y="8" width="112" height="112" rx="28" fill="var(--surface-raised)" />
      <path
        d="M18 65.5C30.5 46.6 46.2 37 65 37s34.7 9.6 47 28.5C99.7 84.4 84 94 65 94S30.5 84.4 18 65.5Z"
        fill="var(--brand)"
      />
      <path
        d="M30.5 65.2C40.2 53.7 51.7 48 65 48s24.8 5.7 34.5 17.2C89.8 76.6 78.3 82.4 65 82.4S40.2 76.6 30.5 65.2Z"
        fill="var(--surface)"
      />
      <circle cx="65" cy="65.5" r="15.5" fill="var(--ink)" />
      <circle cx="70.6" cy="59.9" r="4.1" fill="var(--accent-gold)" />
      <path
        d="M30 35.5C44.3 23.5 62.7 20.5 80.5 27.2c8.6 3.2 15 8.2 19.5 13.3"
        fill="none"
        stroke="var(--ink)"
        strokeLinecap="round"
        strokeWidth="8"
      />
      <path
        d="M33.5 101.5c15.4-8 34.4-11 59.5-4.5"
        fill="none"
        stroke="var(--brand-strong)"
        strokeLinecap="round"
        strokeWidth="7"
      />
      <path
        d="M89 31.5c4.7-7.5 9.6-11.5 14.8-12.3-1 8.6-4.7 15-11.2 19.2"
        fill="none"
        stroke="var(--accent-gold)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="6"
      />
    </svg>
  )
}

type LogoProps = {
  siteName?: string
  className?: string
  markOnly?: boolean
  stacked?: boolean
}

export function Logo({
  siteName = 'नागरिक वाच',
  className,
  markOnly = false,
  stacked = false,
}: LogoProps) {
  const siteNameLang = /[A-Za-z]/.test(siteName) ? 'en' : 'ne'

  if (markOnly) return <LogoMark title={`${siteName} / Nagarik Watch`} className={className} />

  return (
    <span
      className={cn(
        stacked ? 'flex flex-col items-center gap-1.5' : 'flex items-center gap-3',
        className,
      )}
    >
      <LogoMark
        title={`${siteName} / Nagarik Watch`}
        className={stacked ? 'h-12 w-12 shrink-0' : 'h-9 w-9 shrink-0 sm:h-11 sm:w-11'}
      />
      <span className={cn('flex flex-col leading-none', stacked && 'items-center text-center')}>
        <span
          className="font-display text-[1.35rem] font-extrabold tracking-tight text-ink sm:text-h1"
          lang={siteNameLang}
        >
          {siteName}
        </span>
        <span
          className="mt-0.5 text-[0.58rem] font-black uppercase tracking-[0.22em] text-brand-strong sm:text-caption"
          lang="en"
        >
          Nagarik Watch
        </span>
        <span
          className="mt-0.5 hidden text-[0.54rem] font-bold uppercase tracking-[0.18em] text-gold md:block"
          lang="en"
        >
          Public Interest News
        </span>
      </span>
    </span>
  )
}
