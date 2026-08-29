import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { AD_PLACEMENTS } from '@/lib/ads'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import Link from 'next/link'
import { InfoPageHeader } from '@/components/InfoPage'

function adSalesEmail(): string {
  const configured = process.env.NEXT_PUBLIC_AD_SALES_EMAIL?.trim()
  if (configured && configured.includes('@')) return configured
  return 'ads@nagarikwatch.com'
}

type Placement = (typeof AD_PLACEMENTS)[keyof typeof AD_PLACEMENTS]

const GROUP_ORDER = ['home', 'article', 'category', 'latest', 'trending', 'hub', 'public', 'mobile'] as const

function groupKey(key: string): (typeof GROUP_ORDER)[number] {
  const first = key.split('-')[0] ?? ''
  return (GROUP_ORDER as readonly string[]).includes(first)
    ? (first as (typeof GROUP_ORDER)[number])
    : 'home'
}

function groupLabel(group: string, en: boolean): string {
  const labels: Record<string, [string, string]> = {
    home: ['Homepage', 'गृहपृष्ठ'],
    masthead: ['Homepage', 'गृहपृष्ठ'],
    article: ['Article pages', 'लेख पृष्ठ'],
    category: ['Category pages', 'विभाग पृष्ठ'],
    latest: ['Latest stream', 'ताजा समाचार'],
    trending: ['Trending stream', 'ट्रेन्डिङ'],
    hub: ['Topic hubs', 'विषय हब'],
    public: ['Topic hubs', 'विषय हब'],
    mobile: ['Mobile', 'मोबाइल'],
  }
  const pair = labels[group] ?? labels['home']!
  return en ? pair[0] : pair[1]
}

export default async function AdvertisePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const placements = Object.values(AD_PLACEMENTS)
  const salesEmail = adSalesEmail()

  const featuredKeys = new Set([
    'home-billboard',
    'article-sidebar-sticky',
    'mobile-sticky',
  ])
  const featured = placements.filter((p) => featuredKeys.has(p.key))
  const rest = placements
    .filter((p) => !featuredKeys.has(p.key))
    .sort((a, b) => a.label.localeCompare(b.label))
  const groups = new Map<string, Placement[]>()
  for (const p of rest) {
    const g = groupKey(p.key)
    const list = groups.get(g) ?? []
    list.push(p)
    groups.set(g, list)
  }

  const principles: Array<{ title: string; body: string }> = [
    {
      title: en ? 'Always labelled' : 'सधैं लेबलसहित',
      body: en
        ? 'Advertisement and sponsored units are visibly labelled. Readers can tell commercial content from reporting at a glance.'
        : 'विज्ञापन र प्रायोजित सामग्री स्पष्ट लेबलसहित देखिन्छ। पाठकले सम्पादकीय सामग्रीबाट एक नजरमा छुट्ट्याउन सक्छन्।',
    },
    {
      title: en ? 'Stable, reserved slots' : 'स्थिर र सुरक्षित स्लट',
      body: en
        ? 'Every slot reserves its size before creative loads, so campaigns never push the page around.'
        : 'हरेक स्लटले रचना लोड हुनुअघि आकार सुरक्षित गर्छ, जसले पृष्ठ हल्लाउन दिँदैन।',
    },
    {
      title: en ? 'No intrusive formats' : 'उत्पीडक ढाँचा छैन',
      body: en
        ? 'No autoplay video, no full-screen interstitials, no popups that block reading. Clean pages keep readers, and your brand, in a good place.'
        : 'अटोप्ले भिडियो, फुल-स्क्रिन इन्टरस्टिसियल वा पढाइ रोक्ने पपअप प्रयोग हुँदैन। सफा पृष्ठले पाठक र तपाईंको ब्रान्ड दुवैलाई राम्रो सन्दर्भ दिन्छ।',
    },
  ]

  return (
    <div className="advertise-page mx-auto max-w-page px-4 py-10 sm:py-14" lang={lang}>
      <InfoPageHeader
        kicker={en ? 'Commercial partnerships' : 'व्यावसायिक साझेदारी'}
        title={en ? 'Advertise with Nagarik Watch' : 'नागरिक वाचमा विज्ञापन'}
        lead={
          en
            ? 'Reach readers who come for credible reporting. Commercial campaigns stay separate from editorial work, and every unit is clearly labelled.'
            : 'भरपर्दो पत्रकारिता खोज्न आउने पाठकसम्म पुग्नुहोस्। व्यावसायिक अभियान सम्पादकीय कामबाट अलग रहन्छ र हरेक युनिट स्पष्ट लेबलसहित देखिन्छ।'
        }
        lang={lang}
      />

      <div className="advertise-contact-strip mx-auto mt-7 grid max-w-4xl gap-4 border-y border-rule py-5 sm:grid-cols-2">
        <div>
          <p className="text-caption font-semibold text-ink-soft" lang={lang}>
            {en ? 'Sales desk' : 'विज्ञापन डेस्क'}
          </p>
          <a
            href={`mailto:${salesEmail}`}
            className="mt-1 block font-display text-h3 font-bold text-brand transition-colors duration-fast ease-out-quint hover:text-brand-strong"
            lang="en"
          >
            {salesEmail}
          </a>
        </div>
        <div>
          <p className="text-caption font-semibold text-ink-soft" lang={lang}>
            {en ? 'What to include' : 'पठाउनुपर्ने विवरण'}
          </p>
          <p className="mt-1 text-meta leading-relaxed text-ink" lang={lang}>
            {en
              ? 'Campaign dates, target surfaces, creative sizes and billing details.'
              : 'अभियान मिति, लक्षित सतह, रचना आकार र बिलिङ विवरण।'}
          </p>
        </div>
      </div>

      <section className="mt-10" aria-labelledby="advertise-principles">
        <h2 id="advertise-principles" className="font-display text-h2 text-ink">
          {en ? 'Why it works' : 'किन असरदार'}
        </h2>
        <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {principles.map((p) => (
            <div key={p.title} className="border-t-2 border-brand bg-surface-raised px-4 py-4">
              <h3 className="font-display text-body font-extrabold text-ink" lang={lang}>
                {p.title}
              </h3>
              <p className="mt-2 text-caption leading-relaxed text-ink-soft" lang={lang}>
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="advertise-featured">
        <h2 id="advertise-featured" className="font-display text-h2 text-ink">
          {en ? 'Featured placements' : 'मुख्य प्लेसमेन्ट'}
        </h2>
        <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {featured.map((p) => (
            <div key={p.key} className="border border-rule bg-surface-raised px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 font-display text-body font-extrabold text-ink" lang="en">
                  {p.label}
                </h3>
                <span
                  className="shrink-0 border border-rule bg-surface px-2 py-0.5 text-caption font-bold tabular-nums text-brand-strong"
                  lang="en"
                >
                  {p.width}×{p.height}
                </span>
              </div>
              <p className="mt-2 text-caption leading-relaxed text-ink-soft" lang={lang}>
                {en ? p.descriptionEn : p.descriptionNe}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="advertise-all">
        <h2 id="advertise-all" className="font-display text-h2 text-ink">
          {en ? 'All placements' : 'सबै प्लेसमेन्ट'}
        </h2>
        <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
        <div className="mt-4 grid gap-x-8 gap-y-6 md:grid-cols-2">
          {[...groups.entries()].map(([group, list]) => (
            <div key={group} className="min-w-0">
              <h3 className="text-meta font-extrabold uppercase tracking-[0.06em] text-mute" lang={lang}>
                {groupLabel(group, en)}
              </h3>
              <ul className="mt-2 divide-y divide-rule border-y border-rule">
                {list.map((p) => (
                  <li key={p.key} className="flex items-baseline justify-between gap-3 py-2">
                    <span className="min-w-0 text-meta font-semibold text-ink" lang="en">
                      {p.label}
                    </span>
                    <span className="shrink-0 text-caption tabular-nums text-ink-soft" lang="en">
                      {p.width}×{p.height}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3 text-caption text-mute" lang={lang}>
          {en
            ? 'Rate card and availability are shared on request. Native and sponsored packages follow the same labelling rules.'
            : 'रेट कार्ड र उपलब्धता अनुरोधमा पठाइन्छ। नेटिभ र प्रायोजित प्याकेजले उही लेबल नियम पालना गर्छन्।'}
        </p>
      </section>

      <section className="mt-10 border-t border-rule pt-8" aria-labelledby="advertise-cta">
        <div className="flex flex-wrap items-center justify-between gap-4 border border-rule bg-surface-raised px-4 py-5 sm:px-6">
          <div className="min-w-0">
            <h2 id="advertise-cta" className="font-display text-h3 text-ink" lang={lang}>
              {en ? 'Ready to plan a campaign?' : 'अभियान योजना बनाउन तयार हुनुहुन्छ?'}
            </h2>
            <p className="mt-1 text-caption text-ink-soft" lang={lang}>
              {en
                ? 'Write to the sales desk or send a message through the contact page.'
                : 'विज्ञापन डेस्कमा लेख्नुहोस् वा सम्पर्क पृष्ठबाट सन्देश पठाउनुहोस्।'}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <a
              href={`mailto:${salesEmail}`}
              className="inline-flex min-h-10 items-center bg-brand px-4 text-meta font-bold text-paper transition-colors duration-fast ease-out-quint hover:bg-brand-strong"
              lang="en"
            >
              {salesEmail}
            </a>
            <Link
              href={localizeHref(locale, '/contact')}
              className="inline-flex min-h-10 items-center border border-rule bg-surface px-4 text-meta font-bold text-ink transition-colors duration-fast ease-out-quint hover:border-brand hover:text-brand-strong"
              lang={lang}
            >
              {en ? 'Contact page' : 'सम्पर्क पृष्ठ'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  return {
    title: locale === 'en' ? 'Advertise' : 'विज्ञापन',
    alternates: { canonical: localizeHref(locale, '/advertise') },
  }
}
