import type { Metadata } from 'next'
import { asLocale } from '@/lib/i18n/locales'
import { getSession } from '@/lib/auth/session'
import { checkEntitlement, listReplicaPages } from '@/lib/epaper'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'E-paper',
  description: 'Digital replica edition index.',
}

export default async function EpaperPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale)
  const en = locale === 'en'
  const [{ enabled, editions }, session] = await Promise.all([
    listReplicaPages(),
    getSession().catch(() => null),
  ])

  return (
    <main className="live-page">
      <header>
        <p className="section-kicker">{en ? 'Digital replica' : 'डिजिटल प्रतिलिपि'}</p>
        <h1>{en ? 'E-paper' : 'ई-पेपर'}</h1>
        <p>
          {en
            ? 'Page-for-page replica editions of the print newspaper.'
            : 'छापा पत्रिकाको पृष्ठ-दर-पृष्ठ डिजिटल प्रतिलिपि।'}
        </p>
      </header>

      {!enabled ? (
        <div className="live-empty" role="status">
          <strong>{en ? 'E-paper is not yet available' : 'ई-पेपर अहिले उपलब्ध छैन'}</strong>
          <p>
            {en
              ? 'The digital replica edition has not been configured for this site yet. Check back once the newsroom publishes print editions here.'
              : 'यो साइटका लागि डिजिटल प्रतिलिपि संस्करण अझै कन्फिगर गरिएको छैन। समाचार कक्षले यहाँ छापा संस्करण प्रकाशित गरेपछि फेरि जाँच गर्नुहोस्।'}
          </p>
        </div>
      ) : editions.length === 0 ? (
        <div className="live-empty" role="status">
          <strong>{en ? 'No replica editions published yet' : 'हालसम्म कुनै प्रतिलिपि संस्करण प्रकाशित छैन'}</strong>
          <p>
            {en
              ? 'No configured edition data was found.'
              : 'कुनै कन्फिगर गरिएको संस्करण डाटा फेला परेन।'}
          </p>
        </div>
      ) : (
        <section aria-labelledby="editions-heading">
          <h2 id="editions-heading">{en ? 'Available editions' : 'उपलब्ध संस्करणहरू'}</h2>
          <div className="alert-list">
            {editions.map((edition) => (
              <article key={`${edition.date}-${edition.edition}`}>
                <div>
                  <h2>{edition.edition}</h2>
                  <p>{new Date(edition.date).toLocaleDateString(en ? 'en-GB' : 'ne-NP')}</p>
                  <p>
                    {en
                      ? `${edition.pages.length} page(s)`
                      : `${edition.pages.length} पृष्ठ`}
                  </p>
                </div>
              </article>
            ))}
          </div>
          {editions.some((edition) => edition.pages.some((page) => page.premium)) ? (
            <EntitlementNotice enabled premium={await isAnyPremiumBlocked(editions, session)} en={en} />
          ) : null}
        </section>
      )}
    </main>
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

function EntitlementNotice({ premium, en }: { enabled: boolean; premium: boolean; en: boolean }) {
  if (!premium) return null
  return (
    <p className="text-caption text-mute">
      {en
        ? 'Some pages in this edition require a digital membership.'
        : 'यो संस्करणका केही पृष्ठहरूलाई डिजिटल सदस्यता चाहिन्छ।'}
    </p>
  )
}
