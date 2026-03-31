"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Sparkles, Star, Users } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/30 via-background to-background" />
      <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute top-40 right-1/4 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

      <div className="container relative mx-auto max-w-6xl px-4 py-20 md:py-32">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 gap-1.5 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Powered Date Planning</span>
          </Badge>

          {/* Headline */}
          <h1 className="max-w-4xl text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Transform Your{" "}
            <span className="text-primary">Date Nights</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            Stop wondering what to do. Let AI craft perfect date experiences with curated venues, smart timing, and personalized recommendations.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 px-8">
              Start Planning Perfect Dates
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="px-8">
              See How It Works
            </Button>
          </div>

          {/* Social Proof */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-background bg-gradient-to-br from-primary/60 to-accent"
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">10,000+ couples</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <span className="text-sm font-medium text-muted-foreground">4.9/5 rating</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
