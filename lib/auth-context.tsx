"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth"
import { ref, set, get, serverTimestamp } from "firebase/database"
import { auth, rtdb, googleProvider } from "@/lib/firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)

      if (firebaseUser) {
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
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error: any) {
      if (error.code === "auth/popup-closed-by-user") {
        console.log("Sign-in popup closed by user")
        return
      }
      console.error("Google sign-in error:", error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error("Sign-out error:", error)
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
