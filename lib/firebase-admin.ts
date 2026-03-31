import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getDatabase } from 'firebase-admin/database'
import type { App } from 'firebase-admin/app'

function parseServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (parsed.private_key) {
        parsed.private_key = String(parsed.private_key).replace(/\\n/g, '\n')
      }
      return parsed
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY must be valid JSON')
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin credentials are missing')
  }

  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  }
}

let cachedAdminApp: App | null = null

function getDatabaseUrl(): string {
  const databaseURL = process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
  if (!databaseURL) {
    throw new Error('FIREBASE_DATABASE_URL (or NEXT_PUBLIC_FIREBASE_DATABASE_URL) is required')
  }

  return databaseURL
}

export function getAdminApp(): App {
  if (cachedAdminApp) {
    return cachedAdminApp
  }

  cachedAdminApp = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(parseServiceAccount()),
        databaseURL: getDatabaseUrl(),
      })

  return cachedAdminApp
}

export function getAdminAuth() {
  return getAuth(getAdminApp())
}

export function getAdminDb() {
  return getDatabase(getAdminApp())
}
