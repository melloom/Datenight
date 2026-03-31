import Stripe from 'stripe'
import { getAdminDb } from '@/lib/firebase-admin'
import { getStripe } from '@/lib/stripe'
import { isForeverProUser } from '@/lib/forever-pro'

const BILLING_ROOT = 'billing'

export type BillingStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'unpaid'
  | 'paused'
  | 'none'

export interface BillingState {
  customerId?: string
  subscriptionId?: string
  status?: BillingStatus
  priceId?: string
  trialEnd?: number | null
  currentPeriodEnd?: number | null
  cancelAtPeriodEnd?: boolean
  entitlementActive?: boolean
  grandfathered?: boolean
  updatedAt?: number
}

function billingRef(uid: string) {
  return getAdminDb().ref(`users/${uid}/${BILLING_ROOT}`)
}

function stripeCustomerMapRef(customerId: string) {
  return getAdminDb().ref(`stripeCustomers/${customerId}`)
}

function stripeEventRef(eventId: string) {
  return getAdminDb().ref(`stripeEvents/${eventId}`)
}

function toMillis(unixSeconds?: number | null): number | null {
  if (!unixSeconds) {
    return null
  }
  return unixSeconds * 1000
}

export function isBillingStatusEntitled(status?: BillingStatus): boolean {
  return status === 'active' || status === 'trialing'
}

export function computeEntitlement(billing: BillingState): boolean {
  if (billing.grandfathered) {
    return true
  }
  return isBillingStatusEntitled(billing.status)
}

export async function getBillingState(uid: string): Promise<BillingState> {
  const snapshot = await billingRef(uid).get()
  if (!snapshot.exists()) {
    return { status: 'none', entitlementActive: false }
  }

  const value = snapshot.val() as BillingState
  return {
    ...value,
    entitlementActive: computeEntitlement(value),
  }
}

export async function setGrandfatheredIfMissing(uid: string): Promise<boolean> {
  const existing = await billingRef(uid).child('grandfathered').get()
  if (existing.exists()) {
    return Boolean(existing.val())
  }

  const usersSnapshot = await getAdminDb().ref('users').get()
  const users: Array<{ uid: string; createdAt: number }> = []

  usersSnapshot.forEach((child) => {
    const userId = child.key
    const profile = child.child('profile').val() || {}
    if (!userId) {
      return
    }

    const rawCreatedAt = Number(profile.createdAt || profile.lastLogin || 0)
    users.push({
      uid: userId,
      createdAt: Number.isFinite(rawCreatedAt) && rawCreatedAt > 0 ? rawCreatedAt : Number.MAX_SAFE_INTEGER,
    })
  })

  users.sort((a, b) => a.createdAt - b.createdAt)
  const rank = users.findIndex((user) => user.uid === uid)
  const grandfathered = rank >= 0 && rank < 10

  await billingRef(uid).update({ grandfathered, updatedAt: Date.now() })
  return grandfathered
}

export async function ensureStripeCustomer(uid: string, email?: string | null, name?: string | null): Promise<string> {
  const existingBilling = await getBillingState(uid)
  if (existingBilling.customerId) {
    return existingBilling.customerId
  }

  const stripe = getStripe()
  const customer = await stripe.customers.create({
    email: email || undefined,
    name: name || undefined,
    metadata: {
      firebaseUid: uid,
    },
  })

  await Promise.all([
    billingRef(uid).update({
      customerId: customer.id,
      updatedAt: Date.now(),
    }),
    stripeCustomerMapRef(customer.id).set(uid),
  ])

  return customer.id
}

export async function findUidByStripeCustomer(customerId: string): Promise<string | null> {
  const mapped = await stripeCustomerMapRef(customerId).get()
  if (mapped.exists()) {
    return String(mapped.val())
  }

  const stripe = getStripe()
  const customer = await stripe.customers.retrieve(customerId)
  if (!customer || customer.deleted) {
    return null
  }

  const metadataUid = customer.metadata?.firebaseUid
  if (metadataUid) {
    await stripeCustomerMapRef(customerId).set(metadataUid)
    return metadataUid
  }

  return null
}

export async function syncBillingFromSubscription(uid: string, subscription: Stripe.Subscription): Promise<void> {
  const subscriptionWithPeriod = subscription as Stripe.Subscription & { current_period_end?: number | null }
  const priceId = subscription.items.data[0]?.price?.id
  const state: BillingState = {
    customerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
    subscriptionId: subscription.id,
    status: subscription.status as BillingStatus,
    priceId,
    trialEnd: toMillis(subscription.trial_end),
    currentPeriodEnd: toMillis(subscriptionWithPeriod.current_period_end),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: Date.now(),
  }

  const current = await getBillingState(uid)
  const grandfathered = current.grandfathered ?? (await setGrandfatheredIfMissing(uid))
  state.grandfathered = grandfathered
  state.entitlementActive = computeEntitlement(state)

  await Promise.all([
    billingRef(uid).update(state),
    stripeCustomerMapRef(state.customerId!).set(uid),
  ])
}

export async function syncBillingFromCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
  const uid = session.metadata?.firebaseUid || session.client_reference_id

  if (!uid || !customerId) {
    return
  }

  await Promise.all([
    billingRef(uid).update({
      customerId,
      updatedAt: Date.now(),
    }),
    stripeCustomerMapRef(customerId).set(uid),
  ])

  if (!subscriptionId) {
    return
  }

  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  await syncBillingFromSubscription(uid, subscription)
}

export async function canUsePremiumFeatures(uid: string, email?: string | null): Promise<{ allowed: boolean; billing: BillingState }> {
  if (isForeverProUser(uid, email)) {
    const now = Date.now()
    return {
      allowed: true,
      billing: {
        status: 'active',
        entitlementActive: true,
        grandfathered: true,
        updatedAt: now,
      },
    }
  }

  const billing = await getBillingState(uid)
  const grandfathered = billing.grandfathered ?? (await setGrandfatheredIfMissing(uid))
  const merged: BillingState = {
    ...billing,
    grandfathered,
  }

  const allowed = computeEntitlement(merged)
  if (billing.entitlementActive !== allowed || billing.grandfathered !== grandfathered) {
    await billingRef(uid).update({
      entitlementActive: allowed,
      grandfathered,
      updatedAt: Date.now(),
    })
  }

  return {
    allowed,
    billing: {
      ...merged,
      entitlementActive: allowed,
    },
  }
}

export async function isStripeEventProcessed(eventId: string): Promise<boolean> {
  const snapshot = await stripeEventRef(eventId).get()
  return snapshot.exists()
}

export async function markStripeEventProcessed(event: Stripe.Event): Promise<void> {
  await stripeEventRef(event.id).set({
    type: event.type,
    created: event.created,
    processedAt: Date.now(),
  })
}
