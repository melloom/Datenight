"use client"

import { useAuth } from "@/lib/auth-context"
import { LoginScreen } from "@/components/mystery-date/login-screen"
import { MysteryDateApp } from "@/components/mystery-date/mystery-date-app"

export default function Page() {
  const { user, loading } = useAuth()

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-svh bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Not logged in → show login
  if (!user) {
    return <LoginScreen />
  }

  // Logged in → show app
  return <MysteryDateApp />
}
