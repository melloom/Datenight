"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, Send, Sparkles, X, Lightbulb } from "lucide-react"
import { geminiAI } from "@/lib/gemini"
import { SearchCriteria, Venue } from "@/lib/venue-search"

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: number
}

type AssistantSearchCriteria = Partial<SearchCriteria> & {
  venues?: Venue[]
}

interface AIAssistantProps {
  currentVenue?: Venue
  searchCriteria?: AssistantSearchCriteria | null
  isOpen: boolean
  onToggle: () => void
  screen?: 'setup' | 'loading' | 'itinerary'
}

export function AIAssistant({ currentVenue, searchCriteria, isOpen, onToggle, screen = 'setup' }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "🌟 Hi! I'm your Date Night AI. I can help with:\n\n• Date planning & venue tips\n• Outfit & conversation advice\n• Restaurant etiquette & gift ideas\n• Photo spots & romantic gestures\n\nWhat would you like to know?",
      sender: 'ai',
      timestamp: Date.now()
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const quickSuggestions = screen === 'itinerary' ? [
    "What should I wear?",
    "Conversation starters?",
    "Gift ideas?",
    "Restaurant tips?",
    "Photo spots?",
    "Backup plans?"
  ] : [
    "Date night ideas?",
    "What should I wear?",
    "Conversation starters?",
    "Gift ideas?",
    "How to plan a date?",
    "Romantic gestures?"
  ]

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue
    if (!textToSend.trim()) return

    // Hide suggestions when user sends a message
    setShowSuggestions(false)

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      // Enhanced context for better AI responses
      const context = {
        currentVenue,
        searchCriteria,
        previousMessages: messages.slice(-3).map(m => m.text),
        currentTime: new Date().toLocaleString(),
        venueCount: searchCriteria?.venues?.length || 0,
        location: searchCriteria?.location || 'Unknown',
        budget: searchCriteria?.budget || 'Unknown',
        vibes: searchCriteria?.vibes || [],
        partySize: searchCriteria?.partySize || 2
      }

      const aiResponse = await geminiAI.generateChatResponse(textToSend, context)

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "🤔 I'm having trouble responding right now. Please try again in a moment! In the meantime, you can ask me about:\n\n• Date outfit suggestions\n• Conversation starters\n• Restaurant etiquette\n• Backup activity ideas\n• Gift recommendations\n• Photo spot locations",
        sender: 'ai',
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center group z-50"
      >
        <MessageCircle className="w-6 h-6" />
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent animate-pulse" />
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg px-2 py-1 text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Date Night AI
        </div>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-[calc(100vw-3rem)] sm:w-96 max-h-[80svh] h-[500px] bg-card border border-border rounded-2xl shadow-2xl shadow-primary/20 flex flex-col z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-linear-to-r from-primary/10 to-accent/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Date Night AI</h3>
            <p className="text-xs text-muted-foreground">Your personal date planner</p>
          </div>
        </div>
        <button
          onClick={onToggle}
          className="w-8 h-8 rounded-full hover:bg-accent transition-colors flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap ${
                message.sender === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted text-muted-foreground px-3 py-2 rounded-2xl text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                <div className="w-2 h-2 rounded-full bg-current animate-pulse [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-current animate-pulse [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions */}
      {showSuggestions && messages.length <= 2 && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground">Popular questions:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {quickSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded-full transition-colors"
                disabled={isTyping}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your date..."
            className="flex-1 px-3 py-2 bg-muted border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent"
            disabled={isTyping}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isTyping}
            className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
