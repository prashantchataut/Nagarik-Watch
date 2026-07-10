import { toNextJsHandler } from 'better-auth/next-js'
import { getAuth } from '@/lib/auth'

async function handler(request: Request) {
  try {
    const auth = await getAuth()
    const handlers = toNextJsHandler(auth)
    return request.method === 'GET' ? handlers.GET(request) : handlers.POST(request)
  } catch (error) {
    console.error('[auth] request failed', error)
    return Response.json(
      { error: { code: 'AUTH_UNAVAILABLE', message: 'Authentication is temporarily unavailable.' } },
      { status: 503, headers: { 'cache-control': 'no-store' } },
    )
  }
}

export const GET = handler
export const POST = handler
