import { auth } from '@/lib/firebase'

export async function authJsonFetch(url: string, body: unknown, init?: RequestInit): Promise<Response> {
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null

  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(url, {
    ...init,
    method: init?.method || 'POST',
    headers,
    body: JSON.stringify(body),
  })
}
