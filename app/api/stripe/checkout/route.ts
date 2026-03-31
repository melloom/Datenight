import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAdminAuth } from '@/lib/firebase-admin'
import { canUsePremiumFeatures, ensureStripeCustomer } from '@/lib/billing'
import { verifyRequestUser, UnauthorizedError } from '@/lib/server-auth'
import { getStripe, getStripeAppUrl, getStripePriceIds } from '@/lib/stripe'

export const runtime = 'nodejs'

const checkoutSchema = z.object({
  plan: z.enum(['monthly', 'yearly']),
})

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyRequestUser(request)
    const body = await request.json()
    const parseResult = checkoutSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid checkout payload' }, { status: 400 })
    }

    const uid = decoded.uid
    const { allowed } = await canUsePremiumFeatures(uid)
    if (allowed) {
      return NextResponse.json({ error: 'User already has active premium access' }, { status: 409 })
    }

    const userRecord = await getAdminAuth().getUser(uid)
    const customerId = await ensureStripeCustomer(uid, userRecord.email, userRecord.displayName)
    const prices = getStripePriceIds()
    const selectedPriceId = parseResult.data.plan === 'monthly' ? prices.monthly : prices.yearly

    const appUrl = getStripeAppUrl()
    const stripe = getStripe()

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: uid,
      line_items: [{
        price: selectedPriceId,
        quantity: 1,
      }],
      subscription_data: {
        metadata: {
          firebaseUid: uid,
          plan: parseResult.data.plan,
        },
        trial_period_days: 3,
      },
      metadata: {
        firebaseUid: uid,
        plan: parseResult.data.plan,
      },
      allow_promotion_codes: true,
      success_url: `${appUrl}/?billing=success`,
      cancel_url: `${appUrl}/?billing=cancelled`,
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
