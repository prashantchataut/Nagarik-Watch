import type { SVGProps } from 'react'
import { cn } from '@nagarikwatch/ui'

/**
 * Nagarik Watch logo mark. A rounded crimson badge containing a mark that fuses Nepal's
 * non-rectangular double-pendant flag silhouette with a watchful eye. The "Watch" in the
 * brand name is vigilance, so the eye carries the meaning; the pendant shape carries the
 * national identity (no other flag is a non-rectangular double-pendulum). One ownable mark.
 *
 * Pure inline SVG so it scales crisply from favicon to masthead with no raster assets.
 * `currentColor` is unused on purpose: the mark colors are semantic (brand badge, warm
 * face, ink pupil, gold iris accent) and should not follow surrounding text color.
 *
 * Accessibility: the bare mark is decorative when paired with the visible wordmark, so
 * the default is aria-hidden + role="img" with a <title>. Pass an `aria-label` to make it
 * the lone label (e.g. the favicon-shaped footer mark with no adjacent text).
 */

type LogoMarkProps = SVGProps<SVGSVGElement> & {
  /** Title rendered into <title> for SR + tooltip. Required for accessibility. */
  title: string
}

export function LogoMark({ title, className, ...props }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
      className={cn('h-10 w-10', className)}
      {...props}
    >
      <title>{title}</title>
      {/* Rounded badge container — moderate radius, brand fill. */}
      <rect x="2" y="2" width="44" height="44" rx="12" fill="var(--brand)" />
      {/* Subtle top sheen for depth without glassmorphism. */}
      <rect x="2" y="2" width="44" height="22" rx="12" fill="#ffffff" opacity="0.06" />

      {/*
        The pendant-eye mark, drawn within a 28×28 box centered on the badge.
        Outer almond eye shape traces Nepal's double-pendant silhouette: the upper edge
        steps down then jogs back up (the flag's two stacked pennants). It doubles as an
        eye — the watchful gaze. The warm face sits on the crimson badge.
      */}
      <g transform="translate(10 10)">
        {/* Eye / pendant body, warm cream on crimson. */}
        <path
          d="M14 2 L26 2 L26 9 L22 9 L22 14 L14 14 Z"
          fill="var(--surface-raised)"
          opacity="0.96"
        />
        {/* Lower lash line — grounds the eye, adds the "watching" weight at the base. */}
        <path d="M2 14 L14 14 L22 14 L26 14 L26 18 L2 18 Z" fill="var(--surface-raised)" opacity="0.96" />
        {/* Iris — gold accent (the reserved second color, used only on identity + breaking). */}
        <circle cx="14" cy="11.5" r="3.4" fill="var(--accent-gold)" />
        {/* Pupil — ink, offset upward to read as alert/looking forward. */}
        <circle cx="14" cy="11" r="1.7" fill="var(--ink)" />
      </g>
    </svg>
  )
}

type LogoProps = {
  /** Optional locale for the bilingual title fallback. */
  siteName?: string
  className?: string
  /** Hide the wordmark and render the mark alone (e.g. tight masthead slots). */
  markOnly?: boolean
}

/**
 * Full masthead lockup: mark + bilingual wordmark. The Devanagari wordmark is primary
 * (PRODUCT.md: Devanagari-first), the English line sits beneath in ink-soft. The whole
 * lockup links home via the caller wrapping it in a <Link>.
 */
export function Logo({ siteName = 'नागरिक वाच', className, markOnly = false }: LogoProps) {
  if (markOnly) {
    return <LogoMark title={`${siteName} / Nagarik Watch`} className={className} />
  }
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark title={`${siteName} / Nagarik Watch`} className="h-11 w-11 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-h1 font-extrabold tracking-tight text-ink" lang="ne">
          {siteName}
        </span>
        <span className="mt-0.5 text-meta font-semibold uppercase tracking-[0.14em] text-mute" lang="en">
          Nagarik Watch
        </span>
      </span>
    </span>
  )
}
