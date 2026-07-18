import 'server-only'

export type PaymentAdapterState = {
  provider: string
  configured: boolean
  ready: boolean
  detail: string
}

export type PaymentCheckoutInput = {
  priceId: string
  customerEmail?: string
  successUrl: string
  cancelUrl: string
}

export type PaymentCheckoutResult = {
  checkoutUrl: string
}

export type PaymentWebhookResult = {
  handled: boolean
}

export interface PaymentAdapter {
  readonly state: PaymentAdapterState
  checkout(input: PaymentCheckoutInput): Promise<PaymentCheckoutResult>
  webhook(request: Request): Promise<PaymentWebhookResult>
}

function notConfigured(operation: string): never {
  throw new Error(`Payment ${operation} is not configured. Membership remains in manual mode.`)
}

const noopAdapter: PaymentAdapter = {
  state: {
    provider: 'none',
    configured: false,
    ready: false,
    detail: 'No payment provider is selected; membership remains manual.',
  },
  async checkout() {
    return notConfigured('checkout')
  },
  async webhook() {
    return { handled: false }
  },
}

function stripeAdapter(): PaymentAdapter {
  const emergencyReady = process.env.PAYMENT_ADAPTER_READY?.trim().toLowerCase() === 'true'
  const configured = Boolean(process.env.STRIPE_SECRET_KEY?.trim())
  return {
    state: {
      provider: 'stripe',
      configured,
      ready: configured && emergencyReady,
      detail: configured && emergencyReady
        ? 'Stripe adapter readiness is enabled by the temporary PAYMENT_ADAPTER_READY override.'
        : configured
          ? 'Stripe is selected, but checkout and webhook handling are not implemented.'
          : 'Stripe is selected, but STRIPE_SECRET_KEY is missing.',
    },
    async checkout() {
      return notConfigured('checkout')
    },
    async webhook() {
      return { handled: false }
    },
  }
}

export function getPaymentAdapter(): PaymentAdapter {
  const provider = process.env.PAYMENT_PROVIDER?.trim().toLowerCase()
  if (provider === 'stripe') return stripeAdapter()
  if (!provider) return noopAdapter
  return {
    ...noopAdapter,
    state: {
      provider,
      configured: true,
      ready: false,
      detail: `Payment provider "${provider}" has no concrete adapter implementation.`,
    },
  }
}

export function getPaymentAdapterState(): PaymentAdapterState {
  const adapter = getPaymentAdapter()
  return {
    ...adapter.state,
    ready: Boolean(process.env.PAYMENT_PROVIDER?.trim()) && adapter.state.ready,
  }
}
