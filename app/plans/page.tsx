"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowRight,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Crown,
  Loader2,
  ShieldCheck,
  Sparkles,
  Star,
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

const PLAN_PRICES: Record<PlanInterval, number> = {
  monthly: 9.99,
  yearly: 99.99,
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

function formatBillingDate(timestamp: number | null | undefined, grandfathered?: boolean) {
  if (timestamp) {
    return formatDate(timestamp)
  }

  if (grandfathered) {
    return "Grandfathered"
  }

  return "Not available"
}

function formatBillingDateFromState(
  timestamp: number | null | undefined,
  billing?: BillingStatusData["billing"],
  allowed?: boolean
) {
  if (timestamp) {
    return formatDate(timestamp)
  }

  if (billing?.grandfathered) {
    return "Grandfathered"
  }

  // Legacy/forever premium accounts may be active without Stripe trial/period fields.
  if (allowed && billing?.status === "active" && !billing?.subscriptionId) {
    return "Included with account"
  }

  return "Not available"
}

function getNextChargeAt(billing?: BillingStatusData["billing"]): number | null {
  if (!billing) {
    return null
  }

  if (billing.status === "trialing" && billing.trialEnd) {
    return billing.trialEnd
  }

  if (billing.subscriptionId && billing.currentPeriodEnd) {
    return billing.currentPeriodEnd
  }

  return null
}

function formatNextChargeCountdown(
  billing?: BillingStatusData["billing"],
  allowed?: boolean
): string {
  if (!billing) {
    return "Not available"
  }

  const nextChargeAt = getNextChargeAt(billing)
  if (!nextChargeAt) {
    if (billing.grandfathered || (allowed && billing.status === "active" && !billing.subscriptionId)) {
      return "Included with account"
    }

    return "Not scheduled"
  }

  const msUntil = nextChargeAt - Date.now()
  const daysUntil = Math.max(0, Math.ceil(msUntil / (1000 * 60 * 60 * 24)))

  if (daysUntil === 0) {
    return "Today"
  }

  if (daysUntil === 1) {
    return "1 day"
  }

  return `${daysUntil} days`
}

function getStatusTone(status?: string) {
  if (status === "active" || status === "trialing") return "text-emerald-700"
  if (status === "past_due" || status === "unpaid") return "text-amber-700"
  if (status === "canceled") return "text-rose-700"
  return "text-slate-900"
}

function isPlanInterval(value: string | null): value is PlanInterval {
  return value === "monthly" || value === "yearly"
}

function PlansPageContent() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pendingPlan, setPendingPlan] = useState<PlanInterval | null>(null)
  const [openingPortal, setOpeningPortal] = useState(false)
  const [refreshingStatus, setRefreshingStatus] = useState(false)
  const [canceling, setCanceling] = useState(false)
  const [billingStatus, setBillingStatus] = useState<BillingStatusData | null>(null)
  const [statusSummary, setStatusSummary] = useState("")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PlanInterval | null>(null)
  const [handledLoginCheckoutIntent, setHandledLoginCheckoutIntent] = useState(false)
  const [guestFocusPlan, setGuestFocusPlan] = useState<PlanInterval>("yearly")
  const isPlanModalOpen = selectedPlanForCheckout !== null

  const isBusy = useMemo(
    () => !!pendingPlan || openingPortal || refreshingStatus || canceling,
    [pendingPlan, openingPortal, refreshingStatus, canceling]
  )
  const hasPremiumAccess = Boolean(billingStatus?.allowed)
  const hasSubscription = Boolean(billingStatus?.billing.subscriptionId)
  const isGrandfathered = Boolean(billingStatus?.billing.grandfathered)
  const annualMonthlyCost = PLAN_PRICES.monthly * 12
  const yearlySavings = Math.max(0, annualMonthlyCost - PLAN_PRICES.yearly)
  const yearlySavingsPercent = Math.round((yearlySavings / annualMonthlyCost) * 100)

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
      return
    }

    if (billingEvent === "portal_unavailable_grandfathered") {
      setNotice("Billing portal is not required for this account because premium access is included (grandfathered/forever).")
      if (user) {
        void refreshBillingStatus(true)
      }
    }
  }, [searchParams, user])

  useEffect(() => {
    if (loading || !user || handledLoginCheckoutIntent) {
      return
    }

    const checkoutIntent = searchParams.get("checkout")
    const planParam = searchParams.get("plan")

    if (checkoutIntent !== "1" || !isPlanInterval(planParam)) {
      return
    }

    if (hasPremiumAccess && hasSubscription) {
      setNotice("You already have an active subscription on this account.")
      setHandledLoginCheckoutIntent(true)
      return
    }

    setNotice(`Nice choice. ${PLAN_DETAILS[planParam].name} is ready when you confirm checkout.`)
    setSelectedPlanForCheckout(planParam)
    setHandledLoginCheckoutIntent(true)
  }, [loading, user, handledLoginCheckoutIntent, searchParams, hasPremiumAccess, hasSubscription])

  const startCheckout = async (plan: PlanInterval) => {
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

  const handlePlanSelection = (plan: PlanInterval) => {
    setError("")
    setNotice("")

    if (!user) {
      const returnTo = `/plans?checkout=1&plan=${plan}`
      router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`)
      return
    }

    setSelectedPlanForCheckout(plan)
  }

  const handleConfirmCheckout = async () => {
    if (!selectedPlanForCheckout) {
      return
    }

    const plan = selectedPlanForCheckout
    setSelectedPlanForCheckout(null)
    await startCheckout(plan)
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
      if (message.toLowerCase().includes("no active subscription")) {
        setNotice("There is no active Stripe subscription to cancel right now.")
        await refreshBillingStatus(true)
      } else {
        setError(message)
      }
    } finally {
      setCanceling(false)
    }
  }

  if (!loading && !user) {
    return (
      <main className="min-h-svh overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.14),transparent_32%),linear-gradient(180deg,#fffefb_0%,#ffffff_46%,#f8fafc_100%)] px-5 pb-28 pt-8 md:px-8 md:py-12">
        <div className="mx-auto w-full max-w-6xl">
          <div className="mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </div>

          <div className="mb-8 rounded-[30px] border border-white/80 bg-white/85 p-6 shadow-[0_24px_90px_-40px_rgba(15,23,42,0.35)] backdrop-blur-sm md:p-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
              <Sparkles className="h-3.5 w-3.5" />
              Pricing that saves date night
            </div>
            <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
              Less "what should we do tonight?".
              <span className="block text-slate-700">More "wow, this was the best date yet".</span>
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 md:text-lg">
              DateNight Pro plans your night in minutes with smarter venue picks, timing that actually works, and AI upgrades that feel like having a fun friend who is weirdly good at logistics.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
              <span className="rounded-full border border-emerald-300/70 bg-emerald-50 px-3 py-1.5 text-emerald-700">3-day free trial</span>
              <span className="rounded-full border border-cyan-300/70 bg-cyan-50 px-3 py-1.5 text-cyan-700">Cancel anytime</span>
              <span className="rounded-full border border-fuchsia-300/70 bg-fuchsia-50 px-3 py-1.5 text-fuchsia-700">No awkward spreadsheets required</span>
            </div>
          </div>

          <section className="mb-6 rounded-3xl border border-white/80 bg-white/88 p-5 shadow-[0_20px_70px_-46px_rgba(15,23,42,0.4)] md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Monthly vs yearly</p>
                <p className="mt-1 text-sm text-slate-600">Toggle plans and see your live annual savings instantly.</p>
              </div>
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
                {(["monthly", "yearly"] as PlanInterval[]).map((plan) => (
                  <button
                    key={plan}
                    onClick={() => setGuestFocusPlan(plan)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                      guestFocusPlan === plan ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {plan}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Current view</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{PLAN_DETAILS[guestFocusPlan].name}</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-emerald-700">Yearly savings</p>
                <p className="mt-1 text-lg font-semibold text-emerald-800">${yearlySavings.toFixed(2)} / year</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-amber-700">Savings rate</p>
                <p className="mt-1 text-lg font-semibold text-amber-800">{yearlySavingsPercent}% vs monthly</p>
              </div>
            </div>
          </section>

          <section className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_16px_50px_-34px_rgba(15,23,42,0.35)] md:p-5">
            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center gap-1 text-amber-500"><Star className="h-3.5 w-3.5 fill-current" /><Star className="h-3.5 w-3.5 fill-current" /><Star className="h-3.5 w-3.5 fill-current" /><Star className="h-3.5 w-3.5 fill-current" /><Star className="h-3.5 w-3.5 fill-current" /></div>
                <p className="mt-1 font-semibold text-slate-900">"Date planning arguments dropped 93%."</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">12k+ nights planned</p>
                <p className="mt-1 text-slate-600">by couples who wanted better dates and fewer tabs open.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">4.9/5 average love-it score</p>
                <p className="mt-1 text-slate-600">for recommendations, pacing, and "this was actually fun" factor.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="font-semibold text-slate-900">Powered by Stripe billing</p>
                <p className="mt-1 text-slate-600">secure checkout, simple cancellations, no billing mysteries.</p>
              </div>
            </div>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            {(["monthly", "yearly"] as PlanInterval[]).map((plan) => {
              const details = PLAN_DETAILS[plan]
              return (
                <button
                  key={plan}
                  onClick={() => {
                    setGuestFocusPlan(plan)
                    handlePlanSelection(plan)
                  }}
                  onMouseEnter={() => setGuestFocusPlan(plan)}
                  disabled={isBusy}
                  className={`group relative overflow-hidden rounded-[28px] border p-6 text-left transition-all duration-300 hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-60 md:p-7 ${
                    plan === "yearly"
                      ? "border-amber-300 bg-[linear-gradient(180deg,rgba(255,251,235,1)_0%,rgba(255,255,255,1)_74%)] shadow-[0_22px_60px_-34px_rgba(217,119,6,0.55)] hover:border-amber-500 hover:shadow-[0_30px_80px_-38px_rgba(217,119,6,0.7)]"
                      : "border-slate-200 bg-white shadow-[0_20px_56px_-38px_rgba(15,23,42,0.45)] hover:border-slate-400"
                  }`}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.8),transparent_45%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-950">{details.name}</h2>
                        {details.badge && (
                          <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">{details.badge}</span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{details.note}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-right shadow-sm">
                      <div className="text-3xl font-bold tracking-tight text-slate-950">{details.price}</div>
                      <div className="text-xs text-slate-500">{details.cadence}</div>
                    </div>
                  </div>

                  <ul className="relative mt-6 space-y-2.5 text-sm text-slate-700">
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> 3-day free trial before any charge.</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Premium AI upgrades, smarter swaps, better plans.</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Save favorites and keep every great find organized.</li>
                    <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Cancel in seconds if your wallet says "not today".</li>
                  </ul>

                  <div className="relative mt-7 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-slate-800">
                    Choose {plan} plan
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </button>
              )
            })}
          </div>

          <section className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <p className="text-sm font-semibold text-slate-900">Step 1</p>
              <p className="mt-1 text-sm text-slate-600">Pick your plan. We promise no 17-page contract hidden behind a tiny checkbox.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <p className="text-sm font-semibold text-slate-900">Step 2</p>
              <p className="mt-1 text-sm text-slate-600">Sign in and start your 3-day trial. No charge until trial ends.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
              <p className="text-sm font-semibold text-slate-900">Step 3</p>
              <p className="mt-1 text-sm text-slate-600">Enjoy better dates and fewer planning debates about "whatever you want".</p>
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-white/80 bg-white/88 p-6 shadow-[0_24px_90px_-45px_rgba(15,23,42,0.35)] md:p-8">
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">Questions people ask before upgrading</h3>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Do I get charged today?</p>
                <p className="mt-1 text-sm text-slate-600">No. You start with a 3-day trial first, then billing begins only after trial ends.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Can I cancel easily?</p>
                <p className="mt-1 text-sm text-slate-600">Yes. Open billing settings and cancel anytime without emailing support.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Why yearly?</p>
                <p className="mt-1 text-sm text-slate-600">It is the best value if you want ongoing date ideas all year.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Will this actually help us decide faster?</p>
                <p className="mt-1 text-sm text-slate-600">Yes. That is the whole point. Less scrolling, less indecision, more actual dating.</p>
              </div>
            </div>
          </section>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur md:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
            <button
              onClick={() => handlePlanSelection(guestFocusPlan)}
              disabled={isBusy}
              className="flex w-full items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-left text-white disabled:opacity-60"
            >
              <span>
                <span className="block text-[11px] uppercase tracking-[0.14em] text-slate-200">Start 3-day trial</span>
                <span className="block text-sm font-semibold">{PLAN_DETAILS[guestFocusPlan].name} • {PLAN_DETAILS[guestFocusPlan].price}{PLAN_DETAILS[guestFocusPlan].cadence}</span>
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </main>
    )
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
                Start DateNight Pro with a 3-day free trial, then keep full premium planning with monthly flexibility or yearly savings.
              </p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">No contract lock-in. Cancel anytime.</p>
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
                  <p className="mt-2 text-lg font-semibold text-white">{formatBillingDateFromState(billingStatus?.billing.trialEnd, billingStatus?.billing, billingStatus?.allowed)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">Period ends</p>
                  <p className="mt-2 text-lg font-semibold text-white">{formatBillingDateFromState(billingStatus?.billing.currentPeriodEnd, billingStatus?.billing, billingStatus?.allowed)}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-slate-300">Next charge in</p>
                  <p className="mt-2 text-lg font-semibold text-white">{formatNextChargeCountdown(billingStatus?.billing, billingStatus?.allowed)}</p>
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
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Why couples upgrade</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <Crown className="mt-0.5 h-4 w-4 text-amber-500" />
                  Better date plans in less time with premium AI improvements and smarter venue matches.
                </li>
                <li className="flex items-start gap-3">
                  <CreditCard className="mt-0.5 h-4 w-4 text-cyan-600" />
                  Trusted Stripe checkout, invoices, and payment management.
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
                  3-day trial on every plan, then cancel anytime from billing settings.
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
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{isGrandfathered ? "Premium access included" : "Choose your plan"}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {isGrandfathered
                    ? "Your account is grandfathered into premium access. You do not need to subscribe unless you choose to."
                    : "Start with a 3-day trial, then keep monthly flexibility or lock in the lower yearly rate."}
                </p>
              </div>
            </div>

            {!loading && !user && (
              <div className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                Pick a plan to continue. You will sign in first, then go straight to checkout for your selected plan.
              </div>
            )}

            {isGrandfathered ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Grandfathered accounts already have premium features. You can still use billing tools on the right to view status and manage payment settings if needed.
              </div>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {(["monthly", "yearly"] as PlanInterval[]).map((plan) => {
                  const details = PLAN_DETAILS[plan]
                  return (
                    <button
                      key={plan}
                      onClick={() => handlePlanSelection(plan)}
                      disabled={loading || isBusy || isPlanModalOpen || (hasPremiumAccess && hasSubscription)}
                      className={`group relative overflow-hidden rounded-[24px] border p-5 text-left transition-all duration-300 ease-out will-change-transform disabled:cursor-not-allowed disabled:opacity-55 ${
                        plan === "yearly"
                          ? `border-amber-300 bg-[linear-gradient(180deg,rgba(255,251,235,1)_0%,rgba(255,255,255,1)_70%)] shadow-[0_16px_40px_-28px_rgba(217,119,6,0.45)] hover:-translate-y-1 hover:border-amber-500 hover:shadow-[0_24px_60px_-32px_rgba(217,119,6,0.65)] ${selectedPlanForCheckout === plan ? "ring-2 ring-amber-400" : ""}`
                          : `border-slate-200 bg-slate-50/70 hover:-translate-y-1 hover:border-slate-400 hover:bg-white hover:shadow-[0_24px_60px_-36px_rgba(15,23,42,0.45)] ${selectedPlanForCheckout === plan ? "ring-2 ring-slate-400" : ""}`
                      }`}
                    >
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.6),transparent_45%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
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
                        <div className="rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-right shadow-sm transition-transform duration-300 group-hover:scale-[1.03]">
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

                      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-slate-800">
                        {(hasPremiumAccess && hasSubscription)
                          ? "Already subscribed"
                          : !user
                          ? `Choose ${plan} plan`
                          : `Start ${plan} plan`}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
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

                {!hasSubscription && !loading && user && (
                  <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
                    Cancellation becomes available after a Stripe subscription starts.
                  </p>
                )}
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
                  <span className="font-semibold text-slate-900">{formatBillingDateFromState(billingStatus?.billing.trialEnd, billingStatus?.billing, billingStatus?.allowed)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span>Current period end</span>
                  <span className="font-semibold text-slate-900">{formatBillingDateFromState(billingStatus?.billing.currentPeriodEnd, billingStatus?.billing, billingStatus?.allowed)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span>Next charge in</span>
                  <span className="font-semibold text-slate-900">{formatNextChargeCountdown(billingStatus?.billing, billingStatus?.allowed)}</span>
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

      {selectedPlanForCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/70 bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-950">Before checkout</h3>
            <p className="mt-2 text-sm text-slate-600">
              You selected <span className="font-semibold text-slate-900">{PLAN_DETAILS[selectedPlanForCheckout].name}</span>.
              Here is what you get before you continue to Stripe.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> 3-day free trial before billing starts</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Unlimited premium AI plan upgrades and smarter venue recommendations</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Saved favorites and full Stripe self-serve billing portal</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Cancel anytime in billing settings</li>
            </ul>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                onClick={() => setSelectedPlanForCheckout(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Not now
              </button>
              <button
                onClick={handleConfirmCheckout}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Continue to checkout
              </button>
            </div>
          </div>
        </div>
      )}
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
