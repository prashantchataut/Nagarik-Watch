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
  layout?: 'desk' | 'stack' | 'mosaic' | 'lead-rail' | 'overlay-grid' | 'text-led'
}

function isPlaceholderUrl(url: string | undefined): boolean {
  return Boolean(url?.startsWith('data:'))
}

function hasPhoto(story: StoryCardData): boolean {
  return Boolean(story.heroImage?.url) && !isPlaceholderUrl(story.heroImage?.url)
}

/**
 * Homepage category desk. Dense portal packing:
 * every band is image+copy, never sparse text-only columns with empty cells,
 * never giant SVG placeholder mosaics that read as unfinished.
 */
export function SectionBlock({ section, locale, className, layout }: SectionBlockProps) {
  const dict = getDictionary(locale)
  const name =
    locale === 'en' && section.category.nameEn ? section.category.nameEn : section.category.nameNe
  const titleLang = locale === 'en' && section.category.nameEn ? 'en' : 'ne'
  const sectionHref = localizeHref(locale, `/${section.category.slug}`)

  if (!section.lead && section.items.length === 0) return null

  const all = section.lead ? [section.lead, ...section.items] : section.items
  const photoCount = all.filter(hasPhoto).length

  const requested = layout === 'lead-rail' ? 'desk' : layout === 'overlay-grid' ? 'mosaic' : layout === 'text-led' ? 'stack' : layout
  const chosen =
    requested ??
    (photoCount >= 3 && all.length >= 3
      ? 'mosaic'
      : all.length >= 2
        ? 'desk'
        : 'stack')

  return (
    <section className={className} aria-labelledby={`sec-${section.category.slug}`}>
      <SectionHeader
        title={name}
        locale={locale}
        titleLang={titleLang as Locale}
        href={sectionHref}
        moreLabel={dict.seeAll}
      />

      <div className="mt-3">
        {chosen === 'desk' && <DeskLayout items={all} locale={locale} />}
        {chosen === 'mosaic' && <MosaicLayout items={all} locale={locale} />}
        {chosen === 'stack' && <StackLayout items={all} locale={locale} />}
      </div>
    </section>
  )
}

/** Lead story + packed horizontal rail. Default dense desk. */
function DeskLayout({ items, locale }: { items: StoryCardData[]; locale: Locale }) {
  const [lead, ...rest] = items
  if (!lead) return null
  const rail = rest.slice(0, 5)
  const leadVariant = hasPhoto(lead) ? 'featured' : 'default'

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:gap-5 lg:gap-6">
      <RankedCard
        story={lead}
        locale={locale}
        variant={leadVariant}
        priority={false}
        className="min-w-0"
      />
      {rail.length > 0 ? (
        <ul className="flex min-w-0 flex-col divide-y divide-rule border-y border-rule md:border-t-0 md:border-b-0">
          {rail.map((s) => (
            <li key={s.slug} className="py-2.5 first:pt-0 last:pb-0 md:first:pt-0">
              <RankedCard story={s} locale={locale} variant="horizontal" />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/**
 * One large photo + two smaller photo cards. Only when real photography exists.
 * Falls back to desk when placeholders would dominate.
 */
function MosaicLayout({ items, locale }: { items: StoryCardData[]; locale: Locale }) {
  const photos = items.filter(hasPhoto)
  if (photos.length < 3) return <DeskLayout items={items} locale={locale} />

  const [lead, ...rest] = photos
  const side = rest.slice(0, 2)
  const overflow = items.filter((s) => !photos.slice(0, 3).includes(s)).slice(0, 3)

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.7fr)]">
        <RankedCard story={lead!} locale={locale} variant="featured" priority={false} />
        <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
          {side.map((s) => (
            <li key={s.slug}>
              <RankedCard story={s} locale={locale} variant="default" />
            </li>
          ))}
        </ul>
      </div>
      {overflow.length > 0 ? (
        <ul className="grid gap-0 border-t border-rule sm:grid-cols-2 sm:gap-x-5 lg:grid-cols-3">
          {overflow.map((s) => (
            <li key={s.slug} className="border-b border-rule py-2.5">
              <RankedCard story={s} locale={locale} variant="horizontal" />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

/** Full-width packed list: thumbnail + headline + deck. No empty columns. */
function StackLayout({ items, locale }: { items: StoryCardData[]; locale: Locale }) {
  const rows = items.slice(0, 6)
  const cols = rows.length === 1 ? 'grid-cols-1' : rows.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'

  return (
    <ul className={`grid gap-0 ${cols}`}>
      {rows.map((s) => (
        <li key={s.slug} className="border-b border-rule py-2.5 sm:px-0 sm:[&:nth-child(2n)]:sm:pl-3 lg:[&:nth-child(3n)]:lg:pl-3">
          <RankedCard story={s} locale={locale} variant="horizontal" />
        </li>
      ))}
    </ul>
  )
}
