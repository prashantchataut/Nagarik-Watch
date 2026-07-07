import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { AdSlot } from '@/components/AdSlot'
import { AD_PLACEMENTS } from '@/lib/ads'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

export default async function AdvertisePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const placements = Object.values(AD_PLACEMENTS)
  const featured = placements.filter((p) => ['home-top', 'home-billboard', 'article-sidebar-sticky', 'mobile-sticky'].includes(p.key))

  return (
    <main className="mx-auto max-w-page px-4 py-10" lang={lang}>
      <header className="grid gap-8 border-b border-rule pb-8 lg:grid-cols-[1fr_0.42fr] lg:items-end">
        <div>
          <p className="text-caption font-bold uppercase tracking-[0.18em] text-brand-strong" lang="en">
            Media kit
          </p>
          <h1 className="mt-2 font-display text-[clamp(2.2rem,9vw,4.5rem)] font-extrabold leading-tight text-ink">
            {en ? 'Advertise with Nagarik Watch' : 'नागरिक वाचमा विज्ञापन'}
          </h1>
          <p className="mt-4 max-w-3xl text-body-lg leading-relaxed text-ink-soft">
            {en
              ? 'Commercial campaigns are sold separately from editorial work. Every ad, native unit and sponsored package is visibly labelled before it reaches readers.'
              : 'व्यावसायिक अभियान सम्पादकीय कामबाट अलग राखिन्छ। हरेक विज्ञापन, native unit र sponsored package पाठकसम्म पुग्नुअघि स्पष्ट लेबल हुन्छ।'}
          </p>
        </div>
        <div className="rounded-xl border border-rule bg-surface-raised p-5">
          <p className="text-meta font-bold text-ink">{en ? 'Sales contact' : 'विज्ञापन सम्पर्क'}</p>
          <p className="mt-2 text-body text-ink-soft" lang="en">ads@nagarikwatch.com</p>
          <p className="mt-2 text-meta text-ink-soft">
            {en
              ? 'Share campaign dates, target surface, creative size and billing details.'
              : 'अभियान मिति, लक्षित सतह, creative size र billing विवरण पठाउनुहोस्।'}
          </p>
        </div>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-3" aria-label={en ? 'Commercial principles' : 'व्यावसायिक नियम'}>
        {(en
          ? [
              ['Clear labels', 'Advertisement, sponsored and native units are never disguised as newsroom copy.'],
              ['Reserved sizes', 'Slots reserve width and height before campaigns load, reducing layout shift.'],
              ['Stable keys', 'Sales and engineering use the same placement keys for reporting and delivery.'],
            ]
          : [
              ['स्पष्ट label', 'विज्ञापन, sponsored र native सामग्री न्यूजरुम copy जसरी लुकाइँदैन।'],
              ['सुरक्षित आकार', 'अभियान load हुनुअघि slot को width र height सुरक्षित हुन्छ।'],
              ['स्थिर key', 'Sales र engineering ले reporting र delivery का लागि एउटै placement key प्रयोग गर्छन्।'],
            ]
        ).map(([title, body]) => (
          <article key={title} className="rounded-xl border border-rule bg-surface-raised p-5">
            <h2 className="font-display text-h2 text-ink">{title}</h2>
            <p className="mt-2 text-body leading-relaxed text-ink-soft">{body}</p>
          </article>
        ))}
      </section>

      <section className="mt-10" aria-label={en ? 'Featured placements' : 'प्रमुख विज्ञापन स्थान'}>
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-3">
          <div>
            <p className="text-caption font-bold uppercase tracking-[0.16em] text-brand-strong" lang="en">Inventory</p>
            <h2 className="font-display text-h1 text-ink">{en ? 'Featured ad inventory' : 'प्रमुख विज्ञापन inventory'}</h2>
          </div>
          <a href="#placement-table" className="text-meta font-semibold text-brand-strong hover:underline">
            {en ? 'View all placements' : 'सबै placement हेर्नुहोस्'}
          </a>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {featured.map((p) => (
            <div key={p.key} className="rounded-xl border border-rule bg-surface-raised p-4">
              <AdSlot locale={locale} placementKey={p.key} variant={p.size === 'billboard' ? 'billboard' : p.size === 'mobile' ? 'mobile' : 'rail'} />
              <dl className="mt-4 grid gap-2 text-meta text-ink-soft sm:grid-cols-2">
                <div><dt className="font-semibold text-ink">Key</dt><dd lang="en">{p.key}</dd></div>
                <div><dt className="font-semibold text-ink">Size</dt><dd lang="en">{p.width}×{p.height}</dd></div>
                <div className="sm:col-span-2"><dt className="font-semibold text-ink">{en ? 'Position' : 'स्थान'}</dt><dd>{p.position}</dd></div>
              </dl>
            </div>
          ))}
        </div>
      </section>

      <section id="placement-table" className="mt-12" aria-label={en ? 'Placement table' : 'Placement तालिका'}>
        <h2 className="font-display text-h1 text-ink">{en ? 'Placement reference' : 'Placement reference'}</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-rule bg-surface-raised">
          <table className="min-w-full divide-y divide-rule text-left text-meta">
            <thead className="bg-surface text-caption uppercase tracking-wide text-mute">
              <tr>
                <th className="px-4 py-3 font-semibold">Surface</th>
                <th className="px-4 py-3 font-semibold">Key</th>
                <th className="px-4 py-3 font-semibold">Size</th>
                <th className="px-4 py-3 font-semibold">{en ? 'Where it appears' : 'देखिने ठाउँ'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {placements.map((p) => (
                <tr key={p.key}>
                  <td className="px-4 py-3 font-semibold text-ink" lang="en">{p.surface}</td>
                  <td className="px-4 py-3"><code className="rounded bg-surface px-1.5 py-0.5 font-mono text-caption text-ink-soft">{p.key}</code></td>
                  <td className="px-4 py-3" lang="en">{p.width}×{p.height}</td>
                  <td className="px-4 py-3 text-ink-soft">{p.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 rounded-xl border border-rule bg-surface-raised p-6">
        <h2 className="font-display text-h1 text-ink">{en ? 'What we will not sell' : 'हामी के बेच्दैनौँ'}</h2>
        <ul className="mt-4 grid gap-3 text-body text-ink-soft md:grid-cols-2">
          {(en
            ? ['Unlabelled sponsored stories', 'Ads that imitate breaking-news alerts', 'Political or financial claims without required disclosure', 'Creative that breaks privacy, safety or platform rules']
            : ['लेबल नभएको sponsored story', 'ब्रेकिङ समाचार alert जस्तै देखिने विज्ञापन', 'आवश्यक disclosure बिना राजनीतिक वा वित्तीय दाबी', 'privacy, safety वा platform rule तोड्ने creative']
          ).map((item) => <li key={item} className="rounded-lg border border-rule bg-surface p-3">{item}</li>)}
        </ul>
      </section>
    </main>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale: Locale = asLocale((await params).locale)
  return {
    title: locale === 'en' ? 'Advertise' : 'विज्ञापन',
    description:
      locale === 'en'
        ? 'Nagarik Watch media kit, ad placement inventory and commercial labelling rules.'
        : 'नागरिक वाच media kit, विज्ञापन placement inventory र commercial labelling नियम।',
    alternates: { canonical: localizeHref(locale, '/advertise') },
  }
}
