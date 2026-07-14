import type { Article, Locale, StoryCardData } from '@nagarikwatch/db'
import { StoryCard } from '@nagarikwatch/ui'
import { getArticleBySlug, getStories } from '@/lib/content'
import { rankStories } from '@/lib/ranking'
import { localizedLead, localizedTitle, type StaticHub } from '@/lib/site'
import { UtilityWidgetRail } from '@/components/live/LiveWidgets'
import { AdSlot } from '@/components/AdSlot'
import { ReaderSubmissionForm } from '@/components/forms/ReaderSubmissionForm'

export async function PublicHubPage({ hub, locale }: { hub: StaticHub; locale: Locale }) {
  const { items } = await getStories({ locale, perPage: 40 })
  const hubStories = await storiesForHub(hub.key, items, locale)
  const ranked = rankStories(hubStories, (story, index) => ({
    editorialPriority: story.isBreaking ? 3 : Math.max(0, 1 - index / 20),
  }))
  const stories = ranked.slice(0, 12)
  const leadStory = stories[0]
  const sideStories = stories.slice(1, 4)
  const compactStories = stories.slice(4)
  const lang = locale === 'en' ? 'en' : 'ne'
  const empty =
    locale === 'en'
      ? 'No verified Nagarik Watch stories have been published in this section yet.'
      : 'यो खण्डमा नागरिक वाचका प्रमाणित समाचार अझै प्रकाशित भएका छैनन्।'
  const rankingNotice =
    locale === 'en'
      ? 'Verified audience-ranking telemetry is not connected yet. Until it is, this page is ordered by publication time and editorial priority—not fabricated popularity numbers.'
      : 'प्रमाणित पाठक-र्‍याङ्किङ तथ्याङ्क अझै जोडिएको छैन। त्यतिन्जेल यो सूची प्रकाशन समय र सम्पादकीय प्राथमिकताका आधारमा छ; बनावटी लोकप्रियता अङ्क प्रयोग गरिएको छैन।'

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <header className="border-b-2 border-ink pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p
              className="text-meta font-semibold uppercase tracking-[0.16em] text-brand-strong"
              lang={lang}
            >
              Nagarik Watch
            </p>
            <h1
              className="mt-1 max-w-[18ch] font-display text-[clamp(2.05rem,9vw,4rem)] leading-[0.98] text-ink"
              lang={lang}
            >
              {localizedTitle(locale, hub)}
            </h1>
          </div>
          {stories.length > 0 ? (
            <p className="border-b border-brand pb-1 text-meta font-semibold text-ink-soft" lang={lang}>
              {locale === 'en' ? `${stories.length} current items` : `हाल ${stories.length} सामग्री`}
            </p>
          ) : null}
        </div>
        <p className="mt-4 max-w-body text-body-lg leading-relaxed text-ink-soft" lang={lang}>
          {localizedLead(locale, hub)}
        </p>
      </header>

      {hub.mode === 'trending' ? (
        <aside className="mt-5 border-y border-warning py-3 text-meta leading-relaxed text-ink-soft" lang={lang}>
          {rankingNotice}
        </aside>
      ) : null}

      {hub.mode === 'utility' ? (
        <div className="mt-8">
          <UtilityWidgetRail locale={locale} />
        </div>
      ) : null}

      {hub.key === 'submit-story' ? <ReaderSubmissionWorkflow locale={locale} /> : null}

      {stories.length > 0 ? (
        <section className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(19rem,0.75fr)]">
          {leadStory ? <StoryCard story={leadStory} locale={locale} variant="featured" /> : null}
          <div className="grid content-start gap-5 border-t border-rule pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            {sideStories.map((story) => (
              <StoryCard key={story.slug} story={story} locale={locale} variant="horizontal" />
            ))}
          </div>
        </section>
      ) : (
        <div className="mt-8 border-y border-rule py-10" lang={lang}>
          <p className="max-w-body text-body-lg text-ink-soft">{empty}</p>
          <p className="mt-2 max-w-body text-meta text-ink-muted">
            {locale === 'en'
              ? 'The section stays visibly empty rather than being filled with invented reporting or generic demo cards.'
              : 'बनावटी समाचार वा सामान्य डेमो कार्ड राख्नुको सट्टा यो खण्ड स्पष्ट रूपमा खाली देखाइएको छ।'}
          </p>
        </div>
      )}

      {stories.length > 0 ? (
        <div className="mt-10 border-y border-rule py-5">
          <AdSlot locale={locale} placementKey="hub-inline" variant="native" />
        </div>
      ) : null}

      {compactStories.length > 0 ? (
        <section className="mt-10">
          <div className="mb-5 flex items-center gap-4 border-b border-rule pb-3">
            <h2 className="font-display text-h2 text-ink" lang={lang}>
              {locale === 'en' ? 'More in this section' : 'यस खण्डका थप सामग्री'}
            </h2>
            <span className="h-px flex-1 bg-rule" aria-hidden="true" />
          </div>
          <div className="grid gap-x-7 gap-y-9 md:grid-cols-2 xl:grid-cols-3">
            {compactStories.map((story, index) => (
              <StoryCard
                key={story.slug}
                story={story}
                locale={locale}
                variant={index % 3 === 0 ? 'text-led' : 'compact'}
              />
            ))}
          </div>
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
    <section className="mt-8 border-y border-rule bg-surface-raised py-6" lang={lang}>
      <h2 className="font-display text-h2 text-ink">
        {locale === 'en' ? 'Reader submission workflow' : 'पाठक सबमिसन कार्यप्रवाह'}
      </h2>
      <ol className="mt-4 grid border border-rule text-body text-ink-soft md:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step} className="border-b border-rule p-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
            <span className="block text-caption font-semibold text-brand-strong">
              {locale === 'en' ? `Step ${index + 1}` : `चरण ${index + 1}`}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-5 max-w-body text-meta leading-relaxed text-ink-soft">
        {locale === 'en'
          ? 'Use the form below for story tips, public-service notices, documents, photos, videos or correction requests. Nothing is published automatically; editors verify every submission first.'
          : 'समाचार टिप, सार्वजनिक सूचना, कागजात, फोटो, भिडियो वा सच्याउने अनुरोधका लागि तलको फारम प्रयोग गर्नुहोस्। कुनै कुरा स्वतः प्रकाशित हुँदैन; सम्पादकले पहिला प्रमाणित गर्छन्।'}
      </p>
      <ReaderSubmissionForm locale={locale} />
    </section>
  )
}

async function storiesForHub(
  hubKey: StaticHub['key'],
  cards: StoryCardData[],
  locale: Locale,
): Promise<StoryCardData[]> {
  const taggedHub = new Set(['editor-picks', 'exclusive', 'data-stories'])
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
    return true
  })
}

function isDataBlock(block: Article['bodyNe'][number]): boolean {
  if (block.type === 'list' && block.items.length >= 3) return true
  if (block.type === 'embed' && /data|chart|flourish|tableau/i.test(block.url)) return true
  return false
}
