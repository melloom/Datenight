"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import {
  User,
  UserCredential,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth"
import { ref, set, get } from "firebase/database"
import { auth, rtdb, googleProvider } from "@/lib/firebase"

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
  const [loading, setLoading] = useState(() => Boolean(auth && rtdb))

  useEffect(() => {
    // Don't initialize Firebase auth if services are not available
    if (!auth || !rtdb) {
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)

      if (firebaseUser && rtdb) {
        // Update user profile in RTDB on login
        const userRef = ref(rtdb, `users/${firebaseUser.uid}/profile`)
        const snapshot = await get(userRef)

        if (!snapshot.exists()) {
          // First time user — create profile
          await set(userRef, {
            displayName: firebaseUser.displayName || "Anonymous",
            email: firebaseUser.email || "",
            photoURL: firebaseUser.photoURL || "",
            createdAt: Date.now(),
            lastLogin: Date.now(),
          })
        } else {
          // Returning user — update last login
          await set(ref(rtdb, `users/${firebaseUser.uid}/profile/lastLogin`), Date.now())
        }
      }
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) {
      throw new Error("Firebase authentication not available")
    }
    try {
      const result: UserCredential = await signInWithPopup(auth, googleProvider)
      setUser(result.user)
      setLoading(false)
      return true
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: string }).code === "auth/popup-closed-by-user"
      ) {
        return false
      }
      throw error
    }
  }

  const signOut = async () => {
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
