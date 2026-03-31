import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import {
  findUidByStripeCustomer,
  isStripeEventProcessed,
  markStripeEventProcessed,
  syncBillingFromCheckoutSession,
  syncBillingFromSubscription,
} from '@/lib/billing'
import { isBillingEmailConfigured, sendBillingEmail, sendBillingTeamEmail } from '@/lib/email'
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

  if (!isBillingEmailConfigured()) {
    return
  }

  try {
    const customer = await getStripe().customers.retrieve(customerId)
    if (!customer || customer.deleted || !customer.email) {
      return
    }

    if (subscription.status === 'canceled') {
      await Promise.all([
        sendBillingEmail({
          to: customer.email,
          subject: 'Your DateNight Pro subscription has ended',
          text: 'Your DateNight Pro subscription is now canceled. You can resubscribe anytime from Billing & Plans.',
        }),
        sendBillingTeamEmail(
          'Subscription canceled',
          `Customer ${customer.email} canceled subscription ${subscription.id}.`,
        ),
      ])
      return
    }

    if (subscription.cancel_at_period_end) {
      await Promise.all([
        sendBillingEmail({
          to: customer.email,
          subject: 'Your DateNight Pro subscription will cancel at period end',
          text: 'Your subscription is set to cancel at the end of the current billing period. You keep premium access until then.',
        }),
        sendBillingTeamEmail(
          'Subscription scheduled for cancellation',
          `Customer ${customer.email} set subscription ${subscription.id} to cancel at period end.`,
        ),
      ])
    }
  } catch (error) {
    console.error('Stripe webhook email notification failed for subscription event:', {
      subscriptionId: subscription.id,
      error,
    })
  }
}

async function notifyCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (!isBillingEmailConfigured()) {
    return
  }

  const customerEmail = session.customer_details?.email || undefined
  if (!customerEmail) {
    return
  }

  await Promise.all([
    sendBillingEmail({
      to: customerEmail,
      subject: 'Welcome to DateNight Pro',
      text: 'Your DateNight Pro subscription is active. Thanks for subscribing.',
    }),
    sendBillingTeamEmail(
      'New DateNight Pro subscription',
      `New subscription checkout completed for ${customerEmail}. Session: ${session.id}`,
    ),
  ])
}

async function notifyPaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  if (!isBillingEmailConfigured()) {
    return
  }

  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
  if (!customerId) {
    return
  }

  const customer = await getStripe().customers.retrieve(customerId)
  if (!customer || customer.deleted || !customer.email) {
    return
  }

  await Promise.all([
    sendBillingEmail({
      to: customer.email,
      subject: 'Payment failed for DateNight Pro',
      text: 'We could not process your latest DateNight Pro payment. Please update your payment method in Billing & Plans.',
    }),
    sendBillingTeamEmail(
      'Subscription payment failed',
      `Payment failed for customer ${customer.email}. Invoice: ${invoice.id}`,
    ),
  ])
}

async function notifyTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
  if (!isBillingEmailConfigured()) {
    return
  }

  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id
  if (!customerId) {
    return
  }

  const customer = await getStripe().customers.retrieve(customerId)
  if (!customer || customer.deleted || !customer.email) {
    return
  }

  await Promise.all([
    sendBillingEmail({
      to: customer.email,
      subject: 'Your DateNight Pro trial is ending soon',
      text: 'Your trial is ending soon. Keep premium access by ensuring your payment method is up to date in Billing & Plans.',
    }),
    sendBillingTeamEmail(
      'Trial ending soon',
      `Trial ending soon for ${customer.email}. Subscription: ${subscription.id}`,
    ),
  ])
}

async function syncFromInvoiceEvent(invoice: Stripe.Invoice): Promise<void> {
  const invoiceWithSubscription = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null
  }
  const subscriptionId = typeof invoiceWithSubscription.subscription === 'string'
    ? invoiceWithSubscription.subscription
    : invoiceWithSubscription.subscription?.id

  if (!subscriptionId) {
    return
  }

  const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
  await handleSubscriptionEvent(subscription)
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
        const session = event.data.object as Stripe.Checkout.Session
        await syncBillingFromCheckoutSession(session)
        await notifyCheckoutCompleted(session)
        break
      }
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session
        await syncBillingFromCheckoutSession(session)
        await notifyCheckoutCompleted(session)
        break
      }
      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.warn('Stripe async checkout payment failed', { sessionId: session.id })
        break
      }
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        console.info('Stripe checkout session expired', { sessionId: session.id })
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed': {
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription)
        break
      }
      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription
        await notifyTrialWillEnd(subscription)
        await handleSubscriptionEvent(subscription)
        break
      }
      case 'invoice.paid':
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
      case 'invoice.finalization_failed':
      case 'invoice.marked_uncollectible':
      case 'invoice.voided': {
        const invoice = event.data.object as Stripe.Invoice
        if (event.type === 'invoice.payment_failed') {
          await notifyPaymentFailed(invoice)
        }
        await syncFromInvoiceEvent(invoice)
        break
      }
      default: {
        console.info('Stripe webhook event received but not explicitly handled', {
          eventId: event.id,
          eventType: event.type,
        })
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
