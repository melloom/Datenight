"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

interface HeroSceneProps {
  scrollY: number
}

export function HeroScene({ scrollY }: HeroSceneProps) {
  const [mounted] = useState(true)
  const { user } = useAuth()

  const opacity = Math.max(0, 1 - scrollY / 600)
  const scale = 1 + scrollY / 2000
  const translateY = scrollY * 0.5

  return (
    <section className="relative h-[200vh] overflow-hidden">
      {/* Background grain */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Floating orbs */}
      <div
        className="fixed top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] animate-pulse-glow pointer-events-none"
        style={{
          opacity: opacity * 0.6,
          transform: `translate(${scrollY * 0.1}px, ${scrollY * -0.05}px)`
        }}
      />
      <div
        className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/10 blur-[120px] animate-pulse-glow pointer-events-none"
        style={{
          opacity: opacity * 0.4,
          transform: `translate(${scrollY * -0.08}px, ${scrollY * 0.03}px)`,
          animationDelay: "2s"
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-60 p-4 md:p-6 bg-background/80 backdrop-blur-sm" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="text-xl md:text-2xl font-bold text-foreground">
            Dat3Night
          </div>
          <div className="flex items-center gap-1.5 md:gap-3">
            <Link href="/plans" className="shrink-0 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium whitespace-nowrap transition-colors hover:bg-background/80 md:px-6 md:py-2 md:text-sm">
              Pricing
            </Link>
            {user ? (
              <Link href="/app" className="shrink-0 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium whitespace-nowrap transition-colors hover:bg-background/80 md:px-6 md:py-2 md:text-sm">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="shrink-0 rounded-full border border-border px-3 py-1.5 text-[11px] font-medium whitespace-nowrap transition-colors hover:bg-background/80 md:px-6 md:py-2 md:text-sm">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div
        className="fixed inset-0 flex flex-col items-center justify-center px-4"
        style={{
          opacity,
          transform: `translateY(${translateY}px) scale(${scale})`,
          paddingTop: 'calc(4rem + env(safe-area-inset-top))'
        }}
      >
        {/* Eyebrow */}
        <div
          className={`mb-8 overflow-hidden ${mounted ? "animate-reveal-up" : "opacity-0"}`}
          style={{ animationDelay: "0.2s" }}
        >
          <span className="block text-xs uppercase tracking-[0.4em] text-muted-foreground">
            Real Couples, Real Stories
          </span>
        </div>

        {/* Main headline */}
        <h1 className="relative text-center">
          <span
            className={`block font-serif text-[15vw] md:text-[12vw] leading-[0.85] tracking-tight ${mounted ? "animate-text-slide" : "opacity-0"}`}
            style={{ animationDelay: "0.4s" }}
          >
            Love
          </span>
          <span
            className={`block font-serif text-[15vw] md:text-[12vw] leading-[0.85] tracking-tight text-outline ${mounted ? "animate-text-slide" : "opacity-0"}`}
            style={{ animationDelay: "0.6s" }}
          >
            Stories
          </span>
          <span
            className={`block font-serif text-[15vw] md:text-[12vw] leading-[0.85] tracking-tight ${mounted ? "animate-text-slide" : "opacity-0"}`}
            style={{ animationDelay: "0.8s" }}
          >
            Shared <span className="text-primary">Here</span>
          </span>
        </h1>

        {/* Subtitle */}
        <p
          className={`mt-12 max-w-md text-center text-muted-foreground text-lg leading-relaxed ${mounted ? "animate-reveal-up" : "opacity-0"}`}
          style={{ animationDelay: "1s" }}
        >
          Discover amazing date spots and plan perfect nights out. Find romantic restaurants, fun activities, and unique venues tailored for you.
        </p>

        {/* CTA */}
        {user && (
          <div
            className={`mt-12 ${mounted ? "animate-reveal-up" : "opacity-0"}`}
            style={{ animationDelay: "1.2s" }}
          >
            <Link href="/app">
              <button className="group relative px-12 py-4 bg-primary text-primary-foreground font-medium uppercase tracking-[0.2em] text-sm overflow-hidden">
                <span className="relative z-10">Go to Dashboard</span>
                <div className="absolute inset-0 bg-foreground transform translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <span className="absolute inset-0 flex items-center justify-center text-background transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 delay-100">
                  Go to Dashboard
                </span>
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Scroll hint */}
      <div
        className="absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
        style={{ opacity: Math.max(0, 1 - scrollY / 200) }}
      >
        <div className="w-6 h-10 border border-muted-foreground/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  )
}
