import { NextRequest, NextResponse } from 'next/server'
import { canUsePremiumFeatures } from '@/lib/billing'
import { isForeverProUser } from '@/lib/forever-pro'
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

    // If Firebase Admin / DB is misconfigured, still serve forever-pro users
    // by decoding the JWT payload without verification as a last resort.
    try {
      const authHeader = request.headers.get('authorization') || ''
      const token = authHeader.replace('Bearer ', '')
      const payloadB64 = token.split('.')[1]
      if (payloadB64) {
        const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString())
        const uid = payload.user_id || payload.sub || ''
        const email = payload.email || ''

        if (uid && isForeverProUser(uid, email)) {
          return NextResponse.json({
            allowed: true,
            billing: {
              status: 'active',
              entitlementActive: true,
              grandfathered: true,
              updatedAt: Date.now(),
            },
          })
        }
      }
    } catch {
      // payload decode failed — fall through to error response
    }

    console.error('Stripe status error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Failed to fetch billing status' }, { status: 500 })
  }
}
