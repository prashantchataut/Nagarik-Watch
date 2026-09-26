/**
 * The Sentry browser SDK is ~82 KB gzipped — on its own a fifth of this site's
 * client JavaScript, for readers who mostly arrive over Nepali mobile data. A
 * static `import * as Sentry from '@sentry/nextjs'` here puts all of it in the
 * client entry for every route whether a DSN is configured or not, and
 * `.env.example` ships `NEXT_PUBLIC_SENTRY_DSN` commented out.
 *
 * So the SDK is imported dynamically, the way `lib/observability/sentry.ts`
 * already imports it. With no DSN the chunk is never fetched. With one it is
 * fetched just after hydration, and because Sentry's global handlers do not
 * exist until then, the listeners below hold whatever fails in the gap and
 * replay it once the SDK is up.
 */
import { markSentrySdkInitialized } from '@/lib/observability/sentry'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim()

type RouterTransitionStart = (href: string, navigationType: string) => void

let captureRouterTransitionStart: RouterTransitionStart | undefined

/** Errors thrown before the SDK finished loading. Capped so a crash loop cannot grow it. */
const held: unknown[] = []

function holdError(event: ErrorEvent | PromiseRejectionEvent): void {
  if (held.length >= 10) return
  held.push(event instanceof ErrorEvent ? (event.error ?? event.message) : event.reason)
}

if (dsn) {
  window.addEventListener('error', holdError)
  window.addEventListener('unhandledrejection', holdError)

  void import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.init({
        dsn,
        tracesSampleRate: 0,
        sendDefaultPii: false,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0,
      })
      captureRouterTransitionStart = Sentry.captureRouterTransitionStart
      markSentrySdkInitialized()
      for (const error of held.splice(0)) Sentry.captureException(error)
    })
    .catch(() => undefined)
    .finally(() => {
      window.removeEventListener('error', holdError)
      window.removeEventListener('unhandledrejection', holdError)
    })
}

/**
 * Next calls this synchronously on every client navigation, so it has to exist
 * at module evaluation time rather than whenever the import above resolves.
 * Navigations before that resolves are simply not traced.
 */
export const onRouterTransitionStart: RouterTransitionStart = (href, navigationType) => {
  captureRouterTransitionStart?.(href, navigationType)
}
