import { authJsonFetch } from '@/lib/client-auth-fetch'

export type PlanInterval = 'monthly' | 'yearly'

interface CheckoutResponse {
  sessionId: string
  url: string | null
}

interface PortalResponse {
  url: string
}

interface BillingStatusResponse {
  allowed: boolean
  billing: {
    status?: string
    entitlementActive?: boolean
    grandfathered?: boolean
    customerId?: string
    subscriptionId?: string
    priceId?: string
    trialEnd?: number | null
    currentPeriodEnd?: number | null
    cancelAtPeriodEnd?: boolean
    updatedAt?: number
  }
}

interface CancelSubscriptionResponse {
  ok: boolean
  canceledImmediately: boolean
  subscriptionId: string
  status: string
  cancelAtPeriodEnd: boolean
}

export async function createStripeCheckout(plan: PlanInterval): Promise<CheckoutResponse> {
  const res = await authJsonFetch('/api/stripe/checkout', { plan })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Unable to start checkout')
  }
  return res.json()
}

export async function createBillingPortalSession(): Promise<PortalResponse> {
  const res = await authJsonFetch('/api/stripe/portal', {})
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Unable to open billing portal')
  }
  return res.json()
}

export async function fetchBillingStatus(): Promise<BillingStatusResponse> {
  let res = await authJsonFetch('/api/stripe/status', undefined, {
    init: { method: 'GET' },
  })

  if (res.status === 401) {
    // Retry once with a forced token refresh to recover from stale/expired credentials.
    res = await authJsonFetch('/api/stripe/status', undefined, {
      init: { method: 'GET' },
      forceRefreshToken: true,
    })
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Unable to fetch billing status')
  }

  return res.json()
}

export async function cancelStripeSubscription(immediately = false): Promise<CancelSubscriptionResponse> {
  const res = await authJsonFetch('/api/stripe/cancel', { immediately })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Unable to cancel subscription')
  }
  return res.json()
}
