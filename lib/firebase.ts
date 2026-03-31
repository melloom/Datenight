import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics"
import { browserLocalPersistence, getAuth, GoogleAuthProvider, setPersistence, type Auth } from "firebase/auth"
import { getDatabase, type Database } from "firebase/database"

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

type FirebaseDebugInfo = {
  source: 'env' | 'server-api' | 'hosting-proxy' | 'unavailable'
  attempts: string[]
  missingKeys: string[]
  lastError?: string
  projectId?: string
}

const envFirebaseConfig: FirebaseWebConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

export let firebaseConfig: FirebaseWebConfig = { ...envFirebaseConfig }
export let app: FirebaseApp | null = null
export let auth: Auth | null = null
export let rtdb: Database | null = null
export let googleProvider: GoogleAuthProvider | null = null
export let analytics: Analytics | null = null
let firebaseDebugInfo: FirebaseDebugInfo = {
  source: 'unavailable',
  attempts: [],
  missingKeys: ['apiKey', 'authDomain', 'projectId', 'appId'],
}

let initializationPromise: Promise<FirebaseServices> | null = null

type FirebaseServices = {
  app: FirebaseApp | null
  auth: Auth | null
  rtdb: Database | null
  googleProvider: GoogleAuthProvider | null
}

function hasRequiredConfig(config: FirebaseWebConfig): config is Required<Pick<FirebaseWebConfig, "apiKey" | "authDomain" | "projectId" | "appId">> & FirebaseWebConfig {
  return Boolean(config.apiKey && config.authDomain && config.projectId && config.appId)
}

function getMissingKeys(config: FirebaseWebConfig): string[] {
  return ['apiKey', 'authDomain', 'projectId', 'appId'].filter((key) => !config[key as keyof FirebaseWebConfig])
}

function updateFirebaseDebugInfo(update: Partial<FirebaseDebugInfo>) {
  firebaseDebugInfo = {
    ...firebaseDebugInfo,
    ...update,
  }
}

export function getFirebaseDebugInfo(): FirebaseDebugInfo {
  return firebaseDebugInfo
}

async function enableAnalytics(firebaseApp: FirebaseApp) {
  if (typeof window === "undefined") {
    return
  }

  const supported = await isSupported()
  if (supported) {
    analytics = getAnalytics(firebaseApp)
  }
}

function assignFirebaseServices(config: FirebaseWebConfig): FirebaseServices {
  firebaseConfig = config
  app = getApps().length > 0 ? getApp() : initializeApp(config)
  auth = getAuth(app)
  rtdb = getDatabase(app)
  googleProvider = new GoogleAuthProvider()

  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Failed to enable Firebase auth persistence", error)
  })

  void enableAnalytics(app)

  updateFirebaseDebugInfo({
    source: firebaseDebugInfo.source === 'unavailable' ? 'env' : firebaseDebugInfo.source,
    missingKeys: [],
    projectId: config.projectId,
  })

  return { app, auth, rtdb, googleProvider }
}

async function loadServerFirebaseConfig(): Promise<FirebaseWebConfig | null> {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const response = await fetch("/api/firebase/config", {
      cache: "no-store",
      credentials: "same-origin",
    })

    if (!response.ok) {
      return null
    }

    const payload = await response.json() as { config?: FirebaseWebConfig; debug?: { source?: string; error?: string; projectId?: string } }
    if (payload.debug) {
      updateFirebaseDebugInfo({
        source: 'server-api',
        lastError: payload.debug.error,
        projectId: payload.debug.projectId,
      })
    }

    const hostedConfig = payload.config
    if (!hostedConfig) {
      return null
    }

    return {
      apiKey: hostedConfig.apiKey,
      authDomain: hostedConfig.authDomain,
      databaseURL: hostedConfig.databaseURL,
      projectId: hostedConfig.projectId,
      storageBucket: hostedConfig.storageBucket,
      messagingSenderId: hostedConfig.messagingSenderId,
      appId: hostedConfig.appId,
      measurementId: hostedConfig.measurementId,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    updateFirebaseDebugInfo({ lastError: `server-api: ${message}` })
    console.error("Failed to load server Firebase config", error)
    return null
  }
}

async function loadHostedFirebaseConfig(): Promise<FirebaseWebConfig | null> {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const response = await fetch("/__/firebase/init.json", {
      cache: "no-store",
      credentials: "same-origin",
    })

    if (!response.ok) {
      updateFirebaseDebugInfo({ lastError: `hosting-proxy: ${response.status}` })
      return null
    }

    const hostedConfig = await response.json() as FirebaseWebConfig
    return {
      apiKey: hostedConfig.apiKey,
      authDomain: hostedConfig.authDomain,
      databaseURL: hostedConfig.databaseURL,
      projectId: hostedConfig.projectId,
      storageBucket: hostedConfig.storageBucket,
      messagingSenderId: hostedConfig.messagingSenderId,
      appId: hostedConfig.appId,
      measurementId: hostedConfig.measurementId,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    updateFirebaseDebugInfo({ lastError: `hosting-proxy: ${message}` })
    console.error("Failed to load hosted Firebase config", error)
    return null
  }
}

export async function ensureFirebaseInitialized(): Promise<FirebaseServices> {
  if (app && auth && rtdb && googleProvider) {
    return { app, auth, rtdb, googleProvider }
  }

  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = (async () => {
    if (hasRequiredConfig(firebaseConfig)) {
      updateFirebaseDebugInfo({
        source: 'env',
        attempts: ['env'],
        missingKeys: [],
        projectId: firebaseConfig.projectId,
        lastError: undefined,
      })
      return assignFirebaseServices(firebaseConfig)
    }

    updateFirebaseDebugInfo({
      source: 'unavailable',
      attempts: ['env'],
      missingKeys: getMissingKeys(firebaseConfig),
      projectId: firebaseConfig.projectId,
    })

    const serverConfig = await loadServerFirebaseConfig()
    if (serverConfig && hasRequiredConfig(serverConfig)) {
      updateFirebaseDebugInfo({
        source: 'server-api',
        attempts: ['env', 'server-api'],
        missingKeys: [],
        projectId: serverConfig.projectId,
        lastError: undefined,
      })
      return assignFirebaseServices(serverConfig)
    }

    const hostedConfig = await loadHostedFirebaseConfig()
    if (hostedConfig && hasRequiredConfig(hostedConfig)) {
      updateFirebaseDebugInfo({
        source: 'hosting-proxy',
        attempts: ['env', 'server-api', 'hosting-proxy'],
        missingKeys: [],
        projectId: hostedConfig.projectId,
        lastError: undefined,
      })
      return assignFirebaseServices(hostedConfig)
    }

    updateFirebaseDebugInfo({
      source: 'unavailable',
      attempts: ['env', 'server-api', 'hosting-proxy'],
      missingKeys: getMissingKeys(firebaseConfig),
    })

    console.error('Firebase initialization failed', getFirebaseDebugInfo())

    return { app: null, auth: null, rtdb: null, googleProvider: null }
  })()

  return initializationPromise
}

if (hasRequiredConfig(firebaseConfig)) {
  assignFirebaseServices(firebaseConfig)
} else if (typeof window !== "undefined") {
  void ensureFirebaseInitialized()
}
