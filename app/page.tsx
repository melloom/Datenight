"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { MysteryDateApp } from "@/components/mystery-date/mystery-date-app"
import { fetchBillingStatus } from "@/lib/subscription"
import LandingPage from "./landing/page"

export default function Page() {
  const { user, loading, signOut } = useAuth()
  const [isCheckingBilling, setIsCheckingBilling] = useState(false)
  const [billingChecked, setBillingChecked] = useState(false)
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false)
  const [billingError, setBillingError] = useState("")
  const [billingCheckVersion, setBillingCheckVersion] = useState(0)

  useEffect(() => {
    let cancelled = false

    const checkBilling = async () => {
      if (!user) {
        setBillingChecked(false)
        setHasPremiumAccess(false)
        setBillingError("")
        return
      }

      setIsCheckingBilling(true)
      setBillingError("")

      try {
        const status = await fetchBillingStatus()
        if (!cancelled) {
          setHasPremiumAccess(Boolean(status.allowed))
          setBillingChecked(true)
        }
      } catch (error) {
        if (!cancelled) {
          setHasPremiumAccess(false)
          setBillingChecked(true)
          setBillingError(error instanceof Error ? error.message : "Unable to verify billing status")
        }
      } finally {
        if (!cancelled) {
          setIsCheckingBilling(false)
        }
      }
    }

    if (!loading) {
      void checkBilling()
    }

    return () => {
      cancelled = true
    }
  }, [loading, user, billingCheckVersion])

  // Show loading spinner while checking auth state
  if (loading || (user && (!billingChecked || isCheckingBilling))) {
    return (
      <div className="flex items-center justify-center min-h-svh bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">{loading ? "Loading..." : "Checking your plan..."}</p>
        </div>
      </div>
    )
  }

  if (user && !hasPremiumAccess) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.14),transparent_40%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-10">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_30px_90px_-55px_rgba(15,23,42,0.45)] md:p-8">
          <p className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
            Premium required
          </p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Choose a plan to use DateNight</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
            Your account is signed in, but premium access is needed before you can build date plans. Start with a 3-day free trial and continue with the monthly or yearly plan.
          </p>

          {billingError && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {billingError}
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/plans"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              View pricing and start 3-day trial
            </Link>
            <button
              onClick={() => {
                setBillingChecked(false)
                setBillingCheckVersion((version) => version + 1)
              }}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Retry status check
            </button>
            <button
              onClick={() => void signOut()}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Logged in with premium access → show app
  if (user) {
    return <MysteryDateApp />
  }

  // Not logged in → show landing page
  return <LandingPage />
}
