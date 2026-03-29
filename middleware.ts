import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Simple in-memory rate limiter (per-deployment instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const RATE_LIMIT = {
  windowMs: 60 * 1000,       // 1 minute window
  maxRequests: 15,            // 15 requests per minute for API routes (reduced from 30)
  maxPageRequests: 60,        // 60 page requests per minute (reduced from 100)
}

function getRateLimitKey(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
  return ip
}

function isRateLimited(key: string, isApi: boolean): boolean {
  const now = Date.now()
  const limit = isApi ? RATE_LIMIT.maxRequests : RATE_LIMIT.maxPageRequests
  const entry = rateLimitMap.get(key)

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT.windowMs })
    return false
  }

  entry.count++
  return entry.count > limit
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApiRoute = pathname.startsWith('/api/')

  // Rate limiting
  const clientKey = `${getRateLimitKey(request)}-${isApiRoute ? 'api' : 'page'}`
  if (isRateLimited(clientKey, isApiRoute)) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      }
    )
  }

  const response = NextResponse.next()

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Block API routes from being accessed directly in browser (basic protection)
  if (isApiRoute) {
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    const allowedOrigins = [
      'http://localhost:3000',
      'https://dat3night.netlify.app',
      process.env.NEXT_PUBLIC_APP_URL,
    ].filter(Boolean)

    // Allow server-side requests (no origin) and allowed origins
    if (origin && !allowedOrigins.some(allowed => origin.startsWith(allowed!))) {
      return new NextResponse(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // CORS headers for API routes
    if (origin) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  return response
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
