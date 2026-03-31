"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import Image from "next/image"

const experiences = [
  {
    id: 1,
    title: "The Olive Branch",
    category: "Italian Restaurant",
    image: "/images/experience-1.jpg",
    description: "Cozy trattoria with handmade pasta and wine pairings"
  },
  {
    id: 2,
    title: "Blue Note Jazz",
    category: "Live Music Venue",
    image: "/images/experience-2.jpg",
    description: "Intimate jazz club with craft cocktails and soulful performances"
  },
  {
    id: 3,
    title: "Sunset Kayaking",
    category: "Outdoor Activity",
    image: "/images/experience-3.jpg",
    description: "Paddle through calm waters as the sun sets over the horizon"
  },
  {
    id: 4,
    title: "Art Gallery Walk",
    category: "Cultural Experience",
    image: "/images/experience-4.jpg",
    description: "Explore local galleries and discover emerging artists together"
  },
  {
    id: 5,
    title: "Brewery Tour",
    category: "Food & Drink",
    image: "/images/experience-5.jpg",
    description: "Sample craft beers and learn about local brewing traditions"
  },
  {
    id: 6,
    title: "Rooftop Cinema",
    category: "Entertainment",
    image: "/images/experience-6.jpg",
    description: "Classic movies under the stars with skyline views"
  },
  {
    id: 7,
    title: "Farmers Market",
    category: "Weekend Activity",
    image: "/images/experience-7.jpg",
    description: "Browse local produce and enjoy fresh street food together"
  },
  {
    id: 8,
    title: "Beach Bonfire",
    category: "Outdoor Experience",
    image: "/images/experience-8.jpg",
    description: "Cozy fireside evening with waves and starry skies"
  },
  {
    id: 9,
    title: "Comedy Club",
    category: "Nightlife",
    image: "/images/experience-9.jpg",
    description: "Laugh together at stand-up shows and open mic nights"
  },
  {
    id: 10,
    title: "Couples Cooking",
    category: "Interactive Class",
    image: "/images/experience-10.jpg",
    description: "Learn to make sushi or pasta in a hands-on cooking class"
  }
]

export function HorizontalScrollScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const animatedX = useRef(0)
  const targetX = useRef(0)
  const rafId = useRef<number>(0)
  const [displayX, setDisplayX] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  // Smooth animation loop using requestAnimationFrame
  const animate = useCallback(() => {
    const step = () => {
      const ease = 0.08
      animatedX.current += (targetX.current - animatedX.current) * ease

      // Only update state if the value changed meaningfully
      if (Math.abs(animatedX.current - targetX.current) > 0.5) {
        setDisplayX(animatedX.current)
        rafId.current = requestAnimationFrame(step)
      } else {
        animatedX.current = targetX.current
        setDisplayX(targetX.current)
      }
    }

    step()
  }, [])

  const update = useCallback(() => {
    if (!sectionRef.current || !containerRef.current) return

    const rect = sectionRef.current.getBoundingClientRect()
    const sectionHeight = sectionRef.current.offsetHeight - window.innerHeight
    const scrolled = Math.max(0, -rect.top)
    const scrollProgress = Math.min(1, scrolled / sectionHeight)
    setProgress(scrollProgress)

    // Continuous progress mapped to total scrollable width
    const children = containerRef.current.children
    if (children.length === 0) return

    const lastChild = children[children.length - 1] as HTMLElement
    const firstChild = children[0] as HTMLElement
    const viewportWidth = window.innerWidth

    // Total scrollable distance: from first card centered to last card centered
    const firstCenter = firstChild.offsetLeft + firstChild.offsetWidth / 2
    const lastCenter = lastChild.offsetLeft + lastChild.offsetWidth / 2
    const totalTravel = lastCenter - firstCenter

    // Smooth continuous offset based on scroll progress
    const currentCenter = firstCenter + totalTravel * scrollProgress
    const offset = -(currentCenter - viewportWidth / 2)

    targetX.current = offset

    // Figure out which step we're closest to for the indicator
    let closestStep = 0
    let closestDist = Infinity
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement
      const childCenter = child.offsetLeft + child.offsetWidth / 2
      const dist = Math.abs(childCenter - currentCenter)
      if (dist < closestDist) {
        closestDist = dist
        closestStep = i
      }
    }
    setCurrentStep(closestStep)

    // Kick off the animation loop
    cancelAnimationFrame(rafId.current)
    rafId.current = requestAnimationFrame(animate)
  }, [animate])

  useEffect(() => {
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update, { passive: true })
    // Wait a frame for DOM to be ready
    requestAnimationFrame(update)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
      cancelAnimationFrame(rafId.current)
    }
  }, [update])

  return (
    <section
      ref={sectionRef}
      className="relative h-[300vh] md:h-[600vh]"
    >
      <div className="sticky top-0 min-h-screen flex flex-col justify-center overflow-hidden">
        {/* Section header */}
        <div className="px-4 md:px-12 mb-4 md:mb-6 shrink-0">
          <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">02</span>
            <div className="w-10 md:w-16 h-px bg-border" />
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Experiences</span>
          </div>
          <h2 className="font-serif text-xl md:text-4xl lg:text-5xl leading-tight">
            Every date, a <span className="text-primary">masterpiece</span>
          </h2>
        </div>

        {/* Horizontal scroll container */}
        <div
          ref={containerRef}
          className="flex py-4 md:py-6 items-center shrink-0"
          style={{
            gap: "4vw",
            paddingLeft: "7vw",
            paddingRight: "7vw",
            transform: `translate3d(${displayX}px, 0, 0)`,
            willChange: "transform",
          }}
        >
          {experiences.map((exp, index) => {
            return (
              <div
                key={exp.id}
                className="shrink-0 group"
                style={{ width: "min(85vw, 900px)" }}
              >
                <div className="relative aspect-video overflow-hidden bg-muted rounded-2xl shadow-lg">
                  <Image
                    src={exp.image}
                    alt={exp.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8">
                    <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] text-primary mb-1 md:mb-2 block">
                      {exp.category}
                    </span>
                    <h3 className="font-serif text-lg md:text-4xl mb-1 md:mb-2 text-white">{exp.title}</h3>
                    <p className="text-white/70 text-xs md:text-base max-w-xs">
                      {exp.description}
                    </p>
                  </div>

                  {/* Index */}
                  <span className="absolute top-3 right-3 md:top-6 md:right-6 font-serif text-4xl md:text-8xl text-white/10">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Progress indicator */}
        <div className="px-4 md:px-12 mt-4 md:mt-6 flex items-center gap-3 md:gap-4 shrink-0 pb-4">
          {/* Continuous progress bar */}
          <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{
                width: `${progress * 100}%`,
                transition: "width 0.1s linear"
              }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {String(currentStep + 1).padStart(2, "0")} / {String(experiences.length).padStart(2, "0")}
          </span>
        </div>
      </div>
    </section>
  )
}
