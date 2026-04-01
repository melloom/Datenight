"use client"

import { useState } from "react"
import { Sparkles, MapPin, Wine, ArrowLeft } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useLegal } from "@/lib/legal-context"
import { Checkbox } from "@/components/ui/checkbox"

export function LoginScreen() {
  const { signInWithGoogle } = useAuth()
  const {
    hasScrolledTerms,
    hasScrolledPrivacy,
    hasAcceptedLegal,
    legalAcceptanceLoading,
    acceptLegalDocuments,
  } = useLegal()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [agree, setAgree] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const requiresLegalAcceptance = !hasAcceptedLegal
  const canAgree = hasAcceptedLegal || (hasScrolledTerms && hasScrolledPrivacy)

  const handleGoogleSignIn = async () => {
    if (requiresLegalAcceptance && !agree) {
      setError("Please agree to the Terms of Service and Privacy Policy.")
      return
    }
    if (requiresLegalAcceptance && !canAgree) {
      setError("Please read both the Terms of Service and Privacy Policy completely before agreeing.")
      return
    }
    try {
      setIsLoading(true)
      setError(null)

      if (requiresLegalAcceptance) {
        await acceptLegalDocuments()
      }

      const didSignIn = await signInWithGoogle()
      if (didSignIn) {
        router.replace("/")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      console.error("Google sign-in error:", err)
      setError(`Sign-in failed: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckboxChange = (checked: boolean) => {
    if (checked && !canAgree) {
      setError("Please read both documents completely before agreeing.")
      return
    }
    setAgree(checked)
    if (checked) {
      setError(null)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-svh bg-background px-6 relative overflow-hidden">
      {/* Back button */}
      <Link
        href="/landing"
        className="absolute flex items-center gap-2 px-3 py-2 rounded-lg bg-card/50 hover:bg-card/80 border border-border/50 hover:border-border transition-all duration-200 text-sm text-muted-foreground hover:text-foreground z-20"
        style={{
          top: "max(env(safe-area-inset-top, 0px), 1rem)",
          left: "max(env(safe-area-inset-left, 0px), 1rem)",
        }}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </Link>

      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-primary/8 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 left-1/3 w-56 h-56 bg-accent/6 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center">
              <Image src="/android-chrome-192x192.png" alt="Date Night" width={80} height={80} priority />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
              <Wine className="w-3 h-3 text-primary" />
            </div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
              <Sparkles className="w-3 h-3 text-accent" />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground mb-1">Date Night</h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[240px]">
              Curated venues, smart plans, and a touch of mystery
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="flex gap-8 text-center">
          {[
            { icon: MapPin, label: "Local Spots" },
            { icon: Sparkles, label: "AI Plans" },
            { icon: Sparkles, label: "Save Faves" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-xl bg-primary/8 border border-primary/15 flex items-center justify-center">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
            </div>
          ))}
        </div>

        {/* Sign in */}
        <div className="w-full space-y-4">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading || legalAcceptanceLoading || (!hasAcceptedLegal && !canAgree)}
            className="group relative w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:shadow-sm"
          >
            {/* Google Icon */}
            <div className="absolute left-4 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>

            {/* Button Text */}
            <span className="text-base font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              {isLoading ? "Signing in..." : "Continue with Google"}
            </span>

            {/* Loading spinner */}
            {isLoading && (
              <div className="absolute right-4">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
            )}
          </button>

          {!hasAcceptedLegal && (
            <p className="text-[10px] text-muted-foreground/50 text-center px-4">
              By continuing, you agree to our Terms &amp; Privacy Policy
            </p>
          )}

          {error && (
            <p className="text-xs text-destructive text-center bg-destructive/10 rounded-lg py-2 px-3">{error}</p>
          )}
        </div>

        {!hasAcceptedLegal && (
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agree}
                onCheckedChange={handleCheckboxChange}
                disabled={!canAgree}
                className="mt-0.5 h-5 w-5 min-h-5 min-w-5 aspect-square rounded-full data-[state=checked]:rounded-full"
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I agree to the <Link href="/legal/terms-of-service" className="underline">Terms of Service</Link> and <Link href="/legal/privacy-policy" className="underline">Privacy Policy</Link>.
              </label>
            </div>

            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${hasScrolledTerms ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Terms of Service {hasScrolledTerms ? '✓ Read' : 'Please read'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${hasScrolledPrivacy ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span>Privacy Policy {hasScrolledPrivacy ? '✓ Read' : 'Please read'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
