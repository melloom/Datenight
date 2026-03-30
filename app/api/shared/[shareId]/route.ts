import { NextRequest, NextResponse } from 'next/server'

const DATABASE_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params

  if (!shareId || !/^[-\w]+$/.test(shareId)) {
    return NextResponse.json({ error: 'Invalid share ID' }, { status: 400 })
  }

  if (!DATABASE_URL) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(`${DATABASE_URL}/shared/${shareId}.json`, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 },
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 502 })
    }

    const data = await res.json()

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Check expiration
    const expired = data.expiresAt ? Date.now() > data.expiresAt : false

    return NextResponse.json({ ...data, expired })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
