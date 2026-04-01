import { NextRequest, NextResponse } from 'next/server'
import { canUsePremiumFeatures } from '@/lib/billing'
import { ensureStripeCustomer, getBillingState } from '@/lib/billing'
import { verifyRequestUser, UnauthorizedError } from '@/lib/server-auth'
import { getStripe, getStripeAppUrl } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyRequestUser(request)
    const uid = decoded.uid
    const billing = await getBillingState(uid)
    const premium = await canUsePremiumFeatures(uid, decoded.email)

    if (premium.allowed && !billing.customerId && !billing.subscriptionId) {
      return NextResponse.json({
        url: `${getStripeAppUrl()}/plans?billing=portal_unavailable_grandfathered`,
      })
    }

    const customerId = billing.customerId || (await ensureStripeCustomer(uid, decoded.email, decoded.name))

    const stripe = getStripe()
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getStripeAppUrl()}/plans?billing=portal`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('Stripe portal error:', error)
    return NextResponse.json({ error: 'Failed to create billing portal session' }, { status: 500 })
  }
}
