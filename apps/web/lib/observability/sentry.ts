/**
 * Sentry boundary. Ready only after @sentry/nextjs initializes with a DSN.
 * Audience analytics stay consent-gated elsewhere; this SDK does not set
 * advertising cookies or send pageview beacons.
 */

export type SentryState = {
  ready: boolean
  dsnConfigured: boolean
  detail: string
}

let sdkInitialized = false

export function sentryDsn(): string {
  return process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || ''
}

export function markSentrySdkInitialized(): void {
  sdkInitialized = true
}

export function getSentryState(): SentryState {
  const dsn = sentryDsn()
  if (!dsn) {
    return {
      ready: false,
      dsnConfigured: false,
      detail: 'SENTRY_DSN unset. Errors log to console only.',
    }
  }
  if (!sdkInitialized) {
    return {
      ready: false,
      dsnConfigured: true,
      detail: 'SENTRY_DSN is set but the Sentry SDK has not initialized in this process yet.',
    }
  }
  return {
    ready: true,
    dsnConfigured: true,
    detail: 'Sentry SDK initialized and receiving server exceptions.',
  }
}

/** Capture a client/server exception without breaking the request path. */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  const state = getSentryState()
  console.error(
    '[observability]',
    JSON.stringify({
      sentry: state,
      error:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              digest: (error as { digest?: string }).digest,
            }
          : String(error),
      context,
    }),
  )
  if (!state.ready) return
  void import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.captureException(error, { extra: context })
    })
    .catch(() => undefined)
}
