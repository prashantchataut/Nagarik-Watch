import type { SVGProps } from 'react'
import { cn } from '@nagarikwatch/ui'

type LogoTone = 'default' | 'onDark' | 'chrome'

type LogoMarkProps = SVGProps<SVGSVGElement> & { title: string; tone?: LogoTone }

/**
 * Nagarik Watch — Brand Emblem Mark.
 *
 * Combines the Civic Eye of scrutiny (the "Watch"), Nepal's national flag geometry,
 * and the Devanagari 'ना' / 'N' monogram. Features a vibrant Civic Crimson badge,
 * high-contrast aperture, and an amber-gold focal iris.
 */
export function LogoMark({ title, className, tone = 'default', ...props }: LogoMarkProps) {
  void tone
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={title}
      className={cn(
        'h-10 w-10 shrink-0 transition-transform duration-fast ease-out-quint group-hover:scale-105',
        className,
      )}
      {...props}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id="nw-brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--brand-strong)" />
        </linearGradient>
        <linearGradient id="nw-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-gold)" />
          <stop offset="100%" stopColor="#D4A017" />
        </linearGradient>
      </defs>

      {/* Rounded Civic Badge */}
      <rect x="4" y="4" width="92" height="92" rx="22" fill="url(#nw-brand-grad)" />

      {/* Subtle Inner Accent Ring */}
      <rect
        x="8"
        y="8"
        width="84"
        height="84"
        rx="18"
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
      />

      {/* Central Civic Eye (The "Watch" of the Citizen) */}
      <path
        d="M16 50C25 32 37 23 50 23s25 9 34 27c-9 18-21 27-34 27S25 68 16 50Z"
        fill="var(--paper)"
      />

      {/* Deep Iris / Pupil */}
      <circle cx="50" cy="50" r="14" fill="var(--ink)" />

      {/* Golden Truth Core / Spark of Vigilance */}
      <circle cx="54" cy="46" r="4.5" fill="url(#nw-gold-grad)" />

      {/* Dual Flag-Pendant Graphic Bar at Bottom */}
      <path d="M28 78h44" stroke="var(--paper)" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}

type LogoProps = {
  siteName?: string
  className?: string
  markOnly?: boolean
  stacked?: boolean
  tone?: LogoTone
  /** Narrow chrome rows: wordmark must stay on one line inside a 56px bar. */
  compact?: boolean
}

export function Logo({
  siteName = 'नागरिक वाच',
  className,
  markOnly = false,
  stacked = false,
  tone = 'default',
  compact = false,
}: LogoProps) {
  const siteNameLang = /[A-Za-z]/.test(siteName) ? 'en' : 'ne'
  const isEn = siteNameLang === 'en'

  const titleClass =
    tone === 'onDark' ? 'text-paper' : tone === 'chrome' ? 'text-on-chrome' : 'text-ink'

  const subClass =
    tone === 'onDark'
      ? 'text-paper/80'
      : tone === 'chrome'
        ? 'text-on-chrome-soft'
        : 'text-ink-soft'

  if (markOnly) {
    return <LogoMark title={`${siteName} / Nagarik Watch`} className={className} tone={tone} />
  }

  return (
    <span
      className={cn(
        stacked ? 'flex flex-col items-center gap-2' : 'flex items-center gap-2.5 sm:gap-3.5',
        className,
      )}
    >
      <LogoMark
        title={`${siteName} / Nagarik Watch`}
        tone={tone}
        className={cn(
          'shrink-0',
          stacked ? 'h-12 w-12 sm:h-14 sm:w-14' : compact ? 'h-8 w-8' : 'h-9 w-9 sm:h-11 sm:w-11',
        )}
      />
      <span className={cn('flex flex-col leading-none', stacked && 'items-center text-center')}>
        <span
          className={cn(
            'font-display font-black leading-[1.02] tracking-[-0.03em]',
            compact ? 'whitespace-nowrap text-[1.15rem]' : 'text-[1.65rem] sm:text-[2.05rem]',
            titleClass,
          )}
          lang={siteNameLang}
        >
          {siteName}
          <span className="text-brand ml-0.5 inline-block">.</span>
        </span>
        {!compact ? (
          <span className="mt-1 flex items-center gap-1.5">
            <span
              className={cn(
                'font-sans text-[0.62rem] font-black uppercase tracking-[0.14em] sm:text-[0.68rem]',
                subClass,
              )}
              lang="en"
            >
              Nagarik Watch
            </span>
            <span
              className="hidden h-1 w-1 rounded-full bg-brand sm:inline-block"
              aria-hidden="true"
            />
            <span className="hidden text-[0.58rem] font-bold uppercase tracking-wider text-brand sm:inline-block">
              {isEn ? 'Independent News' : 'स्वतन्त्र समाचार'}
            </span>
          </span>
        ) : null}
      </span>
    </span>
  )
}
