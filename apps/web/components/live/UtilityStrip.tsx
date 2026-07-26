import type { Locale } from '@nagarikwatch/db'
import { getRealNepse } from '@/lib/live/real'
import { localizeNumber, relativeTime } from '@/lib/live/format'
import { ReaderPlaceLive } from '@/components/live/ReaderPlaceLive'

export async function UtilityStrip({ locale }: { locale: Locale }) {
  const lang = locale === 'en' ? 'en' : 'ne'
  const nepse = await getRealNepse(locale)

  const items: Array<{
    label: string
    value: string
    note?: string
    href?: string
    tone?: string
  }> = []
  if (nepse.status === 'ok' && nepse.data) {
    const up = nepse.data.changePercent >= 0
    items.push({
      label: 'NEPSE',
      value: localizeNumber(nepse.data.index.toFixed(2), locale),
      note: `${up ? '▲' : '▼'} ${localizeNumber(Math.abs(nepse.data.changePercent).toFixed(2), locale)}%`,
      href: `${locale === 'en' ? '/en' : ''}/market`,
      tone: up ? 'text-up' : 'text-down',
    })
  }

  return (
    <div
      className="border-b border-rule bg-surface-raised"
      role="complementary"
      aria-label={locale === 'en' ? 'Daily reference line' : 'दैनिक सन्दर्भ लाइन'}
    >
      <div className="mx-auto flex max-w-page items-center gap-3 overflow-x-auto px-3 py-1.5 text-caption text-ink-soft sm:gap-4 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="shrink-0 font-bold text-brand-strong" lang={lang}>
          {locale === 'en' ? 'Markets' : 'बजार'}
        </span>
        <ReaderPlaceLive locale={locale} variant="strip" />
        {items.map((item) => {
          const inner = (
            <>
              <span className="font-semibold text-mute" lang="en">
                {item.label}
              </span>
              <span className="font-semibold text-ink">{item.value}</span>
              {item.note ? <span className={item.tone ?? 'text-mute'}>{item.note}</span> : null}
            </>
          )
          return item.href ? (
            <a
              key={item.label}
              href={item.href}
              className="inline-flex shrink-0 items-center gap-2 hover:text-brand-strong"
            >
              {inner}
            </a>
          ) : (
            <span key={item.label} className="inline-flex shrink-0 items-center gap-2">
              {inner}
            </span>
          )
        })}
        {nepse.updatedAt ? (
          <span className="ml-auto shrink-0 text-mute" lang={lang}>
            {relativeTime(nepse.updatedAt, locale)}
          </span>
        ) : null}
      </div>
    </div>
  )
}
