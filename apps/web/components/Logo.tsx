import type { SVGProps } from 'react'
import { cn } from '@nagarikwatch/ui'

type LogoMarkProps = SVGProps<SVGSVGElement> & { title: string }

/**
 * Nagarik Watch identity mark.
 *
 * The open frame represents public record, the diagonal stroke forms an N,
 * and the small civic-red disc is the watched event. The mark is intentionally
 * flat and typographic so it remains legible in a favicon, a masthead, and print.
 */
export function LogoMark({ title, className, ...props }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 96 96"
      role="img"
      aria-label={title}
      className={cn('h-10 w-10', className)}
      {...props}
    >
      <title>{title}</title>
      <path
        d="M17 75V21h13l36 45V21h13v54H66L30 30v45H17Z"
        fill="var(--ink)"
      />
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
}

export function Logo({
  siteName = 'नागरिक वाच',
  className,
  markOnly = false,
  stacked = false,
}: LogoProps) {
  const siteNameLang = /[A-Za-z]/.test(siteName) ? 'en' : 'ne'

  if (markOnly) return <LogoMark title={`${siteName} / Nagarik Watch`} className={className} />

  return (
    <span
      className={cn(
        stacked ? 'flex flex-col items-center gap-1.5' : 'flex items-center gap-3',
        className,
      )}
    >
      <LogoMark
        title={`${siteName} / Nagarik Watch`}
        className={stacked ? 'h-12 w-12 shrink-0' : 'h-9 w-9 shrink-0 sm:h-11 sm:w-11'}
      />
      <span className={cn('flex flex-col leading-none', stacked && 'items-center text-center')}>
        <span
          className="font-display text-[1.45rem] font-black tracking-[-0.035em] text-ink sm:text-[2rem]"
          lang={siteNameLang}
        >
          {siteName}
        </span>
        <span
          className="mt-1 border-t-2 border-brand pt-1 text-[0.55rem] font-black uppercase tracking-[0.26em] text-ink-soft sm:text-[0.62rem]"
          lang="en"
        >
          Nagarik Watch
        </span>
      </span>
    </span>
  )
}
