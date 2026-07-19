import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { getPaymentAdapter, getPaymentAdapterState } from './adapter'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('payment adapter readiness', () => {
  it('stays disabled when only a Stripe secret exists', () => {
    vi.stubEnv('PAYMENT_PROVIDER', '')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_example')

    expect(getPaymentAdapterState().ready).toBe(false)
  })

  it('requires provider, webhook signing secret and both recurring prices', () => {
    vi.stubEnv('PAYMENT_PROVIDER', 'stripe')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_example')
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_example')
    vi.stubEnv('STRIPE_MONTHLY_PRICE_ID', 'price_monthly')
    vi.stubEnv('STRIPE_YEARLY_PRICE_ID', 'price_yearly')

    expect(getPaymentAdapterState()).toMatchObject({
      provider: 'stripe',
      configured: true,
      ready: true,
    })
  })

  it('rejects an invalid price before making a provider request', async () => {
    vi.stubEnv('PAYMENT_PROVIDER', 'stripe')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_example')
    vi.stubEnv('STRIPE_WEBHOOK_SECRET', 'whsec_example')
    vi.stubEnv('STRIPE_MONTHLY_PRICE_ID', 'price_monthly')
    vi.stubEnv('STRIPE_YEARLY_PRICE_ID', 'price_yearly')

    await expect(
      getPaymentAdapter().checkout({
        priceId: 'not-a-price',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      }),
    ).rejects.toThrow('valid Stripe Price ID')
  })
})
