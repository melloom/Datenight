import { NextRequest, NextResponse } from 'next/server'
import { canUsePremiumFeatures } from '@/lib/billing'
import { verifyRequestUser, UnauthorizedError } from '@/lib/server-auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const decoded = await verifyRequestUser(request)
    const result = await canUsePremiumFeatures(decoded.uid, decoded.email)

    return NextResponse.json({
      allowed: result.allowed,
      billing: result.billing,
    })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('Stripe status error:', error)
    return NextResponse.json({ error: 'Failed to fetch billing status' }, { status: 500 })
  }
}
