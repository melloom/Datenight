import { initializeApp, getApps, getApp } from "firebase/app"
import { getAnalytics, isSupported } from "firebase/analytics"
import { browserLocalPersistence, getAuth, GoogleAuthProvider, setPersistence } from "firebase/auth"
import { getDatabase } from "firebase/database"

const productionAuthHosts = new Set(["dat3night.com", "www.dat3night.com"])

const getAuthDomain = () => {
  if (typeof window !== "undefined" && productionAuthHosts.has(window.location.hostname)) {
    return window.location.hostname
  }

  return process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: getAuthDomain(),
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
}

// Check if all required Firebase config is available
const isFirebaseConfigValid = () => {
  return firebaseConfig.apiKey && 
         firebaseConfig.authDomain && 
         firebaseConfig.projectId && 
         firebaseConfig.appId
}

// Initialize Firebase (prevent duplicate initialization)
const app = isFirebaseConfigValid() && getApps().length === 0 ? initializeApp(firebaseConfig) : (getApps().length > 0 ? getApp() : null)

// Initialize services
const auth = app ? getAuth(app) : null
const rtdb = app ? getDatabase(app) : null
const googleProvider = app ? new GoogleAuthProvider() : null

if (auth) {
  setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error("Failed to enable Firebase auth persistence", error)
  })
}

// Analytics only in browser
let analytics: ReturnType<typeof getAnalytics> | null = null
if (typeof window !== "undefined" && app) {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app)
    }
  })
}

export { app, auth, rtdb, analytics, googleProvider, firebaseConfig }
