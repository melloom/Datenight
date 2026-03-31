"use client"

import { useState } from "react"
import { Sparkles, MapPin, Wine } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { Checkbox } from "@/components/ui/checkbox"

export function LoginScreen() {
  const { signInWithGoogle } = useAuth()
  const { hasScrolledTerms, hasScrolledPrivacy } = useLegal()
  const [error, setError] = useState<string | null>(null)
  const [agree, setAgree] = useState(false)
  const handleGoogleSignIn = async () => {
    if (!agree) {
      setError("Please agree to the Terms of Service and Privacy Policy.")
      return
    }
    if (!canAgree) {
      setError("Please read both the Terms of Service and Privacy Policy completely before agreeing.")
      return
    }
    try {
      setIsLoading(true)
      setError(null)
      await signInWithGoogle()
    } catch {
      setError("Sign-in failed. Please try again.")
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
        <div className="w-full space-y-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
        <p className="text-[10px] text-muted-foreground/50 text-center">
          By continuing, you agree to our Terms &amp; Privacy Policy
        </p>
            )}
            <span className="text-sm font-medium text-foreground">
              {isLoading ? "Signing in..." : "Continue with Google"}
            </span>
          </button>

          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-start space-x-2">
            <Checkbox 
              id="terms" 
              checked={agree} 
              onCheckedChange={handleCheckboxChange}
              disabled={!canAgree}
            />
            <label
              htmlFor="terms"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to the <Link href="/legal/terms-of-service" className="underline">Terms of Service</Link> and <Link href="/legal/privacy-policy" className="underline">Privacy Policy</Link>.
            </label>
          </div>
          
          {/* Scroll status indicators */}
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
      </div>
    </div>
  )
}
