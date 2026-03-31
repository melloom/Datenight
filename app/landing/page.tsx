"use client"

import { useEffect, useRef, useState } from "react"
import { ScrollProgress } from "@/components/landing/scroll-progress"
import { HeroScene } from "@/components/landing/hero-scene"
import { TextRevealScene } from "@/components/landing/text-reveal-scene"
import { HorizontalScrollScene } from "@/components/landing/horizontal-scroll-scene"
import { SplitImageScene } from "@/components/landing/split-image-scene"
import { TestimonialScene } from "@/components/landing/testimonial-scene"
import { FinalScene } from "@/components/landing/final-scene"

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div ref={containerRef} className="bg-background min-h-screen">
      <ScrollProgress />
      
      {/* Scene 1: Hero with massive typography */}
      <HeroScene scrollY={scrollY} />
      
      {/* Scene 2: Text reveal on scroll */}
      <TextRevealScene />
      
      {/* Scene 3: Horizontal scroll gallery */}
      <HorizontalScrollScene />
      
      {/* Scene 4: Split image with parallax */}
      <SplitImageScene scrollY={scrollY} />
      
      {/* Scene 5: Testimonials carousel */}
      <TestimonialScene />
      
      {/* Scene 6: Final CTA */}
      <FinalScene />
    </div>
  )
}
