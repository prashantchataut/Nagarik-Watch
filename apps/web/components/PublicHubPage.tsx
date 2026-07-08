import Link from 'next/link'
import type { Article, Locale, StoryCardData } from '@nagarikwatch/db'
import { StoryCard } from '@nagarikwatch/ui'
import { getArticleBySlug, getStories } from '@/lib/content'
import { localizeHref } from '@/lib/i18n/locales'
import { rankStories } from '@/lib/ranking'
import { localizedLead, localizedTitle, type StaticHub } from '@/lib/site'
import { UtilityWidgetRail } from '@/components/live/LiveWidgets'
import { AdStack, AdSlot } from '@/components/AdSlot'

export async function PublicHubPage({ hub, locale }: { hub: StaticHub; locale: Locale }) {
  const { items } = await getStories({ locale, perPage: 40 })
  const hubStories = await storiesForHub(hub.key, items, locale)
  const ranked =
    hub.mode === 'trending'
      ? rankStories(hubStories, (story, index) => ({
          editorialPriority: story.isBreaking ? 3 : 1,
          viewsPerHour: Math.max(1, 50 - index * 4),
          sharesPerHour: story.isBreaking ? 12 : 2,
        }))
      : rankStories(hubStories, (_story, index) => ({
          editorialPriority: Math.max(0, 3 - index / 4),
        }))
  const stories = ranked.slice(0, 10)
  const leadStory = stories[0]
  const sideStories = stories.slice(1, 4)
  const compactStories = stories.slice(4)
  const lang = locale === 'en' ? 'en' : 'ne'
  const empty =
    locale === 'en'
      ? 'No stories have been published in this section yet.'
      : 'यो खण्डमा अझै समाचार प्रकाशित गरिएको छैन।'

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <header className="border-b border-rule pb-6">
        <p
          className="text-meta font-semibold uppercase tracking-wide text-brand-strong"
          lang={lang}
        >
          Nagarik Watch
        </p>
        <h1
          className="mt-1 font-display text-[clamp(2.05rem,9vw,4rem)] leading-tight text-ink"
          lang={lang}
        >
          {localizedTitle(locale, hub)}
        </h1>
        <p className="mt-3 max-w-body text-body-lg text-ink-soft" lang={lang}>
          {localizedLead(locale, hub)}
        </p>
      </header>

      {hub.mode === 'utility' ? (
        <div className="mt-8">
          <UtilityWidgetRail locale={locale} />
        </div>
      ) : (
        <div className="mt-8">
          <AdSlot locale={locale} placementKey="hub-top" />
        </div>
      )}

      {hub.key === 'submit-story' ? <ReaderSubmissionWorkflow locale={locale} /> : null}

      {stories.length > 0 ? (
        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
          {leadStory ? <StoryCard story={leadStory} locale={locale} variant="featured" /> : null}
          <div className="grid gap-5 border-t border-rule pt-5 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
            {sideStories.map((story) => (
              <StoryCard key={story.slug} story={story} locale={locale} variant="horizontal" />
            ))}
            <AdStack locale={locale} className="hidden lg:grid" />
          </div>
        </section>
      ) : (
        <p
          className="mt-8 rounded-lg border border-rule bg-surface-raised p-5 text-body text-ink-soft"
          lang={lang}
        >
          {empty}
        </p>
      )}

      {compactStories.length > 0 ? (
        <div className="mt-10 flex justify-center">
          <AdSlot locale={locale} placementKey="hub-inline" variant="native" />
        </div>
      ) : null}

      {compactStories.length > 0 ? (
        <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {compactStories.map((story, index) => (
            <StoryCard
              key={story.slug}
              story={story}
              locale={locale}
              variant={index % 3 === 0 ? 'text-led' : 'compact'}
            />
          ))}
        </section>
      ) : null}
    </div>
  )
}

function ReaderSubmissionWorkflow({ locale }: { locale: Locale }) {
  const lang = locale === 'en' ? 'en' : 'ne'
  const steps =
    locale === 'en'
      ? ['Tip received', 'Evidence checked', 'Editor verifies', 'Published or declined']
      : ['टिप प्राप्त', 'प्रमाण जाँच', 'सम्पादक पुष्टि', 'प्रकाशित वा अस्वीकार']

  return (
    <section className="mt-8 rounded-lg border border-rule bg-surface-raised p-5" lang={lang}>
      <h2 className="font-display text-h2 text-ink">
        {locale === 'en' ? 'Reader submission workflow' : 'पाठक सबमिसन कार्यप्रवाह'}
      </h2>
      <ol className="mt-4 grid gap-3 text-body text-ink-soft md:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step} className="rounded-md border border-rule bg-surface p-3">
            <span className="block text-caption font-semibold text-brand-strong">
              {locale === 'en' ? `Step ${index + 1}` : `चरण ${index + 1}`}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <Link
        href={localizeHref(locale, '/contact')}
        className="mt-5 inline-flex rounded-full bg-brand px-5 py-2.5 text-body font-semibold text-surface transition-colors duration-fast ease-out-quint hover:bg-brand-strong"
      >
        {locale === 'en' ? 'Contact newsroom' : 'न्यूजरुमलाई सम्पर्क गर्नुहोस्'}
      </Link>
    </section>
  )
}

async function storiesForHub(
  hubKey: StaticHub['key'],
  cards: StoryCardData[],
  locale: Locale,
): Promise<StoryCardData[]> {
  const taggedHub = new Set(['editor-picks', 'exclusive', 'data-stories', 'reader-corner'])
  if (!taggedHub.has(hubKey)) return cards

  const articles = await Promise.all(
    cards.map((story) => getArticleBySlug(story.category.slug, story.slug, locale)),
  )
  return articles.filter((article): article is Article => {
    if (!article) return false
    const tagSlugs = new Set(article.tags.map((tag) => tag.slug))
    if (hubKey === 'editor-picks') return tagSlugs.has('editor-pick') || article.isBreaking
    if (hubKey === 'exclusive')
      return Boolean(article.exclusive) || tagSlugs.has('exclusive-report')
    if (hubKey === 'data-stories')
      return tagSlugs.has('data-story') || article.bodyNe.some(isDataBlock)
    if (hubKey === 'reader-corner') return tagSlugs.has('reader-submission')
    return true
  })
}

function isDataBlock(block: Article['bodyNe'][number]): boolean {
  if (block.type === 'list' && block.items.length >= 3) return true
  if (block.type === 'embed' && /data|chart|flourish|tableau/i.test(block.url)) return true
  return false
}
