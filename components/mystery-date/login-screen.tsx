"use client"

import { useState } from "react"
import { Sparkles, Heart, Wine, MapPin } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function LoginScreen() {
  const { signInWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await signInWithGoogle()
    } catch (err: any) {
      console.error("Sign-in failed:", err)
      setError("Sign-in failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-svh bg-background px-6 relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-accent/15 rounded-full blur-[80px] animate-pulse [animation-delay:1s]" />
        <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-primary/10 rounded-full blur-[60px] animate-pulse [animation-delay:2s]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-4">
          {/* Animated icon cluster */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-linear-to-br from-primary/30 to-accent/30 animate-pulse" />
            <div className="absolute inset-1 rounded-full bg-background/80 backdrop-blur-sm" />
            <Heart className="relative w-10 h-10 text-primary fill-primary/30" />
            
            {/* Orbiting icons */}
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shadow-lg shadow-primary/20">
              <Wine className="w-4 h-4 text-primary" />
            </div>
            <div className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shadow-lg shadow-accent/20">
              <MapPin className="w-4 h-4 text-accent" />
            </div>
            <div className="absolute -bottom-2 right-0 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight bg-linear-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Date Night
            </h1>
            <p className="text-muted-foreground text-center text-sm leading-relaxed max-w-[260px]">
              Plan the perfect evening with curated venues, smart suggestions, and a touch of mystery
            </p>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="flex gap-6 text-center">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Local Spots</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <span className="text-xs text-muted-foreground">Smart Plans</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground">Save Faves</span>
          </div>
        </div>

        {/* Sign in section */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-card/80 transition-all duration-300 shadow-lg shadow-primary/5 hover:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
              {isLoading ? "Signing in..." : "Continue with Google"}
            </span>
          </button>

          {error && (
            <p className="text-xs text-destructive text-center animate-in fade-in">
              {error}
            </p>
          )}
        </div>

        {/* Terms */}
        <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed max-w-[280px]">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}
