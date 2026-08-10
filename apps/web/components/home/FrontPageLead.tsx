import Image from 'next/image'
import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { Byline, CategoryLabel, Dateline } from '@nagarikwatch/ui'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'
import { localizeHref } from '@/lib/i18n/locales'

function storyTitle(story: StoryCardData, locale: Locale): string {
  return locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
}

function storyDeck(story: StoryCardData, locale: Locale): string | undefined {
  return locale === 'en' ? story.deckEn : story.deckNe
}

function titleLang(story: StoryCardData, locale: Locale): 'en' | 'ne' {
  return locale === 'en' && story.titleEn ? 'en' : 'ne'
}

function storyHref(story: StoryCardData, locale: Locale): string {
  return localizeHref(locale, `/${story.category.slug}/${story.slug}`)
}

function hasPhoto(story: StoryCardData): boolean {
  return Boolean(story.heroImage?.url) && !story.heroImage!.url.startsWith('data:')
}

function StoryImage({
  story,
  locale,
  priority = false,
  sizes,
  className,
}: {
  story: StoryCardData
  locale: Locale
  priority?: boolean
  sizes: string
  className: string
}) {
  if (!hasPhoto(story)) return null
  return (
    <Link
      href={storyHref(story, locale)}
      className={`relative block overflow-hidden bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${className}`}
      tabIndex={-1}
      aria-hidden="true"
    >
      <Image
        src={story.heroImage!.url}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover transition-transform duration-slow ease-out-quint motion-safe:group-hover:scale-[1.015]"
      />
    </Link>
  )
}

export function FrontPageLead({ stories, locale }: { stories: StoryCardData[]; locale: Locale }) {
  if (stories.length === 0) return null
  const lead = stories[0]!
  const supportLead = stories[1]
  const supportPair = stories.slice(2, 4)
  const pulse = stories.slice(4, 8)
  const english = locale === 'en'

  return (
    <section
      className="border-b border-rule pb-4 sm:pb-5"
      aria-label={english ? 'Top stories' : 'मुख्य समाचार'}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.68fr)_minmax(20rem,0.72fr)] lg:gap-6 xl:gap-7">
        <InstrumentedStory articleSlug={lead.slug} articleCategory={lead.category.slug}>
          <article className="group min-w-0">
            <CategoryLabel category={lead.category} locale={locale} as="span" />
            <h1
              className="mt-2 max-w-[19ch] text-pretty font-display text-[clamp(2rem,4vw,3.55rem)] font-extrabold leading-[1.12] tracking-[-0.025em] text-ink"
              lang={titleLang(lead, locale)}
            >
              <Link
                href={storyHref(lead, locale)}
                className="transition-colors duration-fast ease-out-quint hover:text-brand-strong"
              >
                {storyTitle(lead, locale)}
              </Link>
            </h1>
            {storyDeck(lead, locale) ? (
              <p
                className="mt-2.5 max-w-[48rem] text-pretty text-body leading-[1.65] text-ink-soft sm:text-body-lg"
                lang={titleLang(lead, locale)}
              >
                {storyDeck(lead, locale)}
              </p>
            ) : null}
            <Byline
              authors={lead.authors}
              locale={locale}
              publishedAt={lead.publishedAt}
              className="mt-2.5"
            />
            <StoryImage
              story={lead}
              locale={locale}
              priority
              sizes="(min-width: 1280px) 840px, (min-width: 1024px) 68vw, 100vw"
              className="mt-3.5 aspect-[16/10] sm:aspect-[16/9]"
            />
          </article>
        </InstrumentedStory>

        {supportLead ? (
          <div className="min-w-0 border-t border-rule pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0 xl:pl-7">
            <InstrumentedStory
              articleSlug={supportLead.slug}
              articleCategory={supportLead.category.slug}
            >
              <article className="group grid min-w-0 grid-cols-[7.25rem_minmax(0,1fr)] gap-3 sm:grid-cols-[9rem_minmax(0,1fr)] lg:block">
                <StoryImage
                  story={supportLead}
                  locale={locale}
                  sizes="(min-width: 1024px) 360px, 144px"
                  className="aspect-[4/3] lg:aspect-[16/10]"
                />
                <div className="min-w-0">
                  <CategoryLabel
                    category={supportLead.category}
                    locale={locale}
                    as="span"
                    className={hasPhoto(supportLead) ? 'lg:mt-3' : ''}
                  />
                  <h2
                    className="mt-1.5 text-pretty font-display text-[1.2rem] font-extrabold leading-snug text-ink sm:text-h3 lg:text-[1.65rem] lg:leading-[1.28]"
                    lang={titleLang(supportLead, locale)}
                  >
                    <Link
                      href={storyHref(supportLead, locale)}
                      className="transition-colors duration-fast ease-out-quint hover:text-brand-strong"
                    >
                      {storyTitle(supportLead, locale)}
                    </Link>
                  </h2>
                  {storyDeck(supportLead, locale) ? (
                    <p
                      className="mt-1.5 hidden text-meta leading-relaxed text-ink-soft lg:line-clamp-2 lg:block"
                      lang={titleLang(supportLead, locale)}
                    >
                      {storyDeck(supportLead, locale)}
                    </p>
                  ) : null}
                </div>
              </article>
            </InstrumentedStory>

            {supportPair.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 gap-0 border-t border-rule pt-3 lg:mt-4 lg:pt-4">
                {supportPair.map((story, index) => (
                  <InstrumentedStory
                    key={story.id}
                    articleSlug={story.slug}
                    articleCategory={story.category.slug}
                  >
                    <article
                      className={`min-w-0 ${index > 0 ? 'border-l border-rule pl-3 sm:pl-4' : 'pr-3 sm:pr-4'}`}
                    >
                      <CategoryLabel category={story.category} locale={locale} as="span" />
                      <h3
                        className="mt-1.5 text-pretty font-display text-body font-bold leading-snug text-ink sm:text-body-lg"
                        lang={titleLang(story, locale)}
                      >
                        <Link
                          href={storyHref(story, locale)}
                          className="transition-colors duration-fast ease-out-quint hover:text-brand-strong"
                        >
                          <span className="line-clamp-3">{storyTitle(story, locale)}</span>
                        </Link>
                      </h3>
                      <Dateline
                        iso={story.publishedAt}
                        locale={locale}
                        className="mt-1.5 block text-caption text-mute"
                      />
                    </article>
                  </InstrumentedStory>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {pulse.length > 0 ? (
        <div className="mt-4 border-t border-rule pt-1 sm:mt-5">
          <div className="sr-only">{english ? 'More top stories' : 'थप मुख्य समाचार'}</div>
          <ol className="grid grid-cols-2 lg:grid-cols-4">
            {pulse.map((story, index) => (
              <li
                key={story.id}
                className={`min-w-0 py-2.5 ${index % 2 === 1 ? 'border-l border-rule pl-3 sm:pl-4' : 'pr-3 sm:pr-4'} ${index >= 2 ? 'border-t border-rule lg:border-t-0' : ''} ${index > 0 ? 'lg:border-l lg:border-rule lg:pl-4' : ''}`}
              >
                <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
                  <article>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-caption">
                      <span className="font-bold text-brand-strong">
                        {english && story.category.nameEn
                          ? story.category.nameEn
                          : story.category.nameNe}
                      </span>
                      <Dateline iso={story.publishedAt} locale={locale} className="text-mute" />
                    </div>
                    <h3
                      className="mt-1 text-pretty font-display text-body font-bold leading-snug text-ink sm:text-body-lg"
                      lang={titleLang(story, locale)}
                    >
                      <Link
                        href={storyHref(story, locale)}
                        className="transition-colors duration-fast ease-out-quint hover:text-brand-strong"
                      >
                        <span className="line-clamp-3 lg:line-clamp-2">
                          {storyTitle(story, locale)}
                        </span>
                      </Link>
                    </h3>
                  </article>
                </InstrumentedStory>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  )
}
