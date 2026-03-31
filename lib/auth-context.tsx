"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import {
  User,
  UserCredential,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
} from "firebase/auth"
import { ref, set, get } from "firebase/database"
import { ensureFirebaseInitialized } from "@/lib/firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<boolean>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => false,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    let unsubscribe: (() => void) | undefined

    const initializeAuth = async () => {
      const { auth, rtdb } = await ensureFirebaseInitialized()

      if (!isMounted) {
        return
      }

      if (!auth || !rtdb) {
        setLoading(false)
        return
      }

      getRedirectResult(auth).then((result) => {
        if (result?.user && isMounted) {
          setUser(result.user)
        }
      }).catch(() => {
        // Redirect result check failed — not critical
      })

      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!isMounted) {
          return
        }

        setUser(firebaseUser)
        setLoading(false)

        if (firebaseUser) {
          const userRef = ref(rtdb, `users/${firebaseUser.uid}/profile`)
          const snapshot = await get(userRef)

          if (!snapshot.exists()) {
            await set(userRef, {
              displayName: firebaseUser.displayName || "Anonymous",
              email: firebaseUser.email || "",
              photoURL: firebaseUser.photoURL || "",
              createdAt: Date.now(),
              lastLogin: Date.now(),
            })
          } else {
            await set(ref(rtdb, `users/${firebaseUser.uid}/profile/lastLogin`), Date.now())
          }
        }
      })
    }

    void initializeAuth()

    return () => {
      isMounted = false
      unsubscribe?.()
    }
  }, [])

  const signInWithGoogle = async () => {
    const { auth, googleProvider } = await ensureFirebaseInitialized()

    if (!auth || !googleProvider) {
      throw new Error("Firebase authentication not available")
    }
    try {
      const result: UserCredential = await signInWithPopup(auth, googleProvider)
      setUser(result.user)
      setLoading(false)
      return true
    } catch (error: unknown) {
      const code = typeof error === "object" && error !== null && "code" in error
        ? (error as { code?: string }).code
        : ""

      // User closed popup — not an error
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return false
      }

      // Popup blocked or unauthorized domain — fall back to redirect
      if (
        code === "auth/popup-blocked" ||
        code === "auth/unauthorized-domain" ||
        code === "auth/operation-not-supported-in-this-environment"
      ) {
        await signInWithRedirect(auth, googleProvider)
        return false
      }

      throw error
    }
  }

  const signOut = async () => {
    const { auth } = await ensureFirebaseInitialized()

    if (!auth) {
      throw new Error("Firebase authentication not available")
    }
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
