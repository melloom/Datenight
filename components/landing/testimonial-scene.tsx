"use client"

import { useRef } from "react"
import { useInView } from "@/hooks/use-in-view"

const testimonials = [
  {
    quote: "Found the perfect romantic restaurant we never would have discovered on our own. Our anniversary was amazing.",
    author: "Sarah & Michael",
    location: "New York",
    years: "Together 8 years"
  },
  {
    quote: "We've tried so many new activities thanks to the suggestions. Date nights are exciting again!",
    author: "Emma & James",
    location: "London",
    years: "Together 3 years"
  },
  {
    quote: "Finally, a way to plan dates that actually fits our budget and interests. Game changer.",
    author: "Aria & Daniel",
    location: "Los Angeles",
    years: "Together 5 years"
  },
  {
    quote: "The venue recommendations are spot on. We've discovered so many hidden gems in our city.",
    author: "Luna & Noah",
    location: "Paris",
    years: "Together 2 years"
  }
]

export function TestimonialScene() {
  const sectionRef = useRef<HTMLElement>(null)
  const isInView = useInView(sectionRef, { threshold: 0.2 })

  return (
    <section 
      ref={sectionRef}
      className="relative py-8 md:py-32 overflow-hidden"
    >
      {/* Background text marquee */}
      <div className="absolute inset-0 flex items-center overflow-hidden opacity-[0.03] pointer-events-none">
        <div className="animate-marquee whitespace-nowrap">
          <span className="font-serif text-[25vw] tracking-tight">
            LOVE • CONNECTION • MAGIC • ROMANCE • ADVENTURE • LOVE • CONNECTION • MAGIC • ROMANCE • ADVENTURE •
          </span>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-24">
          <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground mb-4 block">04 — Voices</span>
          <h2 
            className={`font-serif text-4xl md:text-6xl transition-all duration-1000 ${
              isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            Real stories of <span className="text-primary">amazing</span> dates
          </h2>
        </div>

        {/* Testimonials grid - asymmetric */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.author}
              className={`group p-8 md:p-12 border border-border hover:border-primary/30 transition-all duration-700 ${
                index % 2 === 1 ? "md:mt-24" : ""
              } ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
              style={{ transitionDelay: `${0.2 + index * 0.15}s` }}
            >
              {/* Quote mark */}
              <span className="font-serif text-8xl text-primary/20 leading-none block mb-4">&ldquo;</span>
              
              {/* Quote */}
              <blockquote className="font-serif text-xl md:text-2xl lg:text-3xl leading-relaxed mb-8">
                {testimonial.quote}
              </blockquote>
              
              {/* Author */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </div>
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  {testimonial.years}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
