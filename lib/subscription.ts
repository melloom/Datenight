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
  const token = await import('@/lib/firebase').then((mod) => mod.auth?.currentUser?.getIdToken())

  const headers = new Headers()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch('/api/stripe/status', {
    method: 'GET',
    headers,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Unable to fetch billing status')
  }

  return res.json()
}
