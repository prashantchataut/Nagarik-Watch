/** Stripe stub — payments disabled on Workers free preview deploys. */
export default class Stripe {
  constructor(_key?: string, _options?: unknown) {}

  checkout = {
    sessions: {
      create: async (): Promise<never> => {
        throw new Error('Stripe is not available on this deployment.')
      },
    },
  }

  webhooks = {
    constructEvent: (): never => {
      throw new Error('Stripe is not available on this deployment.')
    },
  }
}
