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

  return { app, auth, rtdb, googleProvider }
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
      return assignFirebaseServices(firebaseConfig)
    }

    const hostedConfig = await loadHostedFirebaseConfig()
    if (hostedConfig && hasRequiredConfig(hostedConfig)) {
      return assignFirebaseServices(hostedConfig)
    }

    return { app: null, auth: null, rtdb: null, googleProvider: null }
  })()

  return initializationPromise
}

if (hasRequiredConfig(firebaseConfig)) {
  assignFirebaseServices(firebaseConfig)
} else if (typeof window !== "undefined") {
  void ensureFirebaseInitialized()
}
