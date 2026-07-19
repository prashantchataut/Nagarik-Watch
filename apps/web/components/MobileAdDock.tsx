import type { Locale } from '@nagarikwatch/db'

/**
 * @deprecated Use BottomChrome — sticky mobile ads are owned by the bottom
 * surface orchestrator so they cannot collide with CookieConsent / BottomNav.
 */
export function MobileAdDock(_props: { locale: Locale }) {
  return null
}
