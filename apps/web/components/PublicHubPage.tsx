import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { getStories, type StoryListOptions } from '@/lib/content'
import { rankStories } from '@/lib/ranking'
import { buildStoryEngagementIndex, signalsForStory } from '@/lib/ranking-signals'
import { localizedLead, localizedTitle, type StaticHub } from '@/lib/site'
import { HubIndexHeader } from '@/components/HubIndexHeader'
import { UtilityWidgetRail } from '@/components/live/LiveWidgets'
import { AdSlot } from '@/components/AdSlot'
import { CategoryDesk } from '@/components/category/CategoryDesk'
import { ReaderSubmissionForm } from '@/components/forms/ReaderSubmissionForm'

/** Map each hub key to real getStories filters — never return the unfiltered national pool for specialty desks. */
export function hubStoryFilters(hubKey: StaticHub['key']): StoryListOptions {
  switch (hubKey) {
    case 'editor-picks':
      return { editorPick: true }
    case 'exclusive':
      return { exclusive: true }
    case 'data-stories':
      return { dataStory: true }
    case 'fact-check':
      return { factCheck: true }
    case 'election':
      return { tag: 'local-election' }
    case 'results':
      return { tag: 'exam-results' }
    case 'sports':
    case 'sports-live':
      return { category: 'sports' }
    case 'video':
      return { hasVideo: true }
    case 'photos':
      return { hasGallery: true }
    case 'opinion':
      return { category: 'opinion' }
    case 'reader-corner':
    case 'submit-story':
      return { tag: 'reader-submission' }
    case 'archive':
    case 'latest':
    case 'trending':
    case 'most-read':
    case 'market':
    case 'utilities':
    case 'rashifal':
    case 'disaster-alerts':
    case 'membership':
      return {}
    default: {
      const _exhaustive: never = hubKey
      void _exhaustive
      return {}
    }
  }
}

export async function PublicHubPage({
  hub,
  locale,
  province,
  district,
  extraFilters,
}: {
  hub: StaticHub
  locale: Locale
  province?: string
  district?: string
  extraFilters?: StoryListOptions
}) {
  const filters: StoryListOptions = {
    locale,
    perPage: 40,
    ...hubStoryFilters(hub.key),
    ...extraFilters,
    ...(province ? { province } : {}),
    ...(district ? { district } : {}),
  }

  const [{ items }, engagement] = await Promise.all([
    getStories(filters),
    buildStoryEngagementIndex(120),
  ])
  const ranked = rankStories(items, (story, index) => signalsForStory(story, engagement, index))
  const stories = ranked.slice(0, 12)
  const lang = locale === 'en' ? 'en' : 'ne'
  const empty =
    locale === 'en'
      ? 'No stories have been published in this section yet.'
      : 'यो खण्डमा अझै समाचार प्रकाशित भएका छैनन्।'

  return (
    <div className="mx-auto max-w-page px-3 py-4 sm:px-4 sm:py-5">
      <HubIndexHeader
        title={localizedTitle(locale, hub)}
        lead={localizedLead(locale, hub)}
        lang={lang}
      />

      <AdSlot
        locale={locale}
        placementKey="hub-top"
        variant="standard"
        className="mt-4"
      />

      {hub.mode === 'utility' ? (
        <div className="mt-6">
          <UtilityWidgetRail locale={locale} />
        </div>
      ) : null}

      {hub.key === 'submit-story' ? <ReaderSubmissionWorkflow locale={locale} /> : null}

      {stories.length > 0 ? (
        <div className="mt-4">
          <CategoryDesk
            stories={stories}
            locale={locale}
            moreHeading={{ ne: 'यस खण्डका थप सामग्री', en: 'More in this section' }}
            sideKicker={{ ne: 'यहाँका अन्य', en: 'Also here' }}
            midSlot={
              <div className="border-y border-rule py-3">
                <AdSlot locale={locale} placementKey="hub-inline" variant="native" />
              </div>
            }
          />
        </div>
      ) : hub.key === 'submit-story' ? null : (
        <div className="mt-4 border-y border-rule py-5" lang={lang}>
          <p className="max-w-body text-body text-ink-soft">{empty}</p>
        </div>
      )}
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
      <h2 className="font-display text-h3 font-extrabold text-ink sm:text-h2">
        {locale === 'en' ? 'Reader submission workflow' : 'पाठक सबमिसन कार्यप्रवाह'}
      </h2>
      <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
      <ol className="mt-4 grid border border-rule text-body text-ink-soft md:grid-cols-4">
        {steps.map((step) => (
          <li
            key={step}
            className="border-b border-rule p-4 font-semibold text-ink last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
          >
            {step}
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

/** @deprecated Prefer hubStoryFilters + getStories. Kept for callers that already hold cards. */
export function filterCardsForHub(
  hubKey: StaticHub['key'],
  cards: StoryCardData[],
): StoryCardData[] {
  const filters = hubStoryFilters(hubKey)
  return cards.filter((story) => {
    if (filters.editorPick && !story.editorPick) return false
    if (filters.exclusive && !story.exclusive) return false
    if (filters.dataStory && !story.dataStory) return false
    if (filters.factCheck) {
      if (!story.factCheckStatus || story.factCheckStatus === 'not_fact_check') return false
    }
    if (filters.category && story.category.slug !== filters.category) return false
    if (filters.tag && !story.tags?.some((t) => t.slug === filters.tag)) return false
    return true
  })
}
