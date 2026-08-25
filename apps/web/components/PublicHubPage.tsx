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
import { DeskHoldingPage } from '@/components/public/DeskHoldingPage'

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
  const rankedTop = ranked.slice(0, 12)
  let stories: StoryCardData[] = rankedTop
  // Sparse specialty desks (a tag with two stories, a new desk) backfill from
  // the newest pool so the page never renders one lonely item above a void.
  if (rankedTop.length < 6) {
    const fill = await getStories({ locale, perPage: 12 }).catch(() => ({ items: [] as StoryCardData[] }))
    const seen = new Set(stories.map((story) => story.id))
    stories = [...rankedTop, ...fill.items.filter((story) => !seen.has(story.id))].slice(0, 9)
  }
  const lang = locale === 'en' ? 'en' : 'ne'

  return (
    <div className="mx-auto max-w-page px-3 py-4 sm:px-4 sm:py-5">
      <HubIndexHeader
        title={localizedTitle(locale, hub)}
        lead={localizedLead(locale, hub)}
        lang={lang}
      />

      <AdSlot locale={locale} placementKey="hub-top" variant="standard" className="mt-4" />

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
            midSlot={<AdSlot locale={locale} placementKey="hub-inline" variant="native" />}
          />
        </div>
      ) : hub.key === 'submit-story' ? null : (
        // Holding page (plan system 1.2): an empty desk still composes an
        // editor note plus evergreen sibling stories — never a bare sentence.
        <EmptyHubHolding hub={hub} locale={locale} />
      )}
    </div>
  )
}

async function EmptyHubHolding({ hub, locale }: { hub: StaticHub; locale: Locale }) {
  const fallback = await getStories({ locale, perPage: 6 }).catch(() => ({
    items: [] as StoryCardData[],
  }))
  const en = locale === 'en'
  const note =
    hub.key === 'exclusive'
      ? en
        ? 'Our investigations desk is preparing its first long-form reports. Meanwhile, these recent stories show the standard of verification we hold every claim to.'
        : 'हाम्रो खोजमूलक डेस्कले पहिलो लामा रिपोर्ट तयार गरिरहेको छ। यसैबीच, यी हालका समाचारले हामी प्रत्येक दाबीलाई कस्तो प्रमाणीकरण दिन्छौं भन्ने नमूना देखाउँछन्।'
      : hub.key === 'photos'
        ? en
          ? 'The photo desk launches with its first galleries soon. These recent stories carry the photography running across today\u2019s edition.'
          : 'फोटो डेस्क चाँडै पहिला ग्यालरीसहित सुरु हुँदैछ। यी हालका समाचारमा आजको संस्करणभरि छापिएका तस्बिरहरू छन्।'
        : hub.key === 'video'
          ? en
            ? 'Video reporting begins with our first field packages. Until then, these stories show the desk\u2019s editorial ground.'
            : 'भिडियो रिपोर्टिङ पहिला फिल्ड प्याकेजसहित सुरु हुँदैछ। त्यसअघि यी समाचारले डेस्कको सम्पादकीय आधार देखाउँछन्।'
          : en
            ? 'This section is being filled as stories pass editorial review. The newest verified reporting from the newsroom is shown below.'
            : 'सम्पादकीय समीक्षा पूरा भएका समाचार यस खण्डमा थपिँदै छन्। तल न्युजरुमका नयाँ प्रमाणित समाचार देखाइएका छन्।'
  return (
    <DeskHoldingPage
      locale={locale}
      kicker={en ? 'Editor\u2019s note' : 'सम्पादकीय नोट'}
      note={note}
      fallbackStories={fallback.items}
      fallbackLabel={en ? 'Latest from the newsroom' : 'न्युजरुमबाट ताजा'}
      ctaHref={hub.key === 'exclusive' ? '/submit-story' : undefined}
      ctaLabel={hub.key === 'exclusive' ? (en ? 'Send an investigation tip' : 'खोजमूलक टिप पठाउनुहोस्') : undefined}
    />
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
