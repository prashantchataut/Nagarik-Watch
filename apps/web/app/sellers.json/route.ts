import { PUBLICATION } from '@/lib/site'

function defaultSellersJson(): string {
  return JSON.stringify(
    {
      version: '1.0',
      contact_email: PUBLICATION.email,
      sellers: [],
    },
    null,
    2,
  )
}

export function GET() {
  const configuredBody = process.env.SELLERS_JSON_BODY?.trim()
  const body = configuredBody || defaultSellersJson()

  return new Response(`${body}\n`, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}
