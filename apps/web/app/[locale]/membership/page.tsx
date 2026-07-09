import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { membershipMode } from '@/lib/membership'

export const dynamic = 'force-dynamic'

type Params = { locale: string }

const tiers = [
  {
    key: 'monthly',
    price: 'NPR 299',
    en: 'Monthly supporter',
    ne: 'मासिक समर्थक',
    benefitsEn: ['Premium investigations', 'Saved reading sync', 'Member-only newsletters'],
    benefitsNe: ['Premium अनुसन्धान', 'Saved reading sync', 'Member-only newsletter'],
  },
  {
    key: 'yearly',
    price: 'NPR 2,999',
    en: 'Yearly supporter',
    ne: 'वार्षिक समर्थक',
    benefitsEn: ['Two months free', 'Archive access', 'Early event invitations'],
    benefitsNe: ['दुई महिना बराबर बचत', 'Archive access', 'Event invitation पहिले'],
  },
]

export default async function MembershipPage({ params }: { params: Promise<Params> }) {
  const locale: Locale = asLocale((await params).locale)
  const ne = locale === 'ne'
  const mode = membershipMode()

  return (
    <main className="mx-auto max-w-page px-4 py-10">
      <header className="rounded-3xl border border-rule bg-surface-raised p-6 shadow-card md:p-8">
        <p className="text-meta font-bold uppercase tracking-wide text-brand-strong" lang="en">
          Nagarik Watch Membership
        </p>
        <h1 className="mt-2 max-w-4xl font-display text-[clamp(2.2rem,8vw,4.6rem)] leading-tight text-ink" lang={ne ? 'ne' : 'en'}>
          {ne ? 'स्वतन्त्र न्यूजरुमलाई टिकाउने सदस्यता।' : 'Support a newsroom that does not hide its funding model.'}
        </h1>
        <p className="mt-4 max-w-body text-body-lg leading-relaxed text-ink-soft" lang={ne ? 'ne' : 'en'}>
          {ne
            ? 'समाचार निःशुल्क रहन्छ। Premium अनुसन्धान, archive र member सुविधा सदस्यताबाट खुल्छन्।'
            : 'Core news remains free. Membership unlocks premium investigations, archive access and reader tools.'}
        </p>
        <div className="mt-5 rounded-xl border border-rule bg-surface px-4 py-3 text-meta text-ink-soft" lang={ne ? 'ne' : 'en'}>
          {mode === 'payment'
            ? ne
              ? 'Payment provider कन्फिगर छ; checkout flow सक्रिय गर्न सकिन्छ।'
              : 'Payment provider variables are configured; checkout can be enabled.'
            : ne
              ? 'हाल manual activation mode छ: admin ले PAID_MEMBER_EMAILS वा subscription override बाट access दिन्छ।'
              : 'Manual activation mode: admins grant access through PAID_MEMBER_EMAILS or a subscription override until payment is connected.'}
        </div>
      </header>

      <section className="mt-8 grid gap-5 md:grid-cols-2">
        {tiers.map((tier) => (
          <article key={tier.key} className="rounded-2xl border border-rule bg-surface-raised p-6 shadow-card">
            <h2 className="font-display text-h1 text-ink" lang={ne ? 'ne' : 'en'}>
              {ne ? tier.ne : tier.en}
            </h2>
            <p className="mt-3 font-display text-display text-brand-strong" lang="en">
              {tier.price}
            </p>
            <ul className="mt-5 grid gap-2 text-body text-ink-soft" lang={ne ? 'ne' : 'en'}>
              {(ne ? tier.benefitsNe : tier.benefitsEn).map((benefit) => (
                <li key={benefit} className="flex gap-2">
                  <span className="text-brand" aria-hidden="true">•</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
            <a
              href="mailto:membership@nagarikwatch.com?subject=Nagarik%20Watch%20membership"
              className="mt-6 inline-flex h-11 items-center rounded-full bg-brand px-5 text-body font-bold text-surface hover:bg-brand-strong"
            >
              {ne ? 'सदस्यता अनुरोध गर्नुहोस्' : 'Request activation'}
            </a>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-rule bg-surface-raised p-6">
        <h2 className="font-display text-h1 text-ink" lang={ne ? 'ne' : 'en'}>
          {ne ? 'नीति स्पष्ट' : 'Clear policy'}
        </h2>
        <p className="mt-3 max-w-body text-body leading-relaxed text-ink-soft" lang={ne ? 'ne' : 'en'}>
          {ne
            ? 'सदस्यताले सम्पादकीय निर्णय किन्दैन। विज्ञापन, sponsorship र सदस्यता editorial coverage बाट अलग रहन्छ।'
            : 'Membership never buys editorial influence. Ads, sponsorship and reader revenue stay separate from coverage decisions.'}
        </p>
        <a href={localizeHref(locale, '/ethics')} className="mt-4 inline-flex text-meta font-semibold text-brand-strong hover:underline">
          {ne ? 'Ethics policy पढ्नुहोस्' : 'Read the ethics policy'}
        </a>
      </section>
    </main>
  )
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const locale: Locale = asLocale((await params).locale)
  return {
    title: locale === 'en' ? 'Membership' : 'सदस्यता',
    alternates: { canonical: localizeHref(locale, '/membership') },
  }
}
