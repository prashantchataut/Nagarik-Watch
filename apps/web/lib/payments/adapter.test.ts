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
    vi.stubEnv('PAYMENT_ADAPTER_READY', '')

    expect(getPaymentAdapterState().ready).toBe(false)
  })

  it('requires provider, credentials and the temporary readiness override', () => {
    vi.stubEnv('PAYMENT_PROVIDER', 'stripe')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_example')
    vi.stubEnv('PAYMENT_ADAPTER_READY', 'true')

    expect(getPaymentAdapterState()).toMatchObject({
      provider: 'stripe',
      configured: true,
      ready: true,
    })
  })

  it('fails checkout honestly until a concrete implementation exists', async () => {
    vi.stubEnv('PAYMENT_PROVIDER', 'stripe')
    vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_example')
    vi.stubEnv('PAYMENT_ADAPTER_READY', 'true')

    await expect(getPaymentAdapter().checkout({
      priceId: 'price_example',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    })).rejects.toThrow('not configured')
  })
})
