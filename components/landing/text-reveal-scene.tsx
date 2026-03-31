"use client"

import { useRef } from "react"
import { useInView } from "@/hooks/use-in-view"

export function TextRevealScene() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { threshold: 0.3 })

  const words = ["Find", "amazing", "date", "ideas."]

  return (
    <section 
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center py-32 px-4"
    >
      {/* Background accent line */}
      <div className="absolute left-0 top-1/2 w-full h-px bg-border" />
      
      <div className="relative max-w-6xl mx-auto">
        {/* Large decorative number */}
        <span className="absolute -left-8 md:-left-24 top-0 font-serif text-[20vw] text-muted/20 leading-none select-none">
          01
        </span>

        {/* Text reveal */}
        <h2 className="relative z-10 font-serif text-4xl md:text-6xl lg:text-8xl leading-[1.1] tracking-tight">
          {words.map((word, index) => (
            <span
              key={index}
              className={`inline-block mr-[0.3em] transition-all duration-700 ${
                isInView 
                  ? "opacity-100 translate-y-0 blur-0" 
                  : "opacity-0 translate-y-12 blur-sm"
              }`}
              style={{ transitionDelay: `${index * 0.1}s` }}
            >
              {word === "magic." ? (
                <span className="text-primary">{word}</span>
              ) : (
                word
              )}
            </span>
          ))}
        </h2>

        {/* Supporting text */}
        <div 
          className={`mt-16 md:mt-24 grid md:grid-cols-2 gap-8 transition-all duration-1000 delay-700 ${
            isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">The Problem</span>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Finding the perfect date spot is hard. You waste time searching, 
              end up at the same places, and the excitement fades.
            </p>
          </div>
          <div className="space-y-4">
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Our Answer</span>
            <p className="text-lg text-foreground leading-relaxed">
              Discover amazing restaurants, activities, and venues tailored for you. 
              Plan perfect date nights with ease. Every. Single. Time.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
