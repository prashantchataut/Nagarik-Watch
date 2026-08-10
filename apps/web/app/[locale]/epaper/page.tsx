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
        <div className="border-y border-rule py-10" role="status" lang={en ? 'en' : 'ne'}>
          <p className="font-display text-h2 font-bold text-ink">
            {en ? 'E-paper is not yet available' : 'ई-पेपर अहिले उपलब्ध छैन'}
          </p>
          <p className="mt-3 max-w-body text-body text-ink-soft">
            {en
              ? 'The digital replica has not been published yet. Meanwhile, read the latest stories or browse the newsletter archive.'
              : 'डिजिटल प्रतिलिपि अझै प्रकाशित भएको छैन। यसबीच ताजा समाचार पढ्नुहोस् वा न्युजलेटर अभिलेख हेर्नुहोस्।'}
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href={localizeHref(locale, '/latest')}
              className="text-meta font-bold text-brand-strong"
            >
              {en ? 'Latest news' : 'ताजा समाचार'}
            </Link>
            <Link
              href={localizeHref(locale, '/newsletter/archive')}
              className="text-meta font-bold text-brand-strong"
            >
              {en ? 'Newsletter archive' : 'न्युजलेटर अभिलेख'}
            </Link>
          </div>
        </div>
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
