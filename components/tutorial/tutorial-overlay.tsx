"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { X, ArrowRight, ArrowLeft } from "lucide-react"
import { useTutorial } from "@/lib/tutorial-context"
import { cn } from "@/lib/utils"

const PAD = 10
const TOOLTIP_GAP = 14

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

type Placement = "top" | "bottom"

export function TutorialOverlay() {
  const { isActive, currentStep, steps, nextStep, prevStep, skipTutorial } =
    useTutorial()
  const [rect, setRect] = useState<Rect | null>(null)
  const [animating, setAnimating] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [placement, setPlacement] = useState<Placement>("bottom")
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  })
  const prevStepRef = useRef(currentStep)

  const step = steps[currentStep]

  // ── Measure target element ──────────────────────────────────────────
  const measure = useCallback(() => {
    if (!step?.target) {
      setRect(null)
      return
    }
    const el = document.querySelector(step.target)
    if (!el) {
      setRect(null)
      return
    }
    const r = el.getBoundingClientRect()
    setRect({
      top: r.top + window.scrollY,
      left: r.left + window.scrollX,
      width: r.width,
      height: r.height,
    })
  }, [step])

  // Scroll target into view, then measure
  useEffect(() => {
    if (!isActive) return

    // trigger a small fade between steps
    if (prevStepRef.current !== currentStep) {
      setAnimating(true)
      const id = setTimeout(() => setAnimating(false), 200)
      prevStepRef.current = currentStep
      return () => clearTimeout(id)
    }

    if (!step?.target) {
      setRect(null)
      return
    }

    const el = document.querySelector(step.target)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      // measure after scroll settles
      const id = setTimeout(measure, 350)
      return () => clearTimeout(id)
    } else {
      setRect(null)
    }
  }, [isActive, currentStep, step, measure])

  // Re-measure on resize
  useEffect(() => {
    if (!isActive) return
    const handler = () => measure()
    window.addEventListener("resize", handler)
    return () => {
      window.removeEventListener("resize", handler)
    }
  }, [isActive, measure])

  // ── Position tooltip relative to spotlight ──────────────────────────
  useEffect(() => {
    if (!isActive) return
    const tt = tooltipRef.current
    if (!tt) return

    // Centre if no target
    if (!rect) {
      setPlacement("bottom")
      setTooltipPos({
        top: window.innerHeight / 2 - tt.offsetHeight / 2,
        left: window.innerWidth / 2 - tt.offsetWidth / 2,
      })
      return
    }

    const scrollY = window.scrollY
    const viewTop = rect.top - scrollY
    const viewBottom = viewTop + rect.height
    const spaceBelow = window.innerHeight - viewBottom
    const spaceAbove = viewTop

    let p: Placement = "bottom"
    if (spaceBelow < tt.offsetHeight + TOOLTIP_GAP + 30 && spaceAbove > spaceBelow) {
      p = "top"
    }
    setPlacement(p)

    let top: number
    if (p === "bottom") {
      top = rect.top + rect.height + PAD + TOOLTIP_GAP
    } else {
      top = rect.top - PAD - TOOLTIP_GAP - tt.offsetHeight
    }

    // Horizontal: centre on target, clamp to viewport
    let left = rect.left + rect.width / 2 - tt.offsetWidth / 2
    left = Math.max(12, Math.min(left, window.innerWidth - tt.offsetWidth - 12))

    setTooltipPos({ top: top - scrollY, left })
  }, [rect, isActive, currentStep, animating])

  // ── Keyboard navigation ─────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") nextStep()
      if (e.key === "ArrowLeft") prevStep()
      if (e.key === "Escape") skipTutorial()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isActive, nextStep, prevStep, skipTutorial])

  if (!isActive) return null

  // Spotlight cutout coords (viewport-relative)
  const scrollY = typeof window !== "undefined" ? window.scrollY : 0
  const cutout = rect
    ? {
        x: rect.left - PAD,
        y: rect.top - scrollY - PAD,
        w: rect.width + PAD * 2,
        h: rect.height + PAD * 2,
        rx: 14,
      }
    : null

  // Arrow position on tooltip
  const arrowLeft = rect
    ? Math.min(
        Math.max(
          rect.left + rect.width / 2 - tooltipPos.left,
          24
        ),
        (tooltipRef.current?.offsetWidth ?? 320) - 24
      )
    : (tooltipRef.current?.offsetWidth ?? 320) / 2

  return (
    <div className="fixed inset-0 z-100" style={{ pointerEvents: "none" }}>
      {/* ── Box-shadow overlay with spotlight cutout ── */}
      {cutout ? (
        <div
          className="absolute rounded-[14px] border-2 border-primary/40 pointer-events-none"
          style={{
            top: cutout.y,
            left: cutout.x,
            width: cutout.w,
            height: cutout.h,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
            transition: "all 0.35s cubic-bezier(.4,0,.2,1)",
          }}
        />
      ) : (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "rgba(0,0,0,0.6)" }}
        />
      )}

      {/* Backdrop click catcher */}
      <div
        className="absolute inset-0"
        style={{ pointerEvents: "auto" }}
        onClick={(e) => {
          if (cutout) {
            const cx = e.clientX
            const cy = e.clientY
            if (
              cx >= cutout.x &&
              cx <= cutout.x + cutout.w &&
              cy >= cutout.y &&
              cy <= cutout.y + cutout.h
            ) {
              return
            }
          }
          e.stopPropagation()
        }}
      />

      {/* ── Tooltip card ── */}
      <div
        ref={tooltipRef}
        className={cn(
          "fixed w-[min(360px,calc(100vw-24px))] rounded-2xl border border-primary/25 bg-card/95 backdrop-blur-xl shadow-2xl shadow-primary/15 transition-all duration-300 ease-out",
          animating && "opacity-0 scale-95",
          !animating && "opacity-100 scale-100"
        )}
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          pointerEvents: "auto",
          zIndex: 101,
        }}
      >
        {/* Arrow — rotated square */}
        {rect && (
          <div
            className="absolute w-3 h-3 bg-card/95 border-primary/25"
            style={{
              left: arrowLeft,
              transform: "translateX(-50%) rotate(45deg)",
              ...(placement === "bottom"
                ? {
                    top: -6,
                    borderTop: "1px solid",
                    borderLeft: "1px solid",
                    borderColor: "inherit",
                  }
                : {
                    bottom: -6,
                    borderBottom: "1px solid",
                    borderRight: "1px solid",
                    borderColor: "inherit",
                  }),
            }}
          />
        )}

        <div className="p-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              {currentStep + 1}/{steps.length}
            </span>
            <button
              onClick={skipTutorial}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Close tutorial"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Content */}
          <h3 className="text-base font-bold text-foreground mb-1.5">
            {step.title}
          </h3>
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">
            {step.content}
          </p>

          {/* Navigation */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all min-h-[40px]",
                currentStep === 0
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : "text-foreground hover:bg-accent border border-border"
              )}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>

            {/* Dots */}
            <div className="flex items-center gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  data-compact
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    index === currentStep
                      ? "bg-primary w-5"
                      : index < currentStep
                        ? "bg-primary/40 w-1.5"
                        : "bg-muted w-1.5"
                  )}
                />
              ))}
            </div>

            <button
              onClick={nextStep}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 active:scale-[0.97] transition-all shadow-sm shadow-primary/25 min-h-[40px]"
            >
              {currentStep === steps.length - 1 ? "Done!" : "Next"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
