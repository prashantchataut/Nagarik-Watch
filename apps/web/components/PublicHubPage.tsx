import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { StoryCard } from '@nagarikwatch/ui'
import { getStories } from '@/lib/content'
import { localizeHref } from '@/lib/i18n/locales'
import { rankStories } from '@/lib/ranking'
import { localizedLead, localizedTitle, type StaticHub } from '@/lib/site'
import { UtilityWidgetRail } from '@/components/live/LiveWidgets'

export async function PublicHubPage({ hub, locale }: { hub: StaticHub; locale: Locale }) {
  const { items } = await getStories({ locale, perPage: 12 })
  const ranked =
    hub.mode === 'trending'
      ? rankStories(items, (story, index) => ({
          editorialPriority: story.isBreaking ? 3 : 1,
          viewsPerHour: Math.max(1, 50 - index * 4),
          sharesPerHour: story.isBreaking ? 12 : 2,
        }))
      : rankStories(items, (_story, index) => ({ editorialPriority: Math.max(0, 3 - index / 4) }))
  const stories = ranked.slice(0, 9)
  const lang = locale === 'en' ? 'en' : 'ne'

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <header className="border-b border-rule pb-6">
        <p
          className="text-meta font-semibold uppercase tracking-wide text-brand-strong"
          lang={lang}
        >
          Nagarik Watch
        </p>
        <h1 className="mt-1 font-display text-display text-ink" lang={lang}>
          {localizedTitle(locale, hub)}
        </h1>
        <p className="mt-3 max-w-body text-body-lg text-ink-soft" lang={lang}>
          {localizedLead(locale, hub)}
        </p>
      </header>

      {hub.mode === 'utility' && (
        <div className="mt-8">
          <UtilityWidgetRail />
        </div>
      )}

      {hub.key === 'submit-story' ? <SubmitStoryScaffold locale={locale} /> : null}

      <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map((story) => (
          <li key={story.slug}>
            <StoryCard story={story} locale={locale} variant="default" />
          </li>
        ))}
      </ul>

      <section className="mt-12 rounded-lg border border-rule bg-brand-tint p-5">
        <h2 className="font-display text-h3 text-ink" lang={lang}>
          {locale === 'en' ? 'Production integration note' : 'उत्पादन एकीकरण नोट'}
        </h2>
        <p className="mt-2 text-body text-ink-soft" lang={lang}>
          {locale === 'en'
            ? 'This page is wired to real routes and typed scaffolds. Replace mock providers and editor-curated flags from the CMS before claiming live data, rankings or submissions are production complete.'
            : 'यो पृष्ठ वास्तविक रुट र टाइप गरिएको स्काफोल्डमा जोडिएको छ। लाइभ डाटा, र्‍याङ्किङ वा सबमिसन उत्पादनमा पूर्ण भयो भन्नुअघि CMS र वास्तविक प्रदायक जोड्नुपर्छ।'}
        </p>
      </section>
    </div>
  )
}

function SubmitStoryScaffold({ locale }: { locale: Locale }) {
  const lang = locale === 'en' ? 'en' : 'ne'
  return (
    <section className="mt-8 rounded-lg border border-rule bg-surface-raised p-5" lang={lang}>
      <h2 className="font-display text-h2 text-ink">
        {locale === 'en' ? 'Reader submission workflow' : 'पाठक सबमिसन कार्यप्रवाह'}
      </h2>
      <ol className="mt-4 grid gap-3 text-body text-ink-soft md:grid-cols-4">
        {(locale === 'en'
          ? ['Tip received', 'Evidence reviewed', 'Editor verifies', 'Published or declined']
          : ['टिप प्राप्त', 'प्रमाण समीक्षा', 'सम्पादक पुष्टि', 'प्रकाशित वा अस्वीकार']
        ).map((step) => (
          <li key={step} className="rounded-md border border-rule bg-surface p-3">
            {step}
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
