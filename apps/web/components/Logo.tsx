import type { SVGProps } from 'react'
import { cn } from '@nagarikwatch/ui'

/**
 * Nagarik Watch logo mark — "The Watchtower Eye".
 *
 * A rounded crimson badge (trust + civic authority) containing a refined almond
 * eye (vigilance — the "Watch" in the name). The eye's iris is a stylised
 * Himalayan peak (Nepal), and a single gold signal dot sits at the apex — the
 * reserved accent colour, used only on identity + breaking, signalling that
 * the watchtower is active.
 *
 * The mark is ownable: no other Nepali portal uses an eye + peak composite,
 * and the crimson + gold pair reads as serious-news, not tabloid. The geometry
 * is clean enough to render crisply from 16px favicon to 120px masthead.
 *
 * Pure inline SVG (no raster), so it scales without artefacts. `currentColor`
 * is unused on purpose: the mark colours are semantic and must not follow
 * surrounding text.
 *
 * Accessibility: decorative when paired with the visible wordmark, so the
 * default is role="img" with a <title>. Pass an `aria-label` to make it the
 * lone label (e.g. the footer mark with no adjacent text).
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
      {/* Rounded badge — brand fill, moderate radius for civic seriousness. */}
      <rect x="1.5" y="1.5" width="45" height="45" rx="11" fill="var(--brand)" />
      {/* Subtle top sheen for depth (impeccable: no glassmorphism, just a 5% lift). */}
      <rect x="1.5" y="1.5" width="45" height="22" rx="11" fill="#ffffff" opacity="0.05" />

      {/*
        The Watchtower Eye, drawn within a 32×20 box centred on the badge.
        Outer almond eye: two mirrored quadratic curves meeting at pointed
        corners (the "watchful" shape — pointed ends read as alert). The warm
        cream face sits on the crimson badge.
      */}
      <path
        d="M8 24 Q24 12 40 24 Q24 36 8 24 Z"
        fill="var(--surface-raised)"
        opacity="0.97"
      />

      {/*
        Himalayan peak iris — a triangle whose base sits on the eye's midline
        and whose apex points up toward the gold signal dot. Two ridges give
        it the silhouette of a mountain range rather than a flat triangle.
      */}
      <path
        d="M17 24 L21 17.5 L23.5 21 L26 16 L31 24 Z"
        fill="var(--brand-strong)"
      />
      {/* Secondary smaller ridge for range texture. */}
      <path
        d="M17 24 L20 21 L22 23 L24 20 L26 22.5 L31 24 Z"
        fill="var(--brand)"
        opacity="0.55"
      />

      {/*
        Gold signal dot — the apex spark. Reserved accent colour, used only
        on identity + breaking. Sits at the peak's tip so the eye "looks up"
        toward the signal.
      */}
      <circle cx="26" cy="16.5" r="1.5" fill="var(--accent-gold)" />

      {/*
        Lower lash line — grounds the eye, adds the "watching" weight at the
        base so the mark doesn't float. A single curved stroke under the eye.
      */}
      <path
        d="M10 27.5 Q24 33 38 27.5"
        fill="none"
        stroke="var(--surface-raised)"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.8"
      />
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
 * Full masthead lockup: mark + bilingual wordmark. The Devanagari wordmark is
 * primary (PRODUCT.md: Devanagari-first), the English line sits beneath in
 * ink-soft. The whole lockup links home via the caller wrapping it in a <Link>.
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
        <span
          className="mt-0.5 text-meta font-semibold uppercase tracking-[0.14em] text-mute"
          lang="en"
        >
          Nagarik Watch
        </span>
      </span>
    </span>
  )
}
