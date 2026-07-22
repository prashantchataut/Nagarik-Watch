export const dynamic = 'force-static'
import { PUBLICATION, SITE_URL } from '@/lib/site'

function defaultAdsTxt(): string {
  const siteHostname = new URL(SITE_URL).hostname
  const emailDomain = PUBLICATION.email.split('@')[1]?.trim()
  const ownerDomain = siteHostname === 'localhost' ? emailDomain : siteHostname

  return [
    '# Nagarik Watch inventory is house/direct-only until ad-network seller IDs are configured.',
    ...(ownerDomain ? [`OWNERDOMAIN=${ownerDomain}`] : []),
    ...(PUBLICATION.email ? [`CONTACT=${PUBLICATION.email}`] : []),
    '',
  ].join('\n')
}

export function GET() {
  const configuredBody = process.env.ADS_TXT_BODY?.trim()
  const body = configuredBody ? `${configuredBody}\n` : defaultAdsTxt()

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
