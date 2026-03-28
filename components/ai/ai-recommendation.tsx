"use client"

import { useState, useEffect } from "react"
import { Sparkles, Heart, Clock, MapPin, DollarSign, Lightbulb } from "lucide-react"
import { geminiAI } from "@/lib/gemini"
import { Venue, SearchCriteria } from "@/lib/venue-search"

interface AIRecommendationProps {
  venues: Venue[]
  criteria: SearchCriteria
}

export function AIRecommendation({ venues, criteria }: AIRecommendationProps) {
  const [recommendation, setRecommendation] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (venues.length > 0) {
      generateRecommendation()
    }
  }, [venues, criteria])

  const generateRecommendation = async () => {
    setIsLoading(true)
    try {
      const rec = await geminiAI.generateDateRecommendation(venues, criteria)
      setRecommendation(rec)
    } catch (error) {
      console.error('Failed to generate AI recommendation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-linear-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">AI is crafting your perfect date...</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:0.2s]" />
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse [animation-delay:0.4s]" />
          <span>Analyzing venues and creating personalized recommendations</span>
        </div>
      </div>
    )
  }

  if (!recommendation) {
    return null
  }

  return (
    <div className="bg-linear-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-2xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">{recommendation.title}</h3>
          <p className="text-sm text-muted-foreground">AI-Powered Date Plan</p>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <p className="text-sm text-foreground leading-relaxed">{recommendation.description}</p>
        
        <div className="bg-card/50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Why This is Perfect</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{recommendation.why_perfect}</p>
        </div>
      </div>

      {/* Tips */}
      {recommendation.tips && recommendation.tips.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-foreground">Pro Tips</span>
          </div>
          <div className="space-y-1">
            {recommendation.tips.map((tip: string, index: number) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternatives */}
      {recommendation.alternatives && recommendation.alternatives.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Backup Options</span>
          </div>
          <div className="space-y-1">
            {recommendation.alternatives.map((alt: string, index: number) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                <p className="text-xs text-muted-foreground">{alt}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Criteria Summary */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
        <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full">
          <MapPin className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{criteria.location}</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full">
          <DollarSign className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{criteria.budget}</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full">
          <Clock className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{criteria.time}</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-full">
          <Heart className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{criteria.vibes.join(', ')}</span>
        </div>
      </div>
    </div>
  )
}
