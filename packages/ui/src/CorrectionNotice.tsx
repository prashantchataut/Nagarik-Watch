import type { Correction, Locale } from '@nagarikwatch/db'
import { cn } from './cn'

type CorrectionNoticeProps = {
  corrections: Correction[]
  locale: Locale
  className?: string
}

function formatCorrectionDate(iso: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale === 'en' ? 'en-GB' : 'ne-NP', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

/**
 * Visible, dated corrections — unembarrassed trust chrome (PRODUCT.md).
 */
export function CorrectionNotice({ corrections, locale, className }: CorrectionNoticeProps) {
  if (!corrections.length) return null
  const lang = locale === 'en' ? 'en' : 'ne'
  const heading = locale === 'en' ? 'Corrections and updates' : 'सच्याइएका विवरण'
  const label = locale === 'en' ? 'Updated' : 'अद्यावधिक'
  return (
    <aside
      className={cn('border border-rule bg-brand-tint px-4 py-3 text-sm text-ink', className)}
      aria-labelledby="corrections-heading"
      lang={lang}
      role="note"
    >
      <h2 id="corrections-heading" className="font-display text-base font-semibold text-ink">
        {heading}
      </h2>
      <ul className="mt-2 space-y-2">
        {corrections.map((correction, idx) => {
          const summary =
            locale === 'en' && correction.summaryEn ? correction.summaryEn : correction.summaryNe
          return (
            <li key={`${correction.at}-${idx}`} className="leading-relaxed text-ink-soft">
              <time dateTime={correction.at} className="font-semibold text-ink">
                {label}: {formatCorrectionDate(correction.at, locale)}
              </time>
              <span className="text-ink-soft">, {summary}</span>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
