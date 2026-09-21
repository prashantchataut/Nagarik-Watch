// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CookieConsent } from '@/components/CookieConsent'
import {
  CONSENT_KEY,
  CONSENT_POLICY_VERSION,
  openCookiePreferences,
  readConsent,
} from '@/lib/reader/consent'
import {
  cleanupRendered,
  click,
  flush,
  getButton,
  getControl,
  queryByText,
  renderClient,
} from '@/test/render'

/**
 * A regression in this component is a legal problem rather than a UX one: the
 * only thing standing between the site and an un-consented tracker is what
 * these buttons write. So the assertions are all about the stored grant, not
 * about the markup.
 */

function storedConsent() {
  const raw = window.localStorage.getItem(CONSENT_KEY)
  return raw ? (JSON.parse(raw) as Record<string, unknown>) : null
}

/**
 * The preferences dialog is always in the tree (closed `<dialog>`), and its
 * heading reads the same as the banner's — so "is the banner up?" has to be a
 * query for the banner element, not for its text.
 */
function banner(container: HTMLElement) {
  return container.querySelector('[data-cookie-banner]')
}

function consentCookie() {
  const match = /(?:^|;\s*)nw_consent=([^;]*)/.exec(document.cookie)
  return match ? (JSON.parse(decodeURIComponent(match[1])) as Record<string, unknown>) : null
}

describe('CookieConsent', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.cookie = 'nw_consent=; Path=/; Max-Age=0'
  })

  afterEach(() => {
    cleanupRendered()
  })

  it('shows the banner only until a choice exists', () => {
    const first = renderClient(<CookieConsent locale="en" />)
    expect(banner(first.container)).not.toBeNull()
    first.unmount()

    window.localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({
        essential: true,
        personalization: true,
        analytics: true,
        advertising: false,
        decidedAt: new Date().toISOString(),
        version: CONSENT_POLICY_VERSION,
      }),
    )

    const second = renderClient(<CookieConsent locale="en" />)
    expect(banner(second.container)).toBeNull()
  })

  it('records a real refusal when the reader picks essential only', () => {
    const { container } = renderClient(<CookieConsent locale="en" />)
    click(getButton(container, 'Essential only'))

    expect(storedConsent()).toMatchObject({
      essential: true,
      personalization: false,
      analytics: false,
      advertising: false,
      version: CONSENT_POLICY_VERSION,
    })
    // The cookie is what the server reads; storage alone is not enough.
    expect(consentCookie()).toMatchObject({
      personalization: false,
      analytics: false,
      advertising: false,
    })
    expect(banner(container)).toBeNull()
  })

  it('grants every optional category only on the explicit accept', () => {
    const { container } = renderClient(<CookieConsent locale="en" />)
    click(getButton(container, 'Accept optional'))

    expect(readConsent()).toMatchObject({
      personalization: true,
      analytics: true,
      advertising: true,
    })
  })

  it('saves exactly the categories ticked in preferences, and nothing more', () => {
    const { container } = renderClient(<CookieConsent locale="en" />)
    click(getButton(container, 'Customize'))

    click(getControl(document.body, /Analytics/))
    click(getButton(document.body, 'Save choices'))

    expect(storedConsent()).toMatchObject({
      personalization: false,
      analytics: true,
      advertising: false,
    })
  })

  it('does not persist anything when preferences are cancelled', () => {
    const { container } = renderClient(<CookieConsent locale="en" />)
    click(getButton(container, 'Customize'))
    click(getControl(document.body, /Analytics/))
    // "Back", not "Cancel": the reader reached preferences from the banner and
    // has still not decided, so the banner must come back untouched.
    click(getButton(document.body, 'Back'))

    expect(storedConsent()).toBeNull()
    expect(banner(container)).not.toBeNull()
  })

  it('reopens preferences from the footer link with the stored choice pre-ticked', () => {
    window.localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({
        essential: true,
        personalization: false,
        analytics: true,
        advertising: false,
        decidedAt: new Date().toISOString(),
        version: CONSENT_POLICY_VERSION,
      }),
    )
    renderClient(<CookieConsent locale="en" />)

    flush(() => openCookiePreferences('customize'))

    expect(getControl(document.body, /Analytics/).checked).toBe(true)
    expect(getControl(document.body, /Personalisation/).checked).toBe(false)
    // Reached from settings, so dismissing must not resurrect the banner.
    expect(queryByText(document.body, 'Cancel')).not.toBeNull()
  })

  it('re-prompts when the policy version moves past the stored grant', () => {
    window.localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({
        essential: true,
        personalization: true,
        analytics: true,
        advertising: true,
        decidedAt: new Date().toISOString(),
        version: CONSENT_POLICY_VERSION - 1,
      }),
    )

    const { container } = renderClient(<CookieConsent locale="en" />)
    expect(banner(container)).not.toBeNull()
  })

  it('renders the Nepali banner for the Nepali locale', () => {
    const { container } = renderClient(<CookieConsent locale="ne" />)
    const visible = banner(container)
    expect(visible).not.toBeNull()
    expect(queryByText(visible!, 'कुकी छनोट')).not.toBeNull()
    expect(queryByText(visible!, 'Cookie choices')).toBeNull()
  })
})
