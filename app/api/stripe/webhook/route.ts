import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import {
  findUidByStripeCustomer,
  isStripeEventProcessed,
  markStripeEventProcessed,
  syncBillingFromCheckoutSession,
  syncBillingFromSubscription,
} from '@/lib/billing'
import { getStripe, getStripeWebhookSecret } from '@/lib/stripe'

export const runtime = 'nodejs'

async function handleSubscriptionEvent(subscription: Stripe.Subscription): Promise<void> {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id
  const uid = await findUidByStripeCustomer(customerId)
  if (!uid) {
    console.warn('Stripe webhook: unable to map subscription customer to uid', {
      subscriptionId: subscription.id,
      customerId,
    })
    return
  }

  await syncBillingFromSubscription(uid, subscription)
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
  }

  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, getStripeWebhookSecret())
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 })
  }

  if (await isStripeEventProcessed(event.id)) {
    return NextResponse.json({ received: true, duplicate: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await syncBillingFromCheckoutSession(event.data.object as Stripe.Checkout.Session)
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription)
        break
      }
      case 'invoice.paid':
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const invoiceWithSubscription = invoice as Stripe.Invoice & {
          subscription?: string | Stripe.Subscription | null
        }
        const subscriptionId = typeof invoiceWithSubscription.subscription === 'string'
          ? invoiceWithSubscription.subscription
          : invoiceWithSubscription.subscription?.id

        if (subscriptionId) {
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
          await handleSubscriptionEvent(subscription)
        }
        break
      }
      default: {
        break
      }
    }

    await markStripeEventProcessed(event)
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook handler failed:', {
      eventId: event.id,
      eventType: event.type,
      error,
    })
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
