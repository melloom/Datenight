import { auth, ensureFirebaseInitialized } from '@/lib/firebase'

interface AuthJsonFetchOptions {
  init?: RequestInit
  forceRefreshToken?: boolean
}

export async function authJsonFetch(
  url: string,
  body?: unknown,
  options?: AuthJsonFetchOptions
): Promise<Response> {
  if (!auth) {
    await ensureFirebaseInitialized()
  }

  const token = auth?.currentUser ? await auth.currentUser.getIdToken(options?.forceRefreshToken ?? false) : null

  const method = options?.init?.method || 'POST'
  const isBodyAllowed = method !== 'GET' && method !== 'HEAD'

  const headers = new Headers(options?.init?.headers)
  if (isBodyAllowed) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const shouldSendBody = isBodyAllowed && body !== undefined

  return fetch(url, {
    ...options?.init,
    method,
    headers,
    body: shouldSendBody ? JSON.stringify(body) : undefined,
  })
}
