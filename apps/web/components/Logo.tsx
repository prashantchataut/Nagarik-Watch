import type { SVGProps } from 'react'
import { cn } from '@nagarikwatch/ui'

type LogoTone = 'default' | 'onDark' | 'chrome'

type LogoMarkProps = SVGProps<SVGSVGElement> & { title: string; tone?: LogoTone }

export function LogoMark({ title, className, tone = 'default', ...props }: LogoMarkProps) {
  const nColor = 'var(--brand)'
  const wColor =
    tone === 'onDark'
      ? 'var(--paper)'
      : tone === 'chrome'
        ? 'var(--on-chrome)'
        : 'var(--ink)'

  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={cn('h-10 w-10 shrink-0', className)}
      {...props}
    >
      <title>{title}</title>
      <path
        d="M7 51V13L29 51V13"
        fill="none"
        stroke={nColor}
        strokeWidth="7"
        strokeLinejoin="miter"
      />
      <path
        d="M29 13L36.5 51L44 27L51.5 51L58 13"
        fill="none"
        stroke={wColor}
        strokeWidth="7"
        strokeLinejoin="miter"
      />
      <circle cx="58" cy="13" r="3.5" fill={nColor} />
    </svg>
  )
}

type LogoProps = {
  siteName?: string
  className?: string
  markOnly?: boolean
  stacked?: boolean
  tone?: LogoTone
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
  const titleClass =
    tone === 'onDark' ? 'text-paper' : tone === 'chrome' ? 'text-on-chrome' : 'text-ink'
  const subClass =
    tone === 'onDark'
      ? 'text-paper/78'
      : tone === 'chrome'
        ? 'text-on-chrome-soft'
        : 'text-ink-soft'

  if (markOnly) {
    return <LogoMark title={`${siteName} / Nagarik Watch`} className={className} tone={tone} />
  }

  return (
    <span
      className={cn(
        stacked ? 'flex flex-col items-center gap-2.5' : 'flex items-center gap-2.5 sm:gap-3',
        className,
      )}
    >
      <LogoMark
        title={`${siteName} / Nagarik Watch`}
        tone={tone}
        className={cn(
          'shrink-0',
          stacked
            ? 'h-12 w-12 sm:h-14 sm:w-14'
            : compact
              ? 'h-8 w-8'
              : 'h-10 w-10 sm:h-12 sm:w-12',
        )}
      />
      <span className={cn('flex min-w-0 flex-col leading-none', stacked && 'items-center text-center')}>
        <span
          className={cn(
            'font-display font-black leading-[1.04]',
            compact ? 'whitespace-nowrap text-[1.2rem]' : 'text-[1.7rem] sm:text-[2.15rem]',
            siteNameLang === 'en' ? 'tracking-[-0.025em]' : 'tracking-normal',
            titleClass,
          )}
          lang={siteNameLang}
        >
          {siteName}
        </span>
        {!compact ? (
          <span
            className={cn(
              'mt-1.5 font-sans text-[0.62rem] font-bold tracking-[0.08em] sm:text-[0.68rem]',
              subClass,
            )}
            lang="en"
          >
            NAGARIK WATCH
          </span>
        ) : null}
      </span>
    </span>
  )
}
