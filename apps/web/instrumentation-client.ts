import * as Sentry from '@sentry/nextjs'
import { markSentrySdkInitialized } from '@/lib/observability/sentry'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    sendDefaultPii: false,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  })
  markSentrySdkInitialized()
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
