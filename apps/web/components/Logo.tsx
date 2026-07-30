import type { SVGProps } from 'react'
import { cn } from '@nagarikwatch/ui'

type LogoTone = 'default' | 'onDark' | 'chrome'

type LogoMarkProps = SVGProps<SVGSVGElement> & { title: string; tone?: LogoTone }

/**
 * Nagarik Watch identity mark.
 *
 * The open frame represents public record, the diagonal stroke forms an N,
 * and the small civic-red disc is the watched event. The mark is intentionally
 * flat and typographic so it remains legible in a favicon, a masthead, and print.
 */
export function LogoMark({ title, className, tone = 'default', ...props }: LogoMarkProps) {
  const markFill =
    tone === 'onDark' ? 'var(--paper)' : tone === 'chrome' ? 'var(--on-chrome)' : 'var(--ink)'
  return (
    <svg
      viewBox="0 0 96 96"
      role="img"
      aria-label={title}
      className={cn('h-10 w-10', className)}
      {...props}
    >
      <title>{title}</title>
      <path d="M17 75V21h13l36 45V21h13v54H66L30 30v45H17Z" fill={markFill} />
      <circle cx="74" cy="22" r="10" fill="var(--brand)" />
      <path d="M10 84h76" stroke="var(--brand)" strokeWidth="6" />
    </svg>
  )
}

type LogoProps = {
  siteName?: string
  className?: string
  markOnly?: boolean
  stacked?: boolean
  tone?: LogoTone
}

export function Logo({
  siteName = 'नागरिक वाच',
  className,
  markOnly = false,
  stacked = false,
  tone = 'default',
}: LogoProps) {
  const siteNameLang = /[A-Za-z]/.test(siteName) ? 'en' : 'ne'
  const titleClass =
    tone === 'onDark'
      ? 'text-paper'
      : tone === 'chrome'
        ? 'text-on-chrome'
        : 'text-ink'
  const subClass =
    tone === 'onDark'
      ? 'text-paper/70'
      : tone === 'chrome'
        ? 'text-on-chrome-soft'
        : 'text-ink-soft'

  if (markOnly) {
    return <LogoMark title={`${siteName} / Nagarik Watch`} className={className} tone={tone} />
  }

  return (
    <span
      className={cn(
        stacked ? 'flex flex-col items-center gap-1.5' : 'flex items-center gap-2.5 sm:gap-3',
        className,
      )}
    >
      <LogoMark
        title={`${siteName} / Nagarik Watch`}
        tone={tone}
        className={stacked ? 'h-12 w-12 shrink-0' : 'h-8 w-8 shrink-0 sm:h-10 sm:w-10'}
      />
      <span className={cn('flex flex-col leading-none', stacked && 'items-center text-center')}>
        <span
          className={cn(
            'font-display text-[1.5rem] font-black leading-[1.05] tracking-[-0.03em] sm:text-[1.9rem]',
            titleClass,
          )}
          lang={siteNameLang}
        >
          {siteName}
        </span>
        <span
          className={cn(
            'mt-1 border-t-2 border-brand pt-1 font-sans text-[0.58rem] font-semibold tracking-[0.04em] sm:text-[0.62rem]',
            subClass,
          )}
          lang="en"
        >
          Nagarik Watch
        </span>
      </span>
    </span>
  )
}
