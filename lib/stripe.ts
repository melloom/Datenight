import Stripe from 'stripe'

let stripeClient: Stripe | null = null

function getEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is required`)
  }
  return value
}

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getEnv('STRIPE_SECRET_KEY'), {
      appInfo: {
        name: 'Date Night Planner',
      },
    })
  }

  return stripeClient
}

export function getStripeWebhookSecret(): string {
  return getEnv('STRIPE_WEBHOOK_SECRET')
}

export function getStripePriceIds(): { monthly: string; yearly: string } {
  return {
    monthly: getEnv('STRIPE_PRICE_MONTHLY'),
    yearly: getEnv('STRIPE_PRICE_YEARLY'),
  }
}

export function getStripeAppUrl(): string {
  return getEnv('NEXT_PUBLIC_APP_URL')
}
