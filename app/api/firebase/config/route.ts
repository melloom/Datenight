import { createSign } from 'crypto'
import { NextResponse } from 'next/server'

const DEFAULT_FIREBASE_PROJECT_ID = 'datenight-a2dbb'
const DEFAULT_FIREBASE_DATABASE_URL = 'https://datenight-a2dbb-default-rtdb.firebaseio.com'
const FIREBASE_MANAGEMENT_SCOPE = 'https://www.googleapis.com/auth/firebase'

type FirebaseWebConfig = {
  apiKey?: string
  authDomain?: string
  databaseURL?: string
  projectId?: string
  storageBucket?: string
  messagingSenderId?: string
  appId?: string
  measurementId?: string
}

type ServiceAccount = {
  project_id: string
  client_email: string
  private_key: string
}

function getEnvFirebaseConfig(): FirebaseWebConfig {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || DEFAULT_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  }
}

function parseServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (raw) {
    const parsed = JSON.parse(raw) as ServiceAccount
    return {
      ...parsed,
      private_key: parsed.private_key.replace(/\\n/g, '\n'),
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!clientEmail || !privateKey) {
    throw new Error('Firebase service account credentials are missing')
  }

  return {
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  }
}

function toBase64Url(value: string): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

async function getGoogleAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = toBase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = toBase64Url(JSON.stringify({
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    scope: FIREBASE_MANAGEMENT_SCOPE,
    iat: now,
    exp: now + 3600,
  }))

  const unsignedToken = `${header}.${payload}`
  const signature = createSign('RSA-SHA256').update(unsignedToken).sign(serviceAccount.private_key, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsignedToken}.${signature}`,
    }),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`OAuth token request failed with ${response.status}`)
  }

  const payloadJson = await response.json() as { access_token?: string }
  if (!payloadJson.access_token) {
    throw new Error('OAuth token response missing access_token')
  }

  return payloadJson.access_token
}

async function loadManagementConfig(projectId: string): Promise<FirebaseWebConfig | null> {
  const serviceAccount = parseServiceAccount()
  const accessToken = await getGoogleAccessToken(serviceAccount)

  const appsResponse = await fetch(`https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  })

  if (!appsResponse.ok) {
    throw new Error(`Firebase Management app list failed with ${appsResponse.status}`)
  }

  const appsPayload = await appsResponse.json() as { apps?: Array<{ appId?: string }> }
  const appId = appsPayload.apps?.[0]?.appId

  if (!appId) {
    throw new Error('No Firebase web app found for project')
  }

  const configResponse = await fetch(`https://firebase.googleapis.com/v1beta1/projects/${projectId}/webApps/${encodeURIComponent(appId)}/config`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  })

  if (!configResponse.ok) {
    throw new Error(`Firebase Management config fetch failed with ${configResponse.status}`)
  }

  const configPayload = await configResponse.json() as FirebaseWebConfig
  return {
    apiKey: configPayload.apiKey,
    appId: configPayload.appId || appId,
    authDomain: configPayload.authDomain || `${projectId}.firebaseapp.com`,
    databaseURL: configPayload.databaseURL || process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || DEFAULT_FIREBASE_DATABASE_URL,
    measurementId: configPayload.measurementId,
    messagingSenderId: configPayload.messagingSenderId,
    projectId: configPayload.projectId || projectId,
    storageBucket: configPayload.storageBucket,
  }
}

function hasRequiredConfig(config: FirebaseWebConfig): boolean {
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId)
}

async function loadHostedConfig(projectId: string): Promise<FirebaseWebConfig | null> {
  const response = await fetch(`https://${projectId}.firebaseapp.com/__/firebase/init.json`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Hosted Firebase config request failed with ${response.status}`)
  }

  const hostedConfig = await response.json() as FirebaseWebConfig
  return {
    ...hostedConfig,
    projectId: hostedConfig.projectId || projectId,
    authDomain: hostedConfig.authDomain || `${projectId}.firebaseapp.com`,
    databaseURL: hostedConfig.databaseURL || process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || DEFAULT_FIREBASE_DATABASE_URL,
  }
}

export async function GET() {
  const envConfig = getEnvFirebaseConfig()

  if (hasRequiredConfig(envConfig)) {
    return NextResponse.json({
      config: envConfig,
      debug: {
        source: 'env',
        projectId: envConfig.projectId ?? null,
      },
    })
  }

  const projectId = envConfig.projectId || DEFAULT_FIREBASE_PROJECT_ID

  try {
    const hostedConfig = await loadHostedConfig(projectId)
    return NextResponse.json({
      config: hostedConfig,
      debug: {
        source: 'firebase-hosting',
        projectId,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    try {
      const managementConfig = await loadManagementConfig(projectId)
      return NextResponse.json({
        config: managementConfig,
        debug: {
          source: 'firebase-management',
          projectId,
        },
      })
    } catch (managementError) {
      const managementMessage = managementError instanceof Error ? managementError.message : 'Unknown error'

      return NextResponse.json({
        config: envConfig,
        debug: {
          source: 'firebase-management-failed',
          projectId,
          error: `${message}; ${managementMessage}`,
        },
      }, { status: 503 })
    }
  }
}