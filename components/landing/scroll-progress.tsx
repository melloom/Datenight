"use client"

import { useEffect, useState } from "react"

export function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const scrolled = (winScroll / height) * 100
      setProgress(scrolled)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-muted">
        <div 
          className="h-full bg-primary transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      {/* Fixed nav */}
      <nav className="fixed top-6 left-6 right-6 z-40 flex items-center justify-between mix-blend-difference">
        <div className="font-serif text-xl tracking-tight text-foreground">
          date<span className="text-primary">.</span>
        </div>
        <button className="px-6 py-2 border border-foreground/30 text-sm uppercase tracking-[0.2em] text-foreground hover:bg-foreground hover:text-background transition-all duration-300">
          Start
        </button>
      </nav>

      {/* Scroll indicator */}
      <div className="fixed bottom-8 right-8 z-40 flex flex-col items-center gap-2 mix-blend-difference">
        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground rotate-90 origin-center translate-x-6">
          Scroll
        </span>
        <div className="w-[1px] h-16 bg-muted-foreground/30 relative overflow-hidden">
          <div 
            className="absolute top-0 left-0 w-full bg-primary transition-all duration-75"
            style={{ height: `${progress}%` }}
          />
        </div>
      </div>
    </>
  )
}
