import 'server-only'
import Stripe from 'stripe'
import {
  hasProcessedPaymentEvent,
  recordProcessedPaymentEvent,
  upsertPaidEntitlement,
} from './entitlements'

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
  duplicate?: boolean
  eventId?: string
  eventType?: string
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
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()
  const monthlyPrice = process.env.STRIPE_MONTHLY_PRICE_ID?.trim()
  const yearlyPrice = process.env.STRIPE_YEARLY_PRICE_ID?.trim()
  const configured = Boolean(secretKey)
  const ready = Boolean(secretKey && webhookSecret && monthlyPrice && yearlyPrice)

  function client(): Stripe {
    if (!secretKey) notConfigured('client')
    return new Stripe(secretKey)
  }

  async function customerEmail(
    stripe: Stripe,
    customer: string | Stripe.Customer | Stripe.DeletedCustomer,
  ): Promise<string> {
    if (typeof customer !== 'string') {
      return 'deleted' in customer && customer.deleted
        ? ''
        : (customer.email?.trim().toLowerCase() ?? '')
    }
    const resolved = await stripe.customers.retrieve(customer)
    return 'deleted' in resolved && resolved.deleted
      ? ''
      : (resolved.email?.trim().toLowerCase() ?? '')
  }

  async function syncSubscription(
    stripe: Stripe,
    subscription: Stripe.Subscription,
  ): Promise<void> {
    const email =
      subscription.metadata?.email?.trim().toLowerCase() ||
      (await customerEmail(stripe, subscription.customer))
    if (!email) throw new Error(`Stripe subscription ${subscription.id} has no customer email.`)

    const periodEndSeconds = subscription.items.data.reduce(
      (latest, item) => Math.max(latest, item.current_period_end ?? 0),
      0,
    )
    const price = subscription.items.data[0]?.price
    await upsertPaidEntitlement({
      email,
      provider: 'stripe',
      status: subscription.status,
      plan: price?.id ?? 'stripe-membership',
      customerId:
        typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer.id,
      subscriptionId: subscription.id,
      currentPeriodEnd: periodEndSeconds > 0 ? new Date(periodEndSeconds * 1000) : null,
    })
  }

  return {
    state: {
      provider: 'stripe',
      configured,
      ready,
      detail: ready
        ? 'Stripe Checkout and signed webhook entitlement synchronization are configured.'
        : configured
          ? 'Stripe requires STRIPE_WEBHOOK_SECRET plus monthly and yearly Price IDs.'
          : 'Stripe is selected, but STRIPE_SECRET_KEY is missing.',
    },
    async checkout(input) {
      if (!ready) return notConfigured('checkout')
      if (!input.priceId.startsWith('price_'))
        throw new Error('A valid Stripe Price ID is required.')
      const session = await client().checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: input.priceId, quantity: 1 }],
        customer_email: input.customerEmail,
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
        metadata: {
          product: 'nagarik-watch-membership',
          ...(input.customerEmail ? { email: input.customerEmail.toLowerCase() } : {}),
        },
        subscription_data: {
          metadata: {
            product: 'nagarik-watch-membership',
            ...(input.customerEmail ? { email: input.customerEmail.toLowerCase() } : {}),
          },
        },
      })
      if (!session.url) throw new Error('Stripe did not return a Checkout URL.')
      return { checkoutUrl: session.url }
    },
    async webhook(request) {
      if (!ready || !webhookSecret) return notConfigured('webhook')
      const signature = request.headers.get('stripe-signature')
      if (!signature) throw new Error('Missing Stripe-Signature header.')

      const stripe = client()
      const event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret)
      if (await hasProcessedPaymentEvent(event.id)) {
        return { handled: true, duplicate: true, eventId: event.id, eventType: event.type }
      }

      let handled = false
      if (
        event.type === 'customer.subscription.created' ||
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted'
      ) {
        await syncSubscription(stripe, event.data.object)
        handled = true
      } else if (event.type === 'checkout.session.completed') {
        const subscriptionId =
          typeof event.data.object.subscription === 'string'
            ? event.data.object.subscription
            : event.data.object.subscription?.id
        if (subscriptionId) {
          await syncSubscription(stripe, await stripe.subscriptions.retrieve(subscriptionId))
          handled = true
        }
      }

      await recordProcessedPaymentEvent(event.id, event.type)
      return { handled, eventId: event.id, eventType: event.type }
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
