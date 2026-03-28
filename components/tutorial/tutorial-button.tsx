"use client"

import { Sparkles } from "lucide-react"
import { useTutorial } from "@/lib/tutorial-context"

export function TutorialButton() {
  const { startTutorial, isActive } = useTutorial()

  if (isActive) return null

  return (
    <button
      onClick={startTutorial}
      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all text-xs font-medium text-muted-foreground hover:text-foreground"
    >
      <Sparkles className="w-4 h-4" />
      Show Tutorial
    </button>
  )
}
