import type { SVGProps } from 'react'
import { cn } from '@nagarikwatch/ui'

/**
 * Nagarik Watch logo mark.
 *
 * A crimson badge with an almond eye. Inside the eye, the iris is formed by
 * three Himalayan mountain peaks — the tallest peak carries a gold dot (the
 * pupil). One mark, two readings:
 *   - From far: an eye (vigilance, the "watch")
 *   - Up close: mountains inside the eye (Nepal, the Himalayas)
 * The gold dot at the apex ties both readings together: it is both the eye's
 * pupil and the mountain's summit star.
 *
 * No shield, no battlement, no flag. A typographic-symbolic composite that is
 * ownable because no other Nepali portal fuses mountain-into-eye.
 *
 * Colours: Civic Crimson (badge + mountain iris), warm white (sclera), gold
 * (pupil/summit). The gold is the reserved accent — identity + breaking only.
 */

type LogoMarkProps = SVGProps<SVGSVGElement> & { title: string }

export function LogoMark({ title, className, ...props }: LogoMarkProps) {
  return (
    <svg viewBox="0 0 48 48" role="img" aria-label={title} className={cn('h-10 w-10', className)} {...props}>
      <title>{title}</title>
      {/* Crimson badge */}
      <rect x="3" y="3" width="42" height="42" rx="7" fill="var(--brand)" />
      {/* White almond eye — the sclera */}
      <path d="M8 24 Q24 10 40 24 Q24 38 8 24 Z" fill="var(--surface-raised)" />
      {/*
        Mountain peaks as the iris. Three peaks (left, centre-tallest, right)
        drawn as a single filled polygon in crimson, so the mountains read as
        negative space cut from the white eye. The base sits at y=29, the
        tallest peak reaches y=15.
      */}
      <path d="M14 29 L19 20 L22 25 L25 14 L28 24 L31 20 L36 29 Z" fill="var(--brand)" />
      {/*
        Gold dot at the tallest peak's apex — the pupil / summit star. This is
        the single point where the eye and mountain readings converge.
      */}
      <circle cx="25" cy="16" r="2" fill="var(--accent-gold)" />
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
