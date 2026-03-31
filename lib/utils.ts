import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the base URL for the application
 * In server components: uses the current request host
 * In client components or build time: uses NEXT_PUBLIC_APP_URL env var
 */
export function getAppUrl(): string {
  // Try to get from environment variable first
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Fallback to https://dat3night.com
  return 'https://dat3night.com'
}

/**
 * Get the app URL from request headers (server-side only)
 */
export async function getAppUrlFromHeaders(): Promise<string> {
  try {
    const { headers } = await import('next/headers')
    const headersList = await headers()
    const host = headersList.get('host') || headersList.get('x-forwarded-host') || ''
    
    if (host) {
      const protocol = headersList.get('x-forwarded-proto') || 'https'
      return `${protocol}://${host}`
    }
  } catch (e) {
    // headers() can only be called in Server Components
  }
  
  return getAppUrl()
}
