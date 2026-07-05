import type { SVGProps } from 'react'
import { cn } from '@nagarikwatch/ui'

type LogoMarkProps = SVGProps<SVGSVGElement> & { title: string }

export function LogoMark({ title, className, ...props }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 128 128" role="img" aria-label={title} className={cn('h-10 w-10', className)} {...props}>
      <title>{title}</title>
      <path
        d="M13 70.5C26.8 52.2 43.8 43 64 43s37.2 9.2 51 27.5C100.8 88.9 83.8 98 64 98S27.2 88.9 13 70.5Z"
        fill="var(--brand)"
      />
      <path
        d="M25.4 69.6C36.5 57.5 49.4 51.5 64 51.5s27.5 6 38.6 18.1C91.4 81.8 78.5 87.9 64 87.9s-27.4-6.1-38.6-18.3Z"
        fill="var(--surface)"
      />
      <circle cx="64" cy="70" r="16.5" fill="var(--ink)" />
      <path
        d="M64 53.5c9.1 0 16.5 7.4 16.5 16.5 0 2.6-.6 5-1.7 7.2a19.4 19.4 0 0 1-13.3 5.2c-10.8 0-19.5-8.7-19.5-19.5 0-1 .1-2 .2-3A16.5 16.5 0 0 1 64 53.5Z"
        fill="var(--brand-strong)"
      />
      <circle cx="69.8" cy="63.6" r="4.3" fill="var(--accent-gold)" />
      <path
        d="M19 53.5 39.7 21l10.8 15.1L64.7 8.5 111 53.5H91.5L72.8 32.9 61.7 48.6 51.2 34.3 38.6 53.5H19Z"
        fill="var(--ink)"
      />
      <path
        d="M41.5 48 50 35.3l8.6 11.2L67 29l16.2 19H75L67.6 40l-8.1 15.2-9.2-11.9L45 50.8 41.5 48Z"
        fill="var(--surface-raised)"
      />
      <path
        d="M25 74.5C36.4 84.8 49.4 90 64 90s27.6-5.2 39-15.5"
        fill="none"
        stroke="var(--ink)"
        strokeLinecap="round"
        strokeWidth="4"
        opacity="0.11"
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

export function Logo({ siteName = 'नागरिक वाच', className, markOnly = false, stacked = false }: LogoProps) {
  const siteNameLang = /[A-Za-z]/.test(siteName) ? 'en' : 'ne'

  if (markOnly) return <LogoMark title={`${siteName} / Nagarik Watch`} className={className} />

  return (
    <span className={cn(stacked ? 'flex flex-col items-center gap-1.5' : 'flex items-center gap-3', className)}>
      <LogoMark title={`${siteName} / Nagarik Watch`} className={stacked ? 'h-12 w-12 shrink-0' : 'h-11 w-11 shrink-0'} />
      <span className={cn('flex flex-col leading-none', stacked && 'items-center text-center')}>
        <span className="font-display text-h2 font-extrabold tracking-tight text-ink sm:text-h1" lang={siteNameLang}>
          {siteName}
        </span>
        <span className="mt-0.5 text-[0.58rem] font-black uppercase tracking-[0.22em] text-brand-strong sm:text-caption" lang="en">
          Nagarik Watch
        </span>
        <span className="mt-0.5 hidden text-[0.54rem] font-bold uppercase tracking-[0.18em] text-gold md:block" lang="en">
          Nepali News Portal
        </span>
      </span>
    </span>
  )
}
