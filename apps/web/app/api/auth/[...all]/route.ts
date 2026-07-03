/**
 * Better Auth catch-all API route. All auth requests (/api/auth/sign-in,
 * /api/auth/sign-up, /api/auth/sign-out, /api/auth/get-session, …) flow
 * through here. Better Auth handles the routing, validation, rate-limiting,
 * and cookie signing; we just bridge Next.js Request/Response.
 *
 * The auth instance is async (PGlite/Postgres init), so the handlers are built
 * lazily on the first request — never at module-eval time (which would break
 * `next build`'s page-data collection, since PGlite can't boot in the build
 * sandbox).
 */
import 'server-only'
import type { NextRequest } from 'next/server'
import { getAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

type RouteHandler = (req: NextRequest) => Promise<Response>

let handlerPromise: Promise<{ GET: RouteHandler; POST: RouteHandler }> | null = null

async function getHandler() {
  if (!handlerPromise) {
    handlerPromise = getAuth().then(async (auth) => {
      const { toNextJsHandler } = await import('better-auth/next-js')
      const h = toNextJsHandler(auth) as unknown as {
        GET: RouteHandler
        POST: RouteHandler
      }
      return h
    })
  }
  return handlerPromise
}

export async function GET(request: NextRequest) {
  const handler = await getHandler()
  return handler.GET(request)
}

export async function POST(request: NextRequest) {
  const handler = await getHandler()
  return handler.POST(request)
}
