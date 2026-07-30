import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { PROVINCES } from '@/lib/site'
import { SectionHeader } from '@nagarikwatch/ui'
import { localizeHref } from '@/lib/i18n/locales'
import type { ProvinceHeatRow } from '@/lib/content/province-heat'

/** Compact province discovery strip with optional live reader heat. */
export function ProvinceHub({
  locale,
  className,
  heat = [],
}: {
  locale: Locale
  className?: string
  heat?: ProvinceHeatRow[]
}) {
  const lang = locale === 'en' ? 'en' : 'ne'
  const heatBySlug = new Map(heat.map((row) => [row.slug, row]))
  const hasLiveHeat = heat.some((row) => row.readers > 0)
  const rows =
    heat.length > 0
      ? heat
      : PROVINCES.map((p) => ({
          slug: p.slug,
          nameNe: p.nameNe,
          nameEn: p.nameEn,
          score: 0,
          readers: 0,
          stories: 0,
        }))

  return (
    <section className={className} aria-label={lang === 'ne' ? 'प्रदेश' : 'Provinces'}>
      <SectionHeader title={lang === 'ne' ? 'प्रदेश' : 'Provinces'} locale={locale} />
      {hasLiveHeat ? (
        <p className="mt-1 text-caption text-ink-soft" lang={lang}>
          {lang === 'ne'
            ? 'पछिल्लो सात दिनको पढाइ संकेत (गाढा = बढी ध्यान)।'
            : 'Last seven days of reader attention (darker = hotter).'}
        </p>
      ) : null}
      <ul
        className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-4 sm:overflow-visible lg:grid-cols-7"
        role="list"
      >
        {rows.map((p) => {
          const live = heatBySlug.get(p.slug)
          const score = live?.score ?? p.score
          const readers = live?.readers ?? p.readers
          const stories = live?.stories ?? p.stories
          const href = localizeHref(locale, `/province/${p.slug}`)
          const name = lang === 'ne' ? p.nameNe : p.nameEn
          const heatPct = Math.round(score * 100)
          return (
            <li key={p.slug} className="min-w-[7.5rem] shrink-0 sm:min-w-0">
              <Link
                href={href}
                className="group flex min-h-11 items-center justify-between gap-2 border border-rule bg-surface-raised px-3 py-2.5 transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                lang={lang}
                style={
                  score > 0
                    ? {
                        backgroundImage: `linear-gradient(90deg, color-mix(in srgb, var(--brand) ${Math.max(12, heatPct * 0.55)}%, transparent) 0%, transparent 100%)`,
                      }
                    : undefined
                }
                title={
                  readers > 0
                    ? lang === 'ne'
                      ? `${readers} पाठक · ${stories} समाचार`
                      : `${readers} readers · ${stories} stories`
                    : undefined
                }
              >
                <span className="font-display text-meta font-bold leading-snug text-ink group-hover:text-brand-strong sm:text-body">
                  {name}
                </span>
                <span
                  className="text-caption font-semibold text-mute group-hover:text-brand-strong"
                  aria-hidden="true"
                >
                  {readers > 0 ? readers : '→'}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
