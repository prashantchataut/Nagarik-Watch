/**
 * Thin Sentry boundary. No SDK dependency until SENTRY_DSN is set and
 * @sentry/nextjs is installed. Callers stay honest: disabled when unset.
 */

export type SentryState = {
  ready: boolean
  dsnConfigured: boolean
  detail: string
}

export function getSentryState(): SentryState {
  const dsn = process.env.SENTRY_DSN?.trim() || process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()
  if (!dsn) {
    return {
      ready: false,
      dsnConfigured: false,
      detail: 'SENTRY_DSN unset. Errors log to console only.',
    }
  }
  // DSN alone is not a live SDK. Never report ready until @sentry/nextjs is installed and initialized.
  return {
    ready: false,
    dsnConfigured: true,
    detail:
      'SENTRY_DSN is set but @sentry/nextjs is not wired. Errors still log to console only — do not treat launch probes as Sentry-backed.',
  }
}

/** Capture a client/server exception without requiring the Sentry package. */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  const state = getSentryState()
  console.error(
    '[observability]',
    JSON.stringify({
      sentry: state,
      error:
        error instanceof Error
          ? { name: error.name, message: error.message, digest: (error as { digest?: string }).digest }
          : String(error),
      context,
    }),
  )
}
