"use client"

import { useRef } from "react"
import Image from "next/image"
import { useInView } from "@/hooks/use-in-view"

interface SplitImageSceneProps {
  scrollY: number
}

const features = [
  {
    title: "Discover Venues",
    description: "Find amazing restaurants, romantic spots, and unique venues in your area. Curated recommendations for perfect date nights.",
    stat: "1K+",
    statLabel: "Date spots"
  },
  {
    title: "Easy Planning",
    description: "Save your favorite places, plan multiple dates, and organize your romantic calendar. Everything in one place.",
    stat: "4.9",
    statLabel: "User rating"
  },
  {
    title: "Personalized Ideas",
    description: "Get tailored suggestions based on your preferences and interests. New date ideas that match your style.",
    stat: "50+",
    statLabel: "Activity types"
  }
]

export function SplitImageScene({ scrollY }: SplitImageSceneProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { threshold: 0.2 })

  return (
    <section 
      ref={sectionRef}
      className="relative py-16 px-4"
    >
      {/* Section number */}
      <span className="absolute right-6 md:right-12 top-32 font-serif text-[20vw] text-muted/10 leading-none select-none">
        03
      </span>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-24 md:mb-32">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-px bg-primary" />
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">How It Works</span>
          </div>
          <h2 
            className={`font-serif text-4xl md:text-6xl lg:text-7xl max-w-4xl transition-all duration-1000 ${
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
            }`}
          >
            Discovery meets <span className="text-outline">romance</span>
          </h2>
        </div>

        {/* Split layout */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          {/* Left: Sticky image */}
          <div className="lg:sticky lg:top-32">
            <div 
              className={`relative aspect-4/5 overflow-hidden transition-all duration-1000 delay-300 ${
                isInView ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              <Image
                src="/images/couple-main.jpg"
                alt="Couple enjoying a date"
                fill
                className="object-cover"
                style={{
                  transform: `translateY(${(scrollY - 2000) * 0.02}px)`
                }}
              />
              {/* Overlay accent */}
              <div className="absolute bottom-0 left-0 w-1/2 h-1/3 bg-primary/20" />
            </div>
          </div>

          {/* Right: Features list */}
          <div className="space-y-16 md:space-y-24 lg:pt-32">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className={`group transition-all duration-700 ${
                  isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                }`}
                style={{ transitionDelay: `${0.4 + index * 0.2}s` }}
              >
                <div className="flex items-start gap-8">
                  {/* Number */}
                  <span className="font-serif text-5xl md:text-7xl text-muted/30 group-hover:text-primary/50 transition-colors duration-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  
                  {/* Content */}
                  <div className="pt-2">
                    <h3 className="font-serif text-2xl md:text-3xl mb-4">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed mb-6 max-w-md">
                      {feature.description}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif text-4xl text-primary">{feature.stat}</span>
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{feature.statLabel}</span>
                    </div>
                  </div>
                </div>
                
                {/* Divider */}
                {index < features.length - 1 && (
                  <div className="mt-16 md:mt-24 h-px bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
