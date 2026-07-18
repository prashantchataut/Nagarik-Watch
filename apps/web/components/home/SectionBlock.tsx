import type { ComponentProps } from 'react'
import type { HomepageSection, Locale, StoryCardData } from '@nagarikwatch/db'
import { StoryCard, SectionHeader } from '@nagarikwatch/ui'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref } from '@/lib/i18n/locales'

function RankedCard({
  story,
  locale,
  variant,
  priority,
  className,
}: {
  story: StoryCardData
  locale: Locale
  variant?: ComponentProps<typeof StoryCard>['variant']
  priority?: boolean
  className?: string
}) {
  return (
    <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
      <StoryCard
        story={story}
        locale={locale}
        variant={variant}
        priority={priority}
        className={className}
      />
    </InstrumentedStory>
  )
}

type SectionBlockProps = {
  section: HomepageSection
  locale: Locale
  className?: string
  /** Force a specific layout instead of the auto-rotating default. */
  layout?: 'lead-rail' | 'overlay-grid' | 'text-led' | 'default-grid'
}

/**
 * One homepage category band. The layout varies by content shape and index
 * so the page never reads as identical-card-grid slop (impeccable ban):
 *
 *  - lead-rail: featured card on the left + horizontal rail on the right.
 *    The eKantipur / NYT pattern for the top section.
 *  - overlay-grid: 3 image-led cards with headline-on-image. Magazine feel.
 *  - text-led: 2-col headline-forward columns, no images. Opinion / analysis.
 *  - default-grid: uniform 3-col default cards. Fallback.
 *
 * The layout auto-rotates by section index so consecutive sections don't
 * repeat. Callers can force a layout via the `layout` prop.
 */
export function SectionBlock({ section, locale, className, layout }: SectionBlockProps) {
  const dict = getDictionary(locale)
  const name =
    locale === 'en' && section.category.nameEn ? section.category.nameEn : section.category.nameNe
  const titleLang = locale === 'en' && section.category.nameEn ? 'en' : 'ne'
  const sectionHref = localizeHref(locale, `/${section.category.slug}`)

  if (!section.lead && section.items.length === 0) return null

  // Pick layout: explicit prop > rotation by item count.
  const all = section.lead ? [section.lead, ...section.items] : section.items
  const chosen =
    layout ?? (all.length >= 4 ? 'lead-rail' : all.length >= 3 ? 'overlay-grid' : 'text-led')

  return (
    <section className={className} aria-labelledby={`sec-${section.category.slug}`}>
      <SectionHeader
        title={name}
        locale={locale}
        titleLang={titleLang as Locale}
        href={sectionHref}
        moreLabel={dict.seeAll}
      />

      <div className="mt-6">
        {chosen === 'lead-rail' && <LeadRail section={section} locale={locale} />}
        {chosen === 'overlay-grid' && <OverlayGrid items={all} locale={locale} />}
        {chosen === 'text-led' && <TextLedColumns items={all} locale={locale} />}
        {chosen === 'default-grid' && <DefaultGrid items={all} locale={locale} />}
      </div>
    </section>
  )
}

function LeadRail({ section, locale }: { section: HomepageSection; locale: Locale }) {
  const lead = section.lead
  const rail = lead ? section.items : section.items.slice(1)
  if (!lead) return <DefaultGrid items={section.items} locale={locale} />
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <RankedCard story={lead} locale={locale} variant="featured" priority={false} />
      {rail.length > 0 && (
        <ul className="flex flex-col divide-y divide-rule">
          {rail.map((s) => (
            <li key={s.slug} className="py-3 first:pt-0 last:pb-0">
              <RankedCard story={s} locale={locale} variant="horizontal" />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function OverlayGrid({ items, locale }: { items: HomepageSection['items']; locale: Locale }) {
  const withImages = items.filter((s) => s.heroImage).slice(0, 3)
  if (withImages.length === 0) return <DefaultGrid items={items} locale={locale} />
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {withImages.map((s, i) => (
        <RankedCard key={s.slug} story={s} locale={locale} variant="overlay" priority={i === 0} />
      ))}
    </div>
  )
}

function TextLedColumns({ items, locale }: { items: HomepageSection['items']; locale: Locale }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {items.slice(0, 6).map((s) => (
        <RankedCard key={s.slug} story={s} locale={locale} variant="text-led" />
      ))}
    </div>
  )
}

function DefaultGrid({ items, locale }: { items: HomepageSection['items']; locale: Locale }) {
  return (
    <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((s) => (
        <li key={s.slug}>
          <RankedCard story={s} locale={locale} variant="default" />
        </li>
      ))}
    </ul>
  )
}
