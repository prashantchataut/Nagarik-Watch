import { PUBLICATION, SITE_URL, isPublicPublicationValue } from '@/lib/site'

export const dynamic = 'force-static'
export const revalidate = 86400

export async function GET() {
  const expires = new Date()
  expires.setUTCFullYear(expires.getUTCFullYear() + 1)
  const contact = isPublicPublicationValue(PUBLICATION.email)
    ? `Contact: mailto:${PUBLICATION.email}`
    : `Contact: ${SITE_URL}/contact`
  const body = [
    contact,
    `Expires: ${expires.toISOString()}`,
    'Preferred-Languages: ne, en',
    `Canonical: ${SITE_URL}/.well-known/security.txt`,
    `Policy: ${SITE_URL}/ethics`,
  ].join('\n')
  return new Response(`${body}\n`, {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
