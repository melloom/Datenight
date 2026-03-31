"use client"

import { AlertCircle, Clock, Home, Calendar, Package, Star, ChevronRight, X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  LateNightResponse, 
  AlternativeSuggestion, 
  SameDayOption 
} from "@/lib/late-night-detector"

interface LateNightAlertProps {
  response: LateNightResponse
  onSuggestionSelect?: (suggestion: AlternativeSuggestion) => void
  onSameDaySelect?: (option: SameDayOption) => void
  onDismiss?: () => void
  isGenerating?: boolean
}

export function LateNightAlert({ 
  response, 
  onSuggestionSelect, 
  onSameDaySelect, 
  onDismiss,
  isGenerating = false 
}: LateNightAlertProps) {
  const { detection, suggestions, sameDayOptions, message, urgency } = response
  
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-800'
      case 'high': return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'low': return 'bg-blue-50 border-blue-200 text-blue-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }
  
  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'high': return <Clock className="h-5 w-5 text-orange-600" />
      case 'medium': return <Clock className="h-5 w-5 text-yellow-600" />
      case 'low': return <Star className="h-5 w-5 text-blue-600" />
      default: return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'immediate': return <Clock className="h-4 w-4" />
      case 'tomorrow': return <Calendar className="h-4 w-4" />
      case 'weekend': return <Calendar className="h-4 w-4" />
      case 'home': return <Home className="h-4 w-4" />
      default: return <Star className="h-4 w-4" />
    }
  }
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'delivery': return <Package className="h-4 w-4" />
      case 'streaming': return <Star className="h-4 w-4" />
      case 'outdoor': return <Home className="h-4 w-4" />
      case 'quick_venue': return <Clock className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }
  
  return (
    <div className={`rounded-lg border p-4 mb-6 ${getUrgencyColor(urgency)}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getUrgencyIcon(urgency)}
          <h3 className="font-semibold text-lg">Date Night Timing Alert</h3>
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <p className="text-sm mb-3">{message}</p>
      
      {/* Detection Details */}
      {detection.reasons.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium mb-2">Why this matters:</p>
          <ul className="text-xs space-y-1">
            {detection.reasons.map((reason, index) => (
              <li key={index} className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-current opacity-60" />
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Same Day Options */}
      {sameDayOptions.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Available Today ({sameDayOptions.length} options)
          </h4>
          <div className="grid gap-2">
            {sameDayOptions.slice(0, 3).map((option) => (
              <Card key={option.title} className="bg-white/50 border-white/20">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getTypeIcon(option.type)}
                        <h5 className="font-medium text-sm">{option.title}</h5>
                        <Badge variant="secondary" className="text-xs">
                          {option.availableUntil}
                        </Badge>
                      </div>
                      <p className="text-xs opacity-80 mb-2">{option.description}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {option.setupTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {option.cost}
                        </span>
                        {option.lastOrderTime && (
                          <span className="text-red-600 font-medium">
                            Order by: {option.lastOrderTime}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {option.actionUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(option.actionUrl, '_blank', 'noopener,noreferrer')}
                          className="h-8 gap-1 text-xs"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open
                        </Button>
                      )}
                      {onSameDaySelect && !option.actionUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSameDaySelect(option)}
                          disabled={isGenerating}
                          className="h-8"
                        >
                          {isGenerating ? '...' : 'Choose'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Alternative Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h4 className="font-medium text-sm mb-2">Better Alternatives</h4>
          <div className="grid gap-3">
            {suggestions.slice(0, 4).map((suggestion) => (
              <Card key={suggestion.id} className="bg-white/50 border-white/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(suggestion.category)}
                      <CardTitle className="text-sm">{suggestion.title}</CardTitle>
                      <Badge 
                        variant={suggestion.availability === 'now' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {suggestion.availability === 'now' ? 'Available Now' : 
                         suggestion.availability === 'tonight' ? 'Tonight' :
                         suggestion.availability === 'tomorrow' ? 'Tomorrow' : 'Weekend'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {suggestion.actionUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(suggestion.actionUrl, '_blank', 'noopener,noreferrer')}
                          className="h-6 w-6 p-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      {onSuggestionSelect && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSuggestionSelect(suggestion)}
                          disabled={isGenerating}
                          className="h-6 w-6 p-0"
                        >
                          {isGenerating ? '...' : <ChevronRight className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-xs">
                    {suggestion.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-xs mb-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {suggestion.timeRequired}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {suggestion.costEstimate}
                    </span>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {suggestion.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Pros */}
                  {suggestion.pros.length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-1">Why it is great:</p>
                      <ul className="text-xs space-y-0.5">
                        {suggestion.pros.slice(0, 2).map((pro, index) => (
                          <li key={index} className="flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-green-600" />
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      <Separator className="my-4 bg-white/30" />
      
      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span>
            {detection.availableVenuesCount} venues found • 
            {detection.timeUntilClosing > 0 ? 
              ` ~${Math.floor(detection.timeUntilClosing / 60)}h until typical closing` : 
              ' Most venues may be closed'
            }
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-60">
          <AlertCircle className="h-3 w-3" />
          <span>Smart timing suggestions</span>
        </div>
      </div>
    </div>
  )
}
