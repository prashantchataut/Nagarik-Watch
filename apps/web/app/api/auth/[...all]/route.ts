import { toNextJsHandler } from 'better-auth/next-js'
import { NextResponse, type NextRequest } from 'next/server'
import { getAuth, waitForBootAccounts } from '@/lib/auth'

export const dynamic = 'force-dynamic'

type AuthHandlers = ReturnType<typeof toNextJsHandler>
let handlersPromise: Promise<AuthHandlers> | null = null

function getHandlers(): Promise<AuthHandlers> {
  if (!handlersPromise) {
    handlersPromise = getAuth()
      .then((auth) => toNextJsHandler(auth))
      .catch((error) => {
        handlersPromise = null
        throw error
      })
  }
  return handlersPromise
}

async function dispatch(request: NextRequest): Promise<Response> {
  try {
    const handlers = await getHandlers()
    if (request.method === 'POST') await waitForBootAccounts()
    const handler = request.method === 'GET' ? handlers.GET : handlers.POST
    return await handler(request)
  } catch (error) {
    console.error('[auth] request failed:', error instanceof Error ? error.message : String(error))
    return NextResponse.json(
      { code: 'AUTH_TEMPORARILY_UNAVAILABLE', message: 'Authentication is temporarily unavailable.' },
      { status: 503 },
    )
  }
}

export const GET = dispatch
export const POST = dispatch
