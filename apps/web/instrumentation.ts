import type { Instrumentation } from 'next'

type ErrorDetails = Error & {
  digest?: string
  code?: string
  cause?: unknown
}

function errorSummary(value: unknown) {
  if (!(value instanceof Error)) return { message: String(value) }
  const error = value as ErrorDetails
  const cause = error.cause as ErrorDetails | undefined
  return {
    name: error.name,
    message: error.message,
    digest: error.digest,
    code: error.code,
    cause:
      cause instanceof Error
        ? {
            name: cause.name,
            message: cause.message,
            code: cause.code,
          }
        : undefined,
  }
}

export async function register(): Promise<void> {
  if (process.env.CF_WORKERS === '1' || process.env.CF_PAGES_STATIC === '1') return
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

/**
 * Server-side request error logging for Vercel. Client error boundaries only
 * receive an opaque digest in production; this structured line preserves the
 * route and safe database error metadata without request headers or secrets.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const payload = {
    error: errorSummary(error),
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
  }
  console.error('[request-error]', JSON.stringify(payload))
  try {
    const { captureException } = await import('@/lib/observability/sentry')
    captureException(error, payload)
  } catch {
    // Observability must never break request handling.
  }
}
