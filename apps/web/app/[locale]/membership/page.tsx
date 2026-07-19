import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { isPublicMembershipEnabled, membershipMode } from '@/lib/membership'

export const dynamic = 'force-dynamic'

type Params = { locale: string }

const tiers = [
  {
    key: 'monthly',
    price: 'NPR 299',
    intervalEn: 'each month',
    intervalNe: 'प्रति महिना',
    en: 'Monthly supporter',
    ne: 'मासिक समर्थक',
    benefitsEn: ['Premium investigations', 'Synced saved reading', 'Member newsletters'],
    benefitsNe: ['Premium खोजमूलक सामग्री', 'सुरक्षित लेखको sync', 'सदस्य newsletter'],
  },
  {
    key: 'yearly',
    price: 'NPR 2,999',
    intervalEn: 'each year',
    intervalNe: 'प्रति वर्ष',
    en: 'Yearly supporter',
    ne: 'वार्षिक समर्थक',
    benefitsEn: ['Two months of value included', 'Archive access', 'Early event invitations'],
    benefitsNe: ['दुई महिनाबराबर बचत', 'Archive पहुँच', 'कार्यक्रमको प्रारम्भिक निमन्त्रणा'],
  },
]

export default async function MembershipPage({ params }: { params: Promise<Params> }) {
  if (!isPublicMembershipEnabled()) notFound()

  const locale: Locale = asLocale((await params).locale)
  const ne = locale === 'ne'
  const mode = membershipMode()

  return (
    <main className="mx-auto max-w-page px-4 py-10 md:py-14">
      <header className="grid gap-8 border-b-2 border-ink pb-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
        <div>
          <p
            className="text-meta font-bold uppercase tracking-[0.16em] text-brand-strong"
            lang="en"
          >
            Nagarik Watch Membership
          </p>
          <h1
            className="mt-3 max-w-5xl font-display text-[clamp(2.35rem,7vw,5rem)] leading-[1.03] tracking-[-0.035em] text-ink"
            lang={ne ? 'ne' : 'en'}
          >
            {ne
              ? 'स्वतन्त्र पत्रकारितालाई पाठकले टिकाउने बाटो।'
              : 'A reader-funded route to independent journalism.'}
          </h1>
          <p
            className="mt-5 max-w-body text-body-lg leading-relaxed text-ink-soft"
            lang={ne ? 'ne' : 'en'}
          >
            {ne
              ? 'दैनिक समाचार खुला रहन्छ। सदस्यताको आम्दानी खोजमूलक रिपोर्टिङ, अभिलेख र पाठक सेवामा लगाइन्छ। सम्पादकीय निर्णय किन्न होइन।'
              : 'Daily news remains open. Member revenue supports investigations, archives and reader services. It never purchases editorial influence.'}
          </p>
        </div>
        <aside
          className="border border-rule bg-brand-tint/40 px-5 py-4"
          aria-label={ne ? 'सक्रियता अवस्था' : 'Activation status'}
        >
          <p
            className="text-caption font-bold uppercase tracking-[0.14em] text-ink-soft"
            lang={ne ? 'ne' : 'en'}
          >
            {ne ? 'हालको सक्रियता' : 'Current activation'}
          </p>
          <p className="mt-2 text-body leading-relaxed text-ink" lang={ne ? 'ne' : 'en'}>
            {mode === 'payment'
              ? ne
                ? 'भुक्तानी कन्फिगरेसन उपलब्ध छ। उत्पादन परीक्षणपछि मात्र checkout सार्वजनिक गर्नुहोस्।'
                : 'Payment configuration is present. Publish checkout only after a production transaction test.'
              : ne
                ? 'अहिले म्यानुअल सक्रियता चलिरहेको छ। अनुरोध आएपछि न्यूजरुमले सदस्य पहुँच सक्रिय गर्छ।'
                : 'Manual activation is currently in use. The newsroom enables access after reviewing a request.'}
          </p>
        </aside>
      </header>

      <section className="mt-10 border-t border-rule" aria-labelledby="membership-options">
        <div className="grid border-b border-rule py-4 text-caption font-bold uppercase tracking-[0.14em] text-ink-soft md:grid-cols-[1fr_12rem_1.35fr_12rem]">
          <h2 id="membership-options" className="font-inherit">
            {ne ? 'सदस्यता' : 'Membership'}
          </h2>
          <span className="hidden md:block">{ne ? 'योगदान' : 'Contribution'}</span>
          <span className="hidden md:block">{ne ? 'के समावेश हुन्छ' : 'What it includes'}</span>
          <span className="hidden md:block">{ne ? 'अर्को कदम' : 'Next step'}</span>
        </div>
        {tiers.map((tier) => (
          <article
            key={tier.key}
            className="grid gap-5 border-b border-rule py-7 md:grid-cols-[1fr_12rem_1.35fr_12rem] md:items-start"
          >
            <div>
              <p className="font-display text-h2 text-ink" lang={ne ? 'ne' : 'en'}>
                {ne ? tier.ne : tier.en}
              </p>
              <p className="mt-1 text-meta text-ink-soft" lang={ne ? 'ne' : 'en'}>
                {ne ? 'कुनै पनि खरिद सम्पादकीय प्रभाव होइन' : 'No editorial strings attached'}
              </p>
            </div>
            <div>
              <p className="font-display text-h1 text-brand-strong" lang="en">
                {tier.price}
              </p>
              <p className="text-meta text-ink-soft" lang={ne ? 'ne' : 'en'}>
                {ne ? tier.intervalNe : tier.intervalEn}
              </p>
            </div>
            <ul
              className="grid gap-2 text-body leading-relaxed text-ink-soft"
              lang={ne ? 'ne' : 'en'}
            >
              {(ne ? tier.benefitsNe : tier.benefitsEn).map((benefit) => (
                <li key={benefit} className="grid grid-cols-[1rem_1fr] gap-2">
                  <span className="font-bold text-brand" aria-hidden="true">
                    ·
                  </span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            {mode === 'payment' ? (
              <form action="/api/payments/checkout" method="post">
                <input type="hidden" name="plan" value={tier.key} />
                <input type="hidden" name="locale" value={locale} />
                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center border-b-2 border-brand bg-brand px-4 text-center text-meta font-bold text-surface transition-colors hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-tint focus:ring-offset-2"
                >
                  {ne ? 'सुरक्षित checkout' : 'Secure checkout'}
                </button>
              </form>
            ) : (
              <a
                href="mailto:membership@nagarikwatch.com?subject=Nagarik%20Watch%20membership"
                className="inline-flex min-h-11 items-center justify-center border-b-2 border-brand bg-brand px-4 text-center text-meta font-bold text-surface transition-colors hover:bg-brand-strong focus:outline-none focus:ring-2 focus:ring-brand-tint focus:ring-offset-2"
              >
                {ne ? 'अनुरोध पठाउनुहोस्' : 'Request access'}
              </a>
            )}
          </article>
        ))}
      </section>

      <section className="mt-12 grid gap-6 border-t-2 border-ink pt-6 md:grid-cols-[15rem_1fr]">
        <h2 className="font-display text-h1 text-ink" lang={ne ? 'ne' : 'en'}>
          {ne ? 'सम्पादकीय स्वतन्त्रता' : 'Editorial independence'}
        </h2>
        <div>
          <p
            className="max-w-body text-body-lg leading-relaxed text-ink-soft"
            lang={ne ? 'ne' : 'en'}
          >
            {ne
              ? 'सदस्य, विज्ञापनदाता वा sponsor कसैले पनि coverage, headline, निष्कर्ष वा समाचार हटाउने निर्णय किन्न सक्दैन। आम्दानी र सम्पादकीय कामबीच स्पष्ट पर्खाल रहन्छ।'
              : 'Members, advertisers and sponsors cannot buy coverage, headlines, conclusions or removals. Revenue and editorial decision-making remain institutionally separate.'}
          </p>
          <a
            href={localizeHref(locale, '/ethics')}
            className="mt-5 inline-flex border-b border-brand pb-1 text-meta font-bold text-brand-strong hover:text-ink"
          >
            {ne ? 'सम्पादकीय आचारसंहिता पढ्नुहोस् →' : 'Read the editorial ethics policy →'}
          </a>
        </div>
      </section>
    </main>
  )
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  if (!isPublicMembershipEnabled()) {
    return { robots: { index: false, follow: false } }
  }
  const locale: Locale = asLocale((await params).locale)
  return {
    title: locale === 'en' ? 'Membership' : 'सदस्यता',
    alternates: { canonical: localizeHref(locale, '/membership') },
  }
}
