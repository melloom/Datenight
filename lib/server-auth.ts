import { NextRequest } from 'next/server'
import type { DecodedIdToken } from 'firebase-admin/auth'
import { getAdminAuth } from '@/lib/firebase-admin'

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

function readBearerToken(request: NextRequest): string {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing bearer token')
  }

  return authHeader.slice(7).trim()
}

export async function verifyRequestUser(request: NextRequest): Promise<DecodedIdToken> {
  const token = readBearerToken(request)
  try {
    return await getAdminAuth().verifyIdToken(token)
  } catch {
    throw new UnauthorizedError('Invalid auth token')
  }
}
