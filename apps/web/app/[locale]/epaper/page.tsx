import type { Metadata } from 'next'
import Link from 'next/link'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getSession } from '@/lib/auth/session'
import { checkEntitlement, listReplicaPages } from '@/lib/epaper'
import { LiveDeskShell } from '@/components/public/LiveDeskShell'
import { isPublicMembershipEnabled } from '@/lib/membership'
import { canonicalAlternates } from '@/lib/seo/canonical'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  const en = locale === 'en'
  return {
    title: en ? 'E-paper' : 'ई-पेपर',
    description: en ? 'Digital replica edition index.' : 'डिजिटल प्रतिलिपि संस्करण सूची।',
    alternates: canonicalAlternates(locale, '/epaper'),
  }
}

export default async function EpaperPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale)
  const en = locale === 'en'
  const membershipPublic = isPublicMembershipEnabled()
  const [{ enabled, editions }, session] = await Promise.all([
    listReplicaPages(),
    getSession().catch(() => null),
  ])

  return (
    <LiveDeskShell
      locale={en ? 'en' : 'ne'}
      title={en ? 'E-paper' : 'ई-पेपर'}
      dek={
        en
          ? 'Page-for-page replica editions of the print newspaper.'
          : 'छापा पत्रिकाको पृष्ठ-दर-पृष्ठ डिजिटल प्रतिलिपि।'
      }
    >
      {!enabled || editions.length === 0 ? (
        <>
          <div className="mt-2 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,19rem)] lg:items-start lg:gap-8">
            <div
              className="relative grid min-h-[16rem] place-items-center overflow-hidden border border-rule bg-surface-raised px-6 py-10 text-center"
              role="status"
              lang={en ? 'en' : 'ne'}
              aria-label={en ? 'E-paper preview placeholder' : 'ई-पेपर पूर्वावलोकन'}
            >
              <div className="min-w-0">
                <div className="mx-auto grid h-14 w-11 place-items-center border border-rule bg-surface" aria-hidden="true">
                  <span className="grid grid-cols-2 gap-0.5">
                    {[0, 1, 2, 3].map((dot) => (
                      <span key={dot} className="block h-2.5 w-2.5 bg-brand-tint" />
                    ))}
                  </span>
                </div>
                <p className="mt-4 font-display text-h3 font-extrabold text-ink">
                  {en ? 'E-paper is in preparation' : 'ई-पेपर तयारीमा छ'}
                </p>
                <p className="mx-auto mt-2 max-w-[46ch] text-body leading-relaxed text-ink-soft">
                  {en
                    ? 'The page-for-page digital replica launches with the first print edition. Until then, every story is free to read on the site.'
                    : 'पहिलो छापिएको संस्करणसहित पृष्ठ-दर-पृष्ठ डिजिटल प्रतिलिपि सुरु हुन्छ। त्यसअघि हरेक समाचार साइटमा निःशुल्क पढ्न सकिन्छ।'}
                </p>
              </div>
            </div>

            <aside className="min-w-0 space-y-5">
              <section className="border border-rule bg-surface-raised px-3.5 py-3.5">
                <p className="font-display text-meta font-extrabold text-ink" lang={en ? 'en' : 'ne'}>
                  {en ? 'What the e-paper includes' : 'ई-पेपरमा के हुन्छ'}
                </p>
                <span className="mt-1.5 block h-0.5 w-8 bg-brand" aria-hidden="true" />
                <ul className="mt-2.5 grid gap-1.5 text-caption leading-relaxed text-ink-soft" lang={en ? 'en' : 'ne'}>
                  <li>· {en ? 'Page-for-page replica of the print edition' : 'छापा संस्करणको पृष्ठ-दर-पृष्ठ प्रतिलिपि'}</li>
                  <li>· {en ? 'Seven-day archive of past editions' : 'पछिल्ला सात दिनका संस्करण संग्रह'}</li>
                  <li>· {en ? 'Downloadable pages for offline reading' : 'अफलाइन पढाइका लागि डाउनलोड'}</li>
                </ul>
              </section>
              <section className="border border-rule bg-surface-raised px-3.5 py-3.5">
                <p className="font-display text-meta font-extrabold text-ink" lang={en ? 'en' : 'ne'}>
                  {en ? 'Read meanwhile' : 'यसैबीच पढ्नुहोस्'}
                </p>
                <span className="mt-1.5 block h-0.5 w-8 bg-brand" aria-hidden="true" />
                <ul className="mt-2.5 grid gap-1.5">
                  <li>
                    <Link href={localizeHref(locale, '/latest')} className="text-caption font-bold text-ink transition-colors duration-fast ease-out-quint hover:text-brand-strong" lang={en ? 'en' : 'ne'}>
                      {en ? 'Latest news →' : 'ताजा समाचार →'}
                    </Link>
                  </li>
                  <li>
                    <Link href={localizeHref(locale, '/newsletter/archive')} className="text-caption font-bold text-ink transition-colors duration-fast ease-out-quint hover:text-brand-strong" lang={en ? 'en' : 'ne'}>
                      {en ? 'Newsletter archive →' : 'न्युजलेटर अभिलेख →'}
                    </Link>
                  </li>
                </ul>
              </section>
            </aside>
          </div>
        </>
      ) : (
        <section aria-labelledby="editions-heading">
          <h2 id="editions-heading" className="font-display text-h2 font-extrabold text-ink">
            {en ? 'Available editions' : 'उपलब्ध संस्करणहरू'}
          </h2>
          <ul className="mt-4 divide-y divide-rule border-y border-rule">
            {editions.map((edition) => (
              <li key={`${edition.date}-${edition.edition}`} className="py-4">
                <Link
                  href={localizeHref(locale, `/epaper/${edition.date}`)}
                  className="group block"
                >
                  <p className="font-display text-h3 font-bold text-ink group-hover:text-brand-strong">
                    {edition.edition}
                  </p>
                  <p className="mt-1 text-meta text-ink-soft">
                    {new Date(edition.date).toLocaleDateString(en ? 'en-GB' : 'ne-NP')}
                    {' · '}
                    {en ? `${edition.pages.length} page(s)` : `${edition.pages.length} पृष्ठ`}
                    {' · '}
                    <span className="font-semibold text-brand-strong">
                      {en ? 'Open' : 'खोल्नुहोस्'}
                    </span>
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          {membershipPublic &&
          editions.some((edition) => edition.pages.some((page) => page.premium)) ? (
            <EntitlementNotice premium={await isAnyPremiumBlocked(editions, session)} en={en} />
          ) : null}
        </section>
      )}
    </LiveDeskShell>
  )
}

async function isAnyPremiumBlocked(
  editions: Awaited<ReturnType<typeof listReplicaPages>>['editions'],
  session: Parameters<typeof checkEntitlement>[0],
): Promise<boolean> {
  for (const edition of editions) {
    for (const page of edition.pages) {
      if (!page.premium) continue
      const check = await checkEntitlement(session, page)
      if (!check.allowed) return true
    }
  }
  return false
}

function EntitlementNotice({ premium, en }: { premium: boolean; en: boolean }) {
  if (!premium) return null
  return (
    <p className="mt-4 text-caption text-mute">
      {en
        ? 'Some pages in this edition require a digital membership.'
        : 'यो संस्करणका केही पृष्ठहरूलाई डिजिटल सदस्यता चाहिन्छ।'}
    </p>
  )
}
