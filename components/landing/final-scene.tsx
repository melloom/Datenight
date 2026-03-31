"use client"

import { useRef } from "react"
import Link from "next/link"
import { useInView } from "@/hooks/use-in-view"
import { useAuth } from "@/lib/auth-context"

export function FinalScene() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { threshold: 0.3 })
  const { user } = useAuth()

  return (
    <>
    <section
      ref={sectionRef}
      className="relative min-h-[80vh] md:min-h-screen flex flex-col items-center justify-center py-8 md:py-32 px-4 overflow-hidden"
    >
      {/* Background elements */}
      <div className="absolute inset-0">
        {/* Radial gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)] opacity-10" />

        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, var(--foreground) 1px, transparent 1px),
              linear-gradient(to bottom, var(--foreground) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px"
          }}
        />

        {/* Floating accent shapes */}
        <div className="absolute top-1/4 left-[10%] w-64 h-64 rounded-full bg-primary/5 blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-1/3 right-[15%] w-48 h-48 rounded-full bg-accent/5 blur-[80px] animate-pulse-slow" style={{ animationDelay: "1.5s" }} />
      </div>

      {/* Content */}
      <div className="relative max-w-4xl mx-auto text-center">
        {/* Decorative line */}
        <div
          className={`w-px h-16 bg-primary/40 mx-auto mb-10 transition-all duration-1000 ${
            isInView ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0"
          }`}
          style={{ transformOrigin: "top" }}
        />

        {/* Large text */}
        <h2
          className={`font-serif text-3xl md:text-7xl lg:text-9xl leading-[0.9] tracking-tight mb-6 md:mb-8 transition-all duration-1000 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          }`}
        >
          <span className="block sm:inline">Your next</span>
          <span className="text-outline block sm:inline mx-0 sm:mx-2">adventure</span>
          <span className="text-primary block sm:inline">starts now</span>
        </h2>

        {/* Subtext */}
        <p
          className={`text-base md:text-xl text-muted-foreground max-w-lg mx-auto mb-10 md:mb-14 transition-all duration-1000 delay-200 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          Discover amazing date spots, plan unforgettable nights, and create memories that last a lifetime.
          Join thousands of couples who have transformed their date nights with our intelligent recommendations and seamless planning tools.
        </p>

        {/* CTA Buttons */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-14 md:mb-20 transition-all duration-1000 delay-300 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Link href={user ? "/" : "/login"}>
            <button className="group relative px-8 md:px-10 py-3 md:py-4 bg-primary text-primary-foreground font-medium uppercase tracking-[0.15em] text-xs md:text-sm overflow-hidden rounded-full">
              <span className="relative z-10">{user ? "Plan a Date Night" : "Get Started Free"}</span>
              <div className="absolute inset-0 bg-foreground transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-full" />
              <span className="absolute inset-0 flex items-center justify-center text-background transform translate-y-full group-hover:translate-y-0 transition-transform duration-500 delay-75 font-medium uppercase tracking-[0.15em] text-sm">
                {user ? "Plan a Date Night" : "Get Started Free"}
              </span>
            </button>
          </Link>
          <Link href="/learn-more" className="px-6 md:px-8 py-3 md:py-4 border border-border rounded-full text-xs md:text-sm font-medium uppercase tracking-[0.15em] hover:border-primary/50 hover:text-primary transition-colors">
            Learn More
          </Link>
        </div>

        {/* Stats row */}
        <div
          className={`flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 md:gap-20 transition-all duration-1000 delay-500 ${
            isInView ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="text-center">
            <span className="block font-serif text-3xl md:text-5xl text-primary">10K+</span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1 block">Venues</span>
          </div>
          <div className="w-px h-10 bg-border hidden sm:block" />
          <div className="text-center">
            <span className="block font-serif text-3xl md:text-5xl text-primary">4.8</span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1 block">Avg Rating</span>
          </div>
          <div className="w-px h-10 bg-border hidden sm:block" />
          <div className="text-center">
            <span className="block font-serif text-3xl md:text-5xl text-primary">50+</span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1 block">Activity Types</span>
          </div>
        </div>
      </div>

    </section>

      {/* Footer — separate from CTA */}
      <footer className="w-full border-t border-border py-8 md:py-12 px-4 md:px-6 bg-background">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-3 md:gap-4">
          <div className="font-serif text-lg md:text-xl tracking-tight">
            Dat3Night
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-xs md:text-sm text-muted-foreground">
            <a href="/about" className="hover:text-foreground transition-colors">About</a>
            <a href="/legal/privacy-policy" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="/legal/terms-of-service" className="hover:text-foreground transition-colors">Terms</a>
            <a href="/contact" className="hover:text-foreground transition-colors">Contact</a>
          </nav>

          <div className="text-sm text-muted-foreground">
            2026 Dat3Night. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  )
}
