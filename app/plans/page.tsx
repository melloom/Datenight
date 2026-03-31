"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Crown,
  Loader2,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import {
  cancelStripeSubscription,
  createBillingPortalSession,
  createStripeCheckout,
  fetchBillingStatus,
  type PlanInterval,
} from "@/lib/subscription"

const PLAN_DETAILS: Record<PlanInterval, { name: string; price: string; cadence: string; note: string; badge?: string }> = {
  monthly: {
    name: "Monthly Pro",
    price: "$9.99",
    cadence: "/month",
    note: "Flexible month-to-month access after your 3-day trial.",
  },
  yearly: {
    name: "Yearly Pro",
    price: "$99.99",
    cadence: "/year",
    note: "Best value. Equivalent to about $8.33/month.",
    badge: "Best value",
  },
}

type BillingStatusData = Awaited<ReturnType<typeof fetchBillingStatus>>

function formatDate(timestamp?: number | null) {
  if (!timestamp) return "Not available"

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp))
}

function getStatusTone(status?: string) {
  if (status === "active" || status === "trialing") return "text-emerald-700"
  if (status === "past_due" || status === "unpaid") return "text-amber-700"
  if (status === "canceled") return "text-rose-700"
  return "text-slate-900"
}

function PlansPageContent() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const [pendingPlan, setPendingPlan] = useState<PlanInterval | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [refreshingStatus, setRefreshingStatus] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [billingStatus, setBillingStatus] = useState<BillingStatusData | null>(null)
  const [statusSummary, setStatusSummary] = useState("")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  const isBusy = useMemo(
    () => !!pendingPlan || openingPortal || refreshingStatus || canceling,
    [pendingPlan, openingPortal, refreshingStatus, canceling]
  )
  const hasPremiumAccess = Boolean(billingStatus?.allowed)
  const hasSubscription = Boolean(billingStatus?.billing.subscriptionId)

  const refreshBillingStatus = async (silent = false) => {
    if (!silent) {
      setRefreshingStatus(true)
    }

    try {
      const result = await fetchBillingStatus()
      setBillingStatus(result)

      const status = result.billing.status || "none"
      const access = result.allowed ? "active" : "inactive"
      setStatusSummary(`Status: ${status} | Access: ${access}`)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to refresh billing status"
      setError(message)
      return null
    } finally {
      if (!silent) {
        setRefreshingStatus(false)
      }
    }
  }

  useEffect(() => {
    if (!loading && user) {
      void refreshBillingStatus(true)
      return
    }

    if (!loading && !user) {
      setBillingStatus(null)
      setStatusSummary("")
    }
  }, [loading, user])

  useEffect(() => {
    const billingEvent = searchParams.get("billing")
    if (!billingEvent) return

    if (billingEvent === "success") {
      setNotice("Subscription started. Billing status is refreshing now.")
      if (user) {
        void refreshBillingStatus(true)
      }
      return
    }

    if (billingEvent === "cancelled") {
      setNotice("Checkout was canceled. No changes were made to your subscription.")
      return
    }

    if (billingEvent === "portal") {
      setNotice("Returned from the billing portal. Latest billing details are shown below.")
      if (user) {
        void refreshBillingStatus(true)
      }
    }
  }, [searchParams, user])

  const handleCheckout = async (plan: PlanInterval) => {
    setError("")
    setNotice("")
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
    setNotice("")
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
    setNotice("")
    await refreshBillingStatus()
  }

  const handleCancelAtPeriodEnd = async () => {
    setError("")
    setNotice("")
    setCanceling(true)

    try {
      await cancelStripeSubscription(false)
      setStatusSummary("Subscription will cancel at period end. Premium access remains until then.")
      await refreshBillingStatus(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to cancel subscription"
      setError(message)
    } finally {
      setCanceling(false)
    }
  }

  return (
    <main className="min-h-svh overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_30%),linear-gradient(180deg,#fffdf8_0%,#ffffff_46%,#f8fafc_100%)] px-5 py-8 md:px-8 md:py-12">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 rounded-[28px] border border-white/80 bg-white/85 p-6 shadow-[0_24px_90px_-40px_rgba(15,23,42,0.35)] backdrop-blur-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                <Sparkles className="h-3.5 w-3.5" />
                Premium access
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-5xl">Billing &amp; Plans</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 md:text-base">
                Unlock DateNight Pro for premium AI planning, saved venues, and self-serve subscription management without leaving the app flow.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to planner
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-[24px] border border-slate-900/80 bg-slate-950 p-6 text-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.85)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Account status</p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    {loading ? "Checking account..." : user ? (hasPremiumAccess ? "Premium is active" : "Free access") : "Sign in to manage billing"}
                  </h2>
                </div>
                <div className="rounded-2xl bg-white/10 p-3 text-cyan-200">
                  <ShieldCheck className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">Status</p>
                  <p className={`mt-2 text-lg font-semibold capitalize ${billingStatus?.billing.status ? getStatusTone(billingStatus.billing.status) : "text-white"}`}>
                    {billingStatus?.billing.status || (user ? "none" : "guest")}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">Trial ends</p>
                  <p className="mt-2 text-lg font-semibold text-white">{formatDate(billingStatus?.billing.trialEnd)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">Period ends</p>
                  <p className="mt-2 text-lg font-semibold text-white">{formatDate(billingStatus?.billing.currentPeriodEnd)}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-200">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Premium AI tools
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Saved venues and favorites
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-400/30 bg-fuchsia-400/10 px-3 py-1.5">
                  <Wallet className="h-3.5 w-3.5" />
                  Stripe self-serve billing
                </span>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">What you get</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <Crown className="mt-0.5 h-4 w-4 text-amber-500" />
                  Premium AI plan improvements and smarter recommendations.
                </li>
                <li className="flex items-start gap-3">
                  <CreditCard className="mt-0.5 h-4 w-4 text-cyan-600" />
                  Secure checkout, invoices, and payment management in Stripe.
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                  Trial support, live billing refresh, and cancellation controls in one place.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {notice && (
          <div className="mb-5 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-800 shadow-sm">
            {notice}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[28px] border border-white/80 bg-white/88 p-6 shadow-[0_24px_90px_-45px_rgba(15,23,42,0.35)] backdrop-blur-sm md:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="rounded-2xl bg-slate-950 p-3 text-white">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Choose your plan</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Start with a 3-day trial, then keep monthly flexibility or lock in the lower yearly rate.
                </p>
              </div>
            </div>

            {!loading && !user && (
              <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                Sign in first to start a subscription or open the Stripe billing portal.
              </div>
            )}

            <div className="grid gap-4 xl:grid-cols-2">
              {(["monthly", "yearly"] as PlanInterval[]).map((plan) => {
                const details = PLAN_DETAILS[plan]
                return (
                  <button
                    key={plan}
                    onClick={() => handleCheckout(plan)}
                    disabled={loading || !user || isBusy || (hasPremiumAccess && hasSubscription)}
                    className={`group relative overflow-hidden rounded-[24px] border p-5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-55 ${
                      plan === "yearly"
                        ? "border-amber-300 bg-[linear-gradient(180deg,rgba(255,251,235,1)_0%,rgba(255,255,255,1)_70%)] shadow-[0_16px_40px_-28px_rgba(217,119,6,0.45)] hover:border-amber-400"
                        : "border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-slate-950">{details.name}</h3>
                          {details.badge && (
                            <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                              {details.badge}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{details.note}</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-right shadow-sm">
                        <div className="text-2xl font-bold tracking-tight text-slate-950">{details.price}</div>
                        <div className="text-xs text-slate-500">{details.cadence}</div>
                      </div>
                    </div>

                    <div className="mt-5 space-y-2 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        3-day free trial before billing starts.
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Premium AI editing, swaps, and smarter plan generation.
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Saved favorites and subscription management through Stripe.
                      </div>
                    </div>

                    <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-colors group-hover:bg-slate-800">
                      {(hasPremiumAccess && hasSubscription) ? "Already subscribed" : `Start ${plan} plan`}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[28px] border border-white/80 bg-white/88 p-6 shadow-[0_24px_90px_-45px_rgba(15,23,42,0.35)] backdrop-blur-sm md:p-7">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-cyan-50 p-3 text-cyan-700">
                  <Wallet className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-slate-950">Manage billing</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Open the Stripe portal, refresh your current state, or schedule cancellation at period end.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <button
                  onClick={handlePortal}
                  disabled={loading || !user || isBusy}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>
                    <span className="block text-sm font-semibold text-slate-950">Open Stripe portal</span>
                    <span className="block text-xs text-slate-500">Update payment method, view invoices, and manage subscription details.</span>
                  </span>
                  <CreditCard className="h-4 w-4 text-slate-500" />
                </button>

                <button
                  onClick={handleRefreshStatus}
                  disabled={loading || !user || isBusy}
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>
                    <span className="block text-sm font-semibold text-slate-950">Refresh billing status</span>
                    <span className="block text-xs text-slate-500">Pull the latest subscription state from your account.</span>
                  </span>
                  <BadgeCheck className="h-4 w-4 text-slate-500" />
                </button>

                <button
                  onClick={handleCancelAtPeriodEnd}
                  disabled={loading || !user || isBusy || !hasSubscription}
                  className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-left transition-colors hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span>
                    <span className="block text-sm font-semibold text-rose-700">Cancel at period end</span>
                    <span className="block text-xs text-rose-600">Keep premium access through the end of the current billing cycle.</span>
                  </span>
                  <ShieldCheck className="h-4 w-4 text-rose-500" />
                </button>
              </div>

              {isBusy && (
                <div className="mt-4 inline-flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {pendingPlan ? `Preparing ${pendingPlan} checkout...` : "Processing billing request..."}
                </div>
              )}

              {statusSummary && (
                <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{statusSummary}</p>
              )}
            </div>

            <div className="rounded-[28px] border border-white/80 bg-white/88 p-6 shadow-[0_24px_90px_-45px_rgba(15,23,42,0.35)] backdrop-blur-sm md:p-7">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">Subscription details</h2>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span>Entitlement</span>
                  <span className={`font-semibold ${hasPremiumAccess ? "text-emerald-700" : "text-slate-900"}`}>
                    {hasPremiumAccess ? "Premium active" : "Free tier"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span>Subscription status</span>
                  <span className={`font-semibold capitalize ${getStatusTone(billingStatus?.billing.status)}`}>
                    {billingStatus?.billing.status || "none"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span>Trial ends</span>
                  <span className="font-semibold text-slate-900">{formatDate(billingStatus?.billing.trialEnd)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span>Current period end</span>
                  <span className="font-semibold text-slate-900">{formatDate(billingStatus?.billing.currentPeriodEnd)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span>Cancel at period end</span>
                  <span className="font-semibold text-slate-900">{billingStatus?.billing.cancelAtPeriodEnd ? "Yes" : "No"}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span>Grandfathered access</span>
                  <span className="font-semibold text-slate-900">{billingStatus?.billing.grandfathered ? "Yes" : "No"}</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

export default function PlansPage() {
  return (
    <Suspense fallback={null}>
      <PlansPageContent />
    </Suspense>
  )
}
