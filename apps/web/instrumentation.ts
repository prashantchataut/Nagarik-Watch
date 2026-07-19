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

/**
 * Server-side request error logging for Vercel. Client error boundaries only
 * receive an opaque digest in production; this structured line preserves the
 * route and safe database error metadata without request headers or secrets.
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  console.error(
    '[request-error]',
    JSON.stringify({
      error: errorSummary(error),
      path: request.path,
      method: request.method,
      routePath: context.routePath,
      routeType: context.routeType,
      routerKind: context.routerKind,
    }),
  )
}
