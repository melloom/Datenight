"use client"

import { useEffect, useState } from "react"
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react"
import { useTutorial } from "@/lib/tutorial-context"
import { cn } from "@/lib/utils"

export function TutorialOverlay() {
  const { isActive, currentStep, steps, nextStep, prevStep, skipTutorial, completeTutorial } = useTutorial()
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null)
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null)

  const step = steps[currentStep]

  useEffect(() => {
    if (!isActive || !step.target) {
      setHighlightedElement(null)
      setHighlightRect(null)
      return
    }

    const element = document.querySelector(step.target)
    if (element) {
      setHighlightedElement(element)
      const rect = element.getBoundingClientRect()
      setHighlightRect(rect)
      
      // Scroll element into view if needed
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else {
      setHighlightedElement(null)
      setHighlightRect(null)
    }
  }, [isActive, step])

  if (!isActive) return null

  const getPositionClasses = () => {
    if (!step.position || step.position === 'center') {
      return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md"
    }
    
    if (step.position === 'top' && highlightRect) {
      return `left-1/2 -translate-x-1/2 max-w-md`
    }
    
    if (step.position === 'bottom' && highlightRect) {
      return `left-1/2 -translate-x-1/2 max-w-md`
    }
    
    return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-md"
  }

  const getOverlayPosition = () => {
    if (!highlightRect || !step.target) return { top: '50%', left: '50%' }
    
    const padding = 16
    if (step.position === 'top') {
      return {
        top: `${highlightRect.top - padding}px`,
        left: '50%'
      }
    }
    
    if (step.position === 'bottom') {
      return {
        top: `${highlightRect.bottom + padding}px`,
        left: '50%'
      }
    }
    
    return { top: '50%', left: '50%' }
  }

  const overlayPosition = getOverlayPosition()

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60 pointer-events-auto" />
      
      {/* Highlight spotlight */}
      {highlightedElement && highlightRect && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: `${highlightRect.top - 8}px`,
            left: `${highlightRect.left - 8}px`,
            width: `${highlightRect.width + 16}px`,
            height: `${highlightRect.height + 16}px`,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
            borderRadius: '12px',
            border: '2px solid rgb(168 85 247)',
          }}
        />
      )}

      {/* Tutorial card */}
      <div
        className={cn(
          "absolute bg-card border border-primary/30 rounded-2xl shadow-2xl shadow-primary/20 p-6 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300",
          getPositionClasses()
        )}
        style={{
          ...(step.position === 'top' && highlightRect && {
            top: `${overlayPosition.top as string}`,
            transform: 'translateX(-50%) translateY(-100%) translateY(-16px)'
          }),
          ...(step.position === 'bottom' && highlightRect && {
            top: `${overlayPosition.top as string}`,
            transform: 'translateX(-50%) translateY(16px)'
          })
        }}
      >
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-primary">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <button
            onClick={skipTutorial}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip Tutorial
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-muted rounded-full mb-4 overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-foreground">
            {step.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.content}
          </p>
          {step.action && (
            <p className="text-xs text-primary font-medium flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              {step.action}
            </p>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 gap-3">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
              currentStep === 0
                ? "text-muted-foreground cursor-not-allowed"
                : "text-foreground hover:bg-accent"
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  index === currentStep
                    ? "bg-primary w-6"
                    : "bg-muted"
                )}
              />
            ))}
          </div>

          <button
            onClick={nextStep}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {currentStep === steps.length - 1 ? "Get Started!" : "Next"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Close button for non-first-time users */}
      {!step.target && (
        <button
          onClick={skipTutorial}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors pointer-events-auto"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
