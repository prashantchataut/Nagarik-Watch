import * as Sentry from '@sentry/nextjs'
import { markSentrySdkInitialized, sentryDsn } from '@/lib/observability/sentry'

const dsn = sentryDsn()
if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    sendDefaultPii: false,
    enableLogs: false,
  })
  markSentrySdkInitialized()
}
