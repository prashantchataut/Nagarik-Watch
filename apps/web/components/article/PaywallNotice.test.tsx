// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest'
import { PaywallNotice } from '@/components/article/PaywallNotice'
import { cleanupRendered, queryByText, renderClient } from '@/test/render'

describe('PaywallNotice', () => {
  afterEach(() => {
    cleanupRendered()
  })

  it('tells a metered reader how many free stories they used', () => {
    const { container } = renderClient(
      <PaywallNotice locale="en" reason="meter-exhausted" limit={5} />,
    )
    expect(queryByText(container, /read your 5 free stories/)).not.toBeNull()
    expect(container.querySelector('[data-paywall-reason="meter-exhausted"]')).not.toBeNull()
  })

  it('does not promise a metered reader anything on a members-only story', () => {
    const { container } = renderClient(<PaywallNotice locale="en" reason="premium-article" />)
    expect(queryByText(container, /This story is for members/)).not.toBeNull()
    expect(queryByText(container, /free stories/)).toBeNull()
  })

  it('links to membership and sign-in under the reading locale', () => {
    const { container } = renderClient(<PaywallNotice locale="ne" reason="meter-exhausted" />)
    const hrefs = [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    expect(hrefs).toContain('/membership')
    expect(hrefs).toContain('/auth/login')
    expect(container.querySelector('aside')?.getAttribute('lang')).toBe('ne')
  })
})
