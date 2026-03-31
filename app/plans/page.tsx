"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CreditCard, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  createBillingPortalSession,
  createStripeCheckout,
  fetchBillingStatus,
  type PlanInterval,
} from "@/lib/subscription"

export default function PlansPage() {
  const { user, loading } = useAuth()
  const [pendingPlan, setPendingPlan] = useState<PlanInterval | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [refreshingStatus, setRefreshingStatus] = useState(false)
  const [statusSummary, setStatusSummary] = useState<string>("")
  const [error, setError] = useState<string>("")

  const isBusy = useMemo(() => !!pendingPlan || openingPortal || refreshingStatus, [pendingPlan, openingPortal, refreshingStatus])

  const handleCheckout = async (plan: PlanInterval) => {
    setError("")
    setPendingPlan(plan)

    try {
      const session = await createStripeCheckout(plan)
      if (session.url) {
        window.location.href = session.url
        return
      }

      throw new Error("Stripe did not return a checkout URL")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to start checkout"
      setError(message)
    } finally {
      setPendingPlan(null)
    }
  }

  const handlePortal = async () => {
    setError("")
    setOpeningPortal(true)

    try {
      const portal = await createBillingPortalSession()
      window.location.href = portal.url
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to open billing portal"
      setError(message)
    } finally {
      setOpeningPortal(false)
    }
  }

  const handleRefreshStatus = async () => {
    setError("")
    setRefreshingStatus(true)

    try {
      const result = await fetchBillingStatus()
      const status = result.billing.status || "none"
      const access = result.allowed ? "active" : "inactive"
      setStatusSummary(`Status: ${status} | Access: ${access}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to refresh billing status"
      setError(message)
    } finally {
      setRefreshingStatus(false)
    }
  }

  return (
    <main className="min-h-svh bg-background px-5 py-10 md:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">Billing & Plans</h1>
          <Link href="/" className="text-sm text-primary hover:underline">
            Back to planner
          </Link>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Subscribe before using premium AI and save features. Choose monthly or yearly, then manage billing anytime from the Stripe portal.
              </p>
            </div>
          </div>

          {!loading && !user && (
            <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700">
              Sign in first to start a subscription.
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <button
              onClick={() => handleCheckout("monthly")}
              disabled={loading || !user || isBusy}
              className="rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="text-sm font-semibold text-foreground">Start monthly plan</div>
              <div className="text-xs text-muted-foreground">Charged monthly after your trial period</div>
            </button>

            <button
              onClick={() => handleCheckout("yearly")}
              disabled={loading || !user || isBusy}
              className="rounded-xl border border-border bg-background px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <div className="text-sm font-semibold text-foreground">Start yearly plan</div>
              <div className="text-xs text-muted-foreground">Charged yearly after your trial period</div>
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={handlePortal}
              disabled={loading || !user || isBusy}
              className="rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              Manage subscription
            </button>
            <button
              onClick={handleRefreshStatus}
              disabled={loading || !user || isBusy}
              className="rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              Refresh billing status
            </button>
          </div>

          {isBusy && (
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {pendingPlan ? `Preparing ${pendingPlan} checkout...` : "Processing billing request..."}
            </div>
          )}

          {statusSummary && (
            <p className="mt-4 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground">{statusSummary}</p>
          )}

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </main>
  )
}
