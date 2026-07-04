import type { SVGProps } from 'react'
import { cn } from '@nagarikwatch/ui'

type LogoMarkProps = SVGProps<SVGSVGElement> & { title: string }

export function LogoMark({ title, className, ...props }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 96 96" role="img" aria-label={title} className={cn('h-10 w-10', className)} {...props}>
      <title>{title}</title>
      <path d="M12 48 28 22l8 13 13-24 35 37H72L61 32l-9 12-8-13-12 17H12Z" fill="var(--ink)" />
      <path d="M30 42 36 33l5 8 8-16 9 17-8-7-7 13-7-9-5 7-1-4Z" fill="var(--surface)" opacity="0.95" />
      <path d="M9 58c13-12 26-18 39-18s26 6 39 18C74 74 61 82 48 82S22 74 9 58Z" fill="var(--brand)" />
      <path d="M18 57c10-8 20-12 30-12s20 4 30 12C68 67 58 72 48 72S28 67 18 57Z" fill="var(--surface-raised)" />
      <circle cx="48" cy="58" r="12" fill="var(--ink)" />
      <path d="M48 46c6 0 11 5 11 12 0 2-.4 4-1.4 5.7A12 12 0 0 1 43 47.1c1.5-.7 3.2-1.1 5-1.1Z" fill="var(--brand-strong)" />
      <circle cx="53" cy="53" r="3.4" fill="var(--accent-gold)" />
      <path d="M15 60c10 9 21 13.5 33 13.5S71 69 81 60" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" opacity="0.16" />
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
