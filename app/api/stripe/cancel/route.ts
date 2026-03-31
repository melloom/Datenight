import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getBillingState, syncBillingFromSubscription } from '@/lib/billing'
import { verifyRequestUser, UnauthorizedError } from '@/lib/server-auth'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'

const cancelSchema = z.object({
  immediately: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const decoded = await verifyRequestUser(request)
    const body = await request.json().catch(() => ({}))
    const parseResult = cancelSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json({ error: 'Invalid cancellation payload' }, { status: 400 })
    }

    const billing = await getBillingState(decoded.uid)
    if (!billing.subscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    const stripe = getStripe()
    const subscription = parseResult.data.immediately
      ? await stripe.subscriptions.cancel(billing.subscriptionId)
      : await stripe.subscriptions.update(billing.subscriptionId, {
          cancel_at_period_end: true,
        })

    await syncBillingFromSubscription(decoded.uid, subscription)

    return NextResponse.json({
      ok: true,
      canceledImmediately: Boolean(parseResult.data.immediately),
      subscriptionId: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('Stripe cancellation error:', error)
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 })
  }
}