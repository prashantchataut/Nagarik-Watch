import type { SVGProps } from 'react'
import { cn } from '@nagarikwatch/ui'

/**
 * Nagarik Watch logo mark.
 *
 * A crimson square (the civic badge) with a single almond eye in the centre.
 * The eye is the "watch" in the name — vigilance, the civic gaze. The iris
 * is gold (the reserved accent), the pupil is ink. One mark, one meaning,
 * one colour pair. No shield, no battlement, no flag — those were AI-slop
 * literalism. This is a typographic-symbolic decision: an eye on red.
 *
 * The wordmark pairs the Devanagari primary (Mukta ExtraBold) with a
 * tracked-out Latin secondary (Inter, uppercase, wide tracking).
 */

type LogoMarkProps = SVGProps<SVGSVGElement> & { title: string }

export function LogoMark({ title, className, ...props }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 48 48" role="img" aria-label={title} className={cn('h-10 w-10', className)} {...props}>
      <title>{title}</title>
      {/* Crimson square — the civic badge. Slight radius for modernity. */}
      <rect x="3" y="3" width="42" height="42" rx="7" fill="var(--brand)" />
      {/*
        The eye. An almond shape (two mirrored quadratic curves) centred on
        the badge. The white (surface-raised) sclara, the gold iris, the ink
        pupil. The eye looks forward — alert, watchful, civic.
      */}
      {/* Sclara — the almond eye shape */}
      <path d="M10 24 Q24 13 38 24 Q24 35 10 24 Z" fill="var(--surface-raised)" />
      {/* Iris — gold, the reserved accent colour */}
      <circle cx="24" cy="24" r="6.5" fill="var(--accent-gold)" />
      {/* Pupil — ink, offset upward to read as alert/looking forward */}
      <circle cx="24" cy="23" r="3.2" fill="var(--ink)" />
      {/* Catchlight — a tiny surface dot that gives the eye life */}
      <circle cx="25.5" cy="21.5" r="1" fill="var(--surface-raised)" />
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
      <LogoMark title={`${siteName} / Nagarik Watch`} className={stacked ? 'h-11 w-11 shrink-0' : 'h-10 w-10 shrink-0'} />
      <span className={cn('flex flex-col leading-none', stacked && 'items-center text-center')}>
        <span className="font-display text-h1 font-extrabold tracking-tight text-ink" lang="ne">
          {siteName}
        </span>
        <span className="mt-0.5 text-[0.625rem] font-bold uppercase tracking-[0.2em] text-mute sm:text-meta" lang="en">
          Nagarik Watch
        </span>
      </span>
    </span>
  )
}
