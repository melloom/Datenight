"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { getPreferences, savePreferences } from "@/lib/db"
import { useAuth } from "@/lib/auth-context"

interface TutorialStep {
  id: string
  title: string
  content: string
  target?: string // CSS selector for highlighting element
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  action?: string // What the user should do
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Date Night! 🌟',
    content: "Let me walk you through how to plan the perfect evening in just a few taps.",
    position: 'center'
  },
  {
    id: 'location',
    title: 'Where to? 📍',
    content: "Enter your city or neighborhood. Tap the pin icon to auto-detect your location.",
    target: '[data-tutorial="location"]',
    position: 'bottom',
    action: 'Type a location or tap the pin button'
  },
  {
    id: 'party-size',
    title: 'Who\'s Coming? 👥',
    content: "Just the two of you, or a double date? Pick your party size.",
    target: '[data-tutorial="party-size"]',
    position: 'bottom',
    action: 'Tap a number'
  },
  {
    id: 'time',
    title: 'Pick a Time 🕐',
    content: "Early bird, prime time, or late night — each gives a different vibe.",
    target: '[data-tutorial="time"]',
    position: 'bottom',
    action: 'Tap a time slot'
  },
  {
    id: 'budget',
    title: 'Set Your Budget �',
    content: "From casual pizza to luxury dining — we'll match venues to what you want to spend.",
    target: '[data-tutorial="budget"]',
    position: 'bottom',
    action: 'Tap a price tier'
  },
  {
    id: 'vibes',
    title: 'Choose Your Vibe ✨',
    content: "Romantic? Adventurous? Chill? Pick up to 3 vibes — or add your own custom one.",
    target: '[data-tutorial="vibes"]',
    position: 'bottom',
    action: 'Select 1-3 vibe tags'
  },
  {
    id: 'search',
    title: 'You\'re All Set! �',
    content: "Hit this button and we'll find the perfect venues for your night out.",
    target: '[data-tutorial="submit"]',
    position: 'top',
    action: 'Tap "Plan My Night" when ready'
  },
]

interface TutorialContextType {
  isActive: boolean
  currentStep: number
  steps: TutorialStep[]
  startTutorial: () => void
  nextStep: () => void
  prevStep: () => void
  skipTutorial: () => void
  completeTutorial: () => void
  isFirstTime: boolean
}

const TutorialContext = createContext<TutorialContextType>({
  isActive: false,
  currentStep: 0,
  steps: TUTORIAL_STEPS,
  startTutorial: () => {},
  nextStep: () => {},
  prevStep: () => {},
  skipTutorial: () => {},
  completeTutorial: () => {},
  isFirstTime: false,
})

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const { user } = useAuth()

  const checkFirstTimeUser = useCallback(async () => {
    if (!user?.uid) return

    try {
      const prefs = await getPreferences(user.uid)
      if (!prefs || !prefs.hasCompletedTutorial) {
        setIsFirstTime(true)
        setIsActive(true)
        setCurrentStep(0)
      }
    } catch {
      // Assume first time if we can't check
      setIsFirstTime(true)
      setIsActive(true)
      setCurrentStep(0)
    }
  }, [user])

  useEffect(() => {
    const id = setTimeout(() => {
      void checkFirstTimeUser()
    }, 0)

    return () => clearTimeout(id)
  }, [checkFirstTimeUser])

  const startTutorial = () => {
    setIsActive(true)
    setCurrentStep(0)
  }

  const nextStep = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeTutorial()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skipTutorial = async () => {
    setIsActive(false)
    if (user && isFirstTime) {
      try {
        await savePreferences(user.uid, { hasCompletedTutorial: true })
        setIsFirstTime(false)
      } catch {
        // ignore
      }
    }
  }

  const completeTutorial = async () => {
    setIsActive(false)
    if (user && isFirstTime) {
      try {
        await savePreferences(user.uid, { hasCompletedTutorial: true })
        setIsFirstTime(false)
      } catch {
        // ignore
      }
    }
  }

  return (
    <TutorialContext.Provider value={{
      isActive,
      currentStep,
      steps: TUTORIAL_STEPS,
      startTutorial,
      nextStep,
      prevStep,
      skipTutorial,
      completeTutorial,
      isFirstTime
    }}>
      {children}
    </TutorialContext.Provider>
  )
}

export const useTutorial = () => useContext(TutorialContext)
