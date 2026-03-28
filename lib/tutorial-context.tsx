"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
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
    content: "Let's plan your perfect evening! I'll show you how to create a magical date experience with curated venues and smart suggestions.",
    position: 'center'
  },
  {
    id: 'location',
    title: 'Choose Your Location 📍',
    content: "Start by entering where you'd like to have your date. We'll find amazing venues nearby - from cozy speakeasies to fine dining restaurants.",
    target: '[data-tutorial="location"]',
    position: 'bottom',
    action: 'Type your city or neighborhood'
  },
  {
    id: 'budget',
    title: 'Set Your Budget 💰',
    content: "Choose how much you'd like to spend. We'll match venues to your budget - from casual spots to luxury experiences.",
    target: '[data-tutorial="budget"]',
    position: 'bottom',
    action: 'Select your preferred price range'
  },
  {
    id: 'vibes',
    title: 'Pick Your Vibe ✨',
    content: "What's your mood? Romantic, adventurous, cozy, or something else? Select the vibes that match your perfect date atmosphere.",
    target: '[data-tutorial="vibes"]',
    position: 'bottom',
    action: 'Choose 2-3 vibe tags'
  },
  {
    id: 'time',
    title: 'Choose Your Timing 🕐',
    content: "When are you planning your date? Early evening for a relaxed start, prime time for the classic experience, or late night for something special?",
    target: '[data-tutorial="time"]',
    position: 'bottom',
    action: 'Select your preferred time slot'
  },
  {
    id: 'party-size',
    title: 'Party Size 👥',
    content: "Is this just for two, or are you planning a group date? We'll adjust our recommendations accordingly.",
    target: '[data-tutorial="party-size"]',
    position: 'bottom',
    action: 'Set the number of people'
  },
  {
    id: 'search',
    title: 'Find Your Venues 🔍',
    content: "Ready? Click 'Plan My Date' and we'll search for the perfect venues. This might take a moment as we find the best spots for you!",
    target: '[data-tutorial="submit"]',
    position: 'top',
    action: 'Click to start the search'
  },
  {
    id: 'loading',
    title: 'Magic Happening ✨',
    content: "We're searching multiple sources to find venues that match your preferences. Our smart algorithm is curating the perfect date experience!",
    position: 'center'
  },
  {
    id: 'itinerary',
    title: 'Your Perfect Date! 🎉',
    content: "Here's your curated itinerary! Each venue is revealed one by one. Click 'Reveal' to discover each stop on your romantic journey.",
    target: '[data-tutorial="itinerary"]',
    position: 'bottom',
    action: 'Click Reveal to discover venues'
  },
  {
    id: 'features',
    title: 'Save & Share 📱',
    content: "Save your favorite venues, copy the itinerary to share with your date, or sign out when you're done. Your preferences are saved for next time!",
    target: '[data-tutorial="actions"]',
    position: 'top',
    action: 'Try copying your plan'
  }
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

  useEffect(() => {
    if (user) {
      checkFirstTimeUser()
    }
  }, [user])

  const checkFirstTimeUser = async () => {
    try {
      const prefs = await getPreferences(user!.uid)
      if (!prefs || !prefs.hasCompletedTutorial) {
        setIsFirstTime(true)
        setIsActive(true)
        setCurrentStep(0)
      }
    } catch (error) {
      console.error("Error checking tutorial status:", error)
      // Assume first time if we can't check
      setIsFirstTime(true)
      setIsActive(true)
    }
  }

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
      } catch (error) {
        console.error("Error saving tutorial status:", error)
      }
    }
  }

  const completeTutorial = async () => {
    setIsActive(false)
    if (user && isFirstTime) {
      try {
        await savePreferences(user.uid, { hasCompletedTutorial: true })
        setIsFirstTime(false)
      } catch (error) {
        console.error("Error saving tutorial status:", error)
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
