import { NextResponse } from 'next/server'

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

function getEnvFirebaseConfig(): FirebaseWebConfig {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
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
    databaseURL: hostedConfig.databaseURL || process.env.FIREBASE_DATABASE_URL || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
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

  const projectId = envConfig.projectId
  if (!projectId) {
    return NextResponse.json({
      config: envConfig,
      debug: {
        source: 'missing-project-id',
        projectId: null,
      },
    })
  }

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
    return NextResponse.json({
      config: envConfig,
      debug: {
        source: 'firebase-hosting-failed',
        projectId,
        error: message,
      },
    }, { status: 503 })
  }
}