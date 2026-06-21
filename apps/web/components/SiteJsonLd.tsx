import { PUBLICATION, SITE_URL } from '@/lib/site'

function verified(value: string): string | undefined {
  const lower = value.toLowerCase()
  if (lower.includes('placeholder') || lower.includes('pending') || lower.includes('to be')) {
    return undefined
  }
  return value
}

export function SiteJsonLd({ siteName }: { siteName: string }) {
  const graph = [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: siteName,
      legalName: verified(PUBLICATION.legalName),
      url: SITE_URL,
      logo: `${SITE_URL}${PUBLICATION.logoPath}`,
      email: PUBLICATION.email,
      address: verified(PUBLICATION.address),
      publishingPrinciples: `${SITE_URL}/editorial-policy`,
      correctionsPolicy: `${SITE_URL}/corrections-policy`,
      ownershipFundingInfo: `${SITE_URL}/about`,
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: siteName,
      url: SITE_URL,
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  ]

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }),
      }}
    />
  )
}
