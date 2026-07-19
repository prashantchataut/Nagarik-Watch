import { getAuthors } from '@/lib/content'
import { PUBLICATION, SITE_URL } from '@/lib/site'

export const dynamic = 'force-static'
export const revalidate = 3600

export async function GET() {
  const authors = await getAuthors().catch(() => [])
  const lines = [
    '/* TEAM */',
    `Publisher: ${PUBLICATION.publisherName}`,
    `Contact: ${PUBLICATION.email}`,
    `Site: ${SITE_URL}`,
    '',
    '/* AUTHORS */',
    ...authors.slice(0, 40).map((author) => `${author.name} (${author.role})`),
    '',
    '/* THANKS */',
    'Readers who correct the record and tip the newsroom.',
    '',
    '/* SITE */',
    'Standards: HTML5, Next.js App Router',
    'Language: ne, en',
  ]
  return new Response(lines.join('\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}
