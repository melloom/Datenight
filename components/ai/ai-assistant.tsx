"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, Send, Sparkles, X, Lightbulb } from "lucide-react"
import { geminiAI } from "@/lib/gemini"
import { Venue } from "@/lib/venue-search"

interface Message {
  id: string
  text: string
  sender: 'user' | 'ai'
  timestamp: number
}

interface AIAssistantProps {
  currentVenue?: Venue
  searchCriteria?: any
  isOpen: boolean
  onToggle: () => void
}

export function AIAssistant({ currentVenue, searchCriteria, isOpen, onToggle }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your Date Night AI assistant. I can help you plan the perfect date, suggest venues, or answer any questions about your date night. What would you like to know?",
      sender: 'ai',
      timestamp: Date.now()
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    try {
      const aiResponse = await geminiAI.generateChatResponse(inputValue, {
        currentVenue,
        searchCriteria,
        previousMessages: messages.slice(-3).map(m => m.text)
      })

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('AI response error:', error)
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble responding right now. Please try again in a moment!",
        sender: 'ai',
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const quickSuggestions = [
    "What makes this venue special for dates?",
    "What should I wear?",
    "How can I make this date extra special?",
    "Backup plans if this doesn't work out?",
    "Conversation starters for this venue?"
  ]

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center group z-40"
      >
        <MessageCircle className="w-6 h-6" />
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-accent animate-pulse" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-card border border-border rounded-2xl shadow-2xl shadow-primary/20 flex flex-col z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
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
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
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
      {messages.length <= 2 && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-foreground">Try asking:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {quickSuggestions.slice(0, 3).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInputValue(suggestion)}
                className="px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded-full transition-colors"
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
            onClick={handleSendMessage}
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
