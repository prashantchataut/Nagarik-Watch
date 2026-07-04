import type { SVGProps } from 'react'
import { cn } from '@nagarikwatch/ui'

/**
 * Nagarik Watch logo mark — "The Civic Watchtower".
 A shield-shaped crimson badge with a watchtower + arched window (the eye) +
 battlement merlons + gold flag pennant. Ownable, serious-news, no tabloid.
 */
type LogoMarkProps = SVGProps<SVGSVGElement> & { title: string }

export function LogoMark({ title, className, ...props }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 48 48" role="img" aria-label={title} className={cn('h-10 w-10', className)} {...props}>
      <title>{title}</title>
      <path d="M24 2 L44 7 L44 26 Q44 38 24 46 Q4 38 4 26 L4 7 Z" fill="var(--brand)" />
      <path d="M24 2 L44 7 L44 18 Q24 12 4 18 L4 7 Z" fill="#ffffff" opacity="0.06" />
      <g transform="translate(14 11)">
        <rect x="2" y="8" width="16" height="18" rx="1.5" fill="var(--surface-raised)" opacity="0.96" />
        <rect x="2" y="5" width="3" height="4" rx="0.5" fill="var(--surface-raised)" opacity="0.96" />
        <rect x="8.5" y="5" width="3" height="4" rx="0.5" fill="var(--surface-raised)" opacity="0.96" />
        <rect x="15" y="5" width="3" height="4" rx="0.5" fill="var(--surface-raised)" opacity="0.96" />
        <path d="M5 14 Q10 10 15 14 L15 22 L5 22 Z" fill="var(--brand-strong)" />
        <circle cx="10" cy="16" r="1.8" fill="var(--accent-gold)" />
        <rect x="8" y="20" width="4" height="6" rx="0.5" fill="var(--brand)" opacity="0.5" />
      </g>
      <path d="M24 8 L24 4 L29 5.5 L26.5 7 L29 8.5 L24 7.5 Z" fill="var(--accent-gold)" />
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
  if (markOnly) return <LogoMark title={`${siteName} / Nagarik Watch`} className={className} />
  return (
    <span className={cn(stacked ? 'flex flex-col items-center gap-1' : 'flex items-center gap-2.5', className)}>
      <LogoMark title={`${siteName} / Nagarik Watch`} className={stacked ? 'h-12 w-12 shrink-0' : 'h-11 w-11 shrink-0'} />
      <span className={cn('flex flex-col leading-none', stacked && 'items-center')}>
        <span className="font-display text-h1 font-extrabold tracking-tight text-ink" lang="ne">{siteName}</span>
        <span className="mt-0.5 text-meta font-semibold uppercase tracking-[0.14em] text-mute" lang="en">Nagarik Watch</span>
      </span>
    </span>
  )
}
