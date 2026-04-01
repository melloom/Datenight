"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { LoginScreen } from "@/components/mystery-date/login-screen"

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get("returnTo") || "/"

  useEffect(() => {
    if (!loading && user) {
      router.replace(returnTo)
    }
  }, [loading, returnTo, router, user])

  if (loading || user) {
    return (
      <div className="flex items-center justify-center min-h-svh bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <LoginScreen returnTo={returnTo} />
}
