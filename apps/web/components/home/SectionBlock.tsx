import Image from 'next/image'
import Link from 'next/link'
import type { ComponentProps } from 'react'
import type { HomepageSection, Locale, StoryCardData } from '@nagarikwatch/db'
import { StoryCard, SectionHeader } from '@nagarikwatch/ui'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref } from '@/lib/i18n/locales'

export type HomeSectionLayout = 'news-desk' | 'split' | 'photo-desk' | 'voices' | 'compact-desk'

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

function hasPhoto(story: StoryCardData): boolean {
  return Boolean(story.heroImage?.url) && !story.heroImage!.url.startsWith('data:')
}

function titleFor(story: StoryCardData, locale: Locale): string {
  return locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
}

function deckFor(story: StoryCardData, locale: Locale): string | undefined {
  return locale === 'en' ? story.deckEn : story.deckNe
}

function langFor(story: StoryCardData, locale: Locale): 'en' | 'ne' {
  return locale === 'en' && story.titleEn ? 'en' : 'ne'
}

function hrefFor(story: StoryCardData, locale: Locale): string {
  return localizeHref(locale, `/${story.category.slug}/${story.slug}`)
}

function TextBrief({
  story,
  locale,
  deck = false,
  className = '',
}: {
  story: StoryCardData
  locale: Locale
  deck?: boolean
  className?: string
}) {
  return (
    <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
      <article className={className}>
        <h3
          className="text-pretty font-display text-body font-bold leading-snug text-ink transition-colors duration-fast ease-out-quint hover:text-brand-strong sm:text-body-lg"
          lang={langFor(story, locale)}
        >
          <Link href={hrefFor(story, locale)}>{titleFor(story, locale)}</Link>
        </h3>
        {deck && deckFor(story, locale) ? (
          <p
            className="mt-1 line-clamp-2 text-caption leading-relaxed text-ink-soft sm:text-meta"
            lang={langFor(story, locale)}
          >
            {deckFor(story, locale)}
          </p>
        ) : null}
      </article>
    </InstrumentedStory>
  )
}

function SmallPhotoStory({ story, locale }: { story: StoryCardData; locale: Locale }) {
  if (!hasPhoto(story)) return <TextBrief story={story} locale={locale} deck />
  return (
    <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
      <article className="group grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)] gap-2.5 sm:grid-cols-[7rem_minmax(0,1fr)]">
        <Link
          href={hrefFor(story, locale)}
          className="relative aspect-[4/3] overflow-hidden rounded bg-surface-raised"
          tabIndex={-1}
          aria-hidden="true"
        >
          <Image
            src={story.heroImage!.url}
            alt=""
            fill
            sizes="120px"
            className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.03]"
          />
        </Link>
        <div className="min-w-0">
          <h3
            className="text-pretty font-display text-body font-bold leading-snug text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong sm:text-body-lg"
            lang={langFor(story, locale)}
          >
            <Link href={hrefFor(story, locale)}>
              <span className="line-clamp-2">{titleFor(story, locale)}</span>
            </Link>
          </h3>
          {deckFor(story, locale) ? (
            <p
              className="mt-1 line-clamp-1 text-caption leading-relaxed text-ink-soft"
              lang={langFor(story, locale)}
            >
              {deckFor(story, locale)}
            </p>
          ) : null}
        </div>
      </article>
    </InstrumentedStory>
  )
}

function VoiceStory({
  story,
  locale,
  featured = false,
}: {
  story: StoryCardData
  locale: Locale
  featured?: boolean
}) {
  const author = story.authors[0]
  const authorName = author?.name || (story.byline ? story.byline : '')
  const fallbackAuthor = locale === 'en' ? 'Editorial column' : 'स्तम्भकार'

  return (
    <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
      <article className="min-w-0">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-surface-raised font-display text-caption font-extrabold text-brand-strong"
            aria-hidden="true"
          >
            {(authorName || fallbackAuthor).slice(0, 2)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-meta font-bold text-ink">
              {authorName || fallbackAuthor}
            </p>
            <p className="text-caption text-mute">
              {locale === 'en' ? 'Opinion and analysis' : 'विचार / टिप्पणी'}
            </p>
          </div>
        </div>

        <h3
          className={
            featured
              ? 'mt-3 text-pretty font-display text-h2 font-extrabold leading-snug text-ink transition-colors duration-fast ease-out-quint hover:text-brand-strong sm:text-[1.7rem]'
              : 'mt-2.5 text-pretty font-display text-body-lg font-bold leading-snug text-ink transition-colors duration-fast ease-out-quint hover:text-brand-strong'
          }
          lang={langFor(story, locale)}
        >
          <Link href={hrefFor(story, locale)}>{titleFor(story, locale)}</Link>
        </h3>

        {deckFor(story, locale) ? (
          <p
            className={
              featured
                ? 'mt-2 line-clamp-3 text-body leading-relaxed text-ink-soft'
                : 'mt-1.5 line-clamp-2 text-meta leading-relaxed text-ink-soft'
            }
            lang={langFor(story, locale)}
          >
            {deckFor(story, locale)}
          </p>
        ) : null}
      </article>
    </InstrumentedStory>
  )
}

export function SectionBlock({
  section,
  locale,
  className,
  layout = 'news-desk',
}: {
  section: HomepageSection
  locale: Locale
  className?: string
  layout?: HomeSectionLayout
}) {
  const dict = getDictionary(locale)
  const name =
    locale === 'en' && section.category.nameEn ? section.category.nameEn : section.category.nameNe
  const titleLang = locale === 'en' && section.category.nameEn ? 'en' : 'ne'
  const sectionHref = localizeHref(locale, `/${section.category.slug}`)
  const items = section.lead ? [section.lead, ...section.items] : section.items

  if (items.length === 0) return null

  return (
    <section
      className={`border-b border-rule pb-5 sm:pb-6 ${className ?? ''}`.trim()}
      aria-labelledby={`sec-${section.category.slug}`}
    >
      <SectionHeader
        id={`sec-${section.category.slug}`}
        title={name}
        locale={locale}
        titleLang={titleLang as Locale}
        href={sectionHref}
        moreLabel={dict.seeAll}
      />
      <div className="mt-3.5 sm:mt-4">
        {layout === 'news-desk' ? <NewsDesk items={items} locale={locale} /> : null}
        {layout === 'split' ? <SplitDesk items={items} locale={locale} /> : null}
        {layout === 'photo-desk' ? <PhotoDesk items={items} locale={locale} /> : null}
        {layout === 'voices' ? <VoicesDesk items={items} locale={locale} /> : null}
        {layout === 'compact-desk' ? <CompactDesk items={items} locale={locale} /> : null}
      </div>
    </section>
  )
}

function NewsDesk({ items, locale }: { items: StoryCardData[]; locale: Locale }) {
  const lead = items[0]!
  const secondary = items[1]
  const briefs = items.slice(2, 5)

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)] md:gap-5">
      <RankedCard story={lead} locale={locale} variant={hasPhoto(lead) ? 'featured' : 'text-led'} />
      <div className="min-w-0 md:border-l md:border-rule md:pl-5 space-y-3">
        {secondary ? <SmallPhotoStory story={secondary} locale={locale} /> : null}
        {briefs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-rule pt-3">
            {briefs.map((story) => (
              <TextBrief key={story.id} story={story} locale={locale} deck className="min-w-0" />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function SplitDesk({ items, locale }: { items: StoryCardData[]; locale: Locale }) {
  const first = items[0]!
  const second = items[1]
  const rest = items.slice(2, 5)

  return (
    <div>
      <div className={`grid gap-4 ${second ? 'md:grid-cols-2 md:gap-5' : ''}`}>
        <RankedCard
          story={first}
          locale={locale}
          variant={hasPhoto(first) ? 'featured' : 'text-led'}
        />
        {second ? (
          <div className="border-t border-rule pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
            <RankedCard
              story={second}
              locale={locale}
              variant={hasPhoto(second) ? 'default' : 'text-led'}
            />
          </div>
        ) : null}
      </div>
      {rest.length > 0 ? (
        <div className="mt-4 grid gap-3 border-t border-rule pt-3 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((story) => (
            <div key={story.id} className="py-1">
              <TextBrief story={story} locale={locale} deck />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function PhotoDesk({ items, locale }: { items: StoryCardData[]; locale: Locale }) {
  const photoItems = items.filter(hasPhoto)
  if (photoItems.length < 2) return <NewsDesk items={items} locale={locale} />

  const lead = photoItems[0]!
  const side = photoItems.slice(1, 3)
  const used = new Set([lead.id, ...side.map((story) => story.id)])
  const rest = items.filter((story) => !used.has(story.id)).slice(0, 2)

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] md:gap-5">
        <RankedCard story={lead} locale={locale} variant="featured" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-1 md:gap-4">
          {side.map((story) => (
            <RankedCard key={story.id} story={story} locale={locale} variant="default" />
          ))}
        </div>
      </div>
      {rest.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-rule pt-3">
          {rest.map((story) => (
            <TextBrief key={story.id} story={story} locale={locale} deck />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function VoicesDesk({ items, locale }: { items: StoryCardData[]; locale: Locale }) {
  const lead = items[0]!
  const rest = items.slice(1, 4)

  return (
    <div className="bg-brand-tint/35 px-3 py-4 sm:px-5 sm:py-5">
      <div
        className={`grid gap-5 ${
          rest.length ? 'lg:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)] lg:gap-6' : ''
        }`}
      >
        <VoiceStory story={lead} locale={locale} featured />
        {rest.length ? (
          <div className="divide-y divide-rule border-t border-rule lg:border-l lg:border-t-0 lg:pl-5">
            {rest.map((story) => (
              <div key={story.id} className="py-3 first:pt-0">
                <VoiceStory story={story} locale={locale} />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function CompactDesk({ items, locale }: { items: StoryCardData[]; locale: Locale }) {
  const lead = items[0]!
  const rest = items.slice(1, 5)

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-5">
      <SmallPhotoStory story={lead} locale={locale} />
      {rest.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-rule pt-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          {rest.map((story) => (
            <TextBrief key={story.id} story={story} locale={locale} deck />
          ))}
        </div>
      ) : null}
    </div>
  )
}
