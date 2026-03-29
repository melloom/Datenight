import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message, context, history } = await request.json()

    // Get AI settings from request headers or use defaults
    const settings = getAISettings()

    let response: string
    let suggestion: any = null

    if (settings.useLocalModel && settings.localModelPath) {
      // Use local model
      response = await generateLocalResponse(message, context, history)
    } else if (settings.provider === "gemini" && settings.geminiApiKey) {
      // Use Gemini
      response = await generateGeminiResponse(message, context, history, settings.geminiApiKey)
    } else if (settings.provider === "openai" && settings.openaiApiKey) {
      // Use OpenAI
      response = await generateOpenAIResponse(message, context, history, settings.openaiApiKey)
    } else {
      // Fallback to rule-based responses
      response = generateFallbackResponse(message, context)
    }

    // Extract suggestions from response if present
    suggestion = extractSuggestion(response, context)

    return NextResponse.json({ message: response, suggestion })
  } catch (error) {
    console.error("AI chat error:", error)
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    )
  }
}

function getAISettings() {
  // In production, get from user's session or database
  // For now, return defaults
  return {
    provider: "gemini",
    geminiApiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
    openaiApiKey: "",
    localModelPath: "",
    useLocalModel: false,
  }
}

async function generateGeminiResponse(
  message: string,
  context: any,
  history: any[],
  apiKey: string
): Promise<string> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai")
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-pro" })

  const contextStr = context
    ? `Context: Location: ${context.location || "not specified"}, Budget: ${context.budget || "not specified"}, Vibes: ${context.vibes?.join(", ") || "not specified"}, Time: ${context.time || "not specified"}`
    : ""

  const historyStr = history
    .map((h: any) => `${h.role}: ${h.content}`)
    .join("\n")

  const prompt = `You are a helpful date planning assistant. Help the user plan their perfect date.

${contextStr}

Previous conversation:
${historyStr}

User: ${message}

Provide a helpful, friendly response. If suggesting venues or activities, be specific and consider the context provided.`

  const result = await model.generateContent(prompt)
  return result.response.text()
}

async function generateOpenAIResponse(
  message: string,
  context: any,
  history: any[],
  apiKey: string
): Promise<string> {
  const messages = [
    {
      role: "system",
      content: `You are a helpful date planning assistant. Context: ${JSON.stringify(context)}`,
    },
    ...history.map((h: any) => ({
      role: h.role === "user" ? "user" : "assistant",
      content: h.content,
    })),
    { role: "user", content: message },
  ]

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
    }),
  })

  const data = await response.json()
  return data.choices[0].message.content
}

async function generateLocalResponse(
  message: string,
  context: any,
  history: any[]
): Promise<string> {
  // In production, this would use a local LLM via WebLLM or similar
  // For now, return a placeholder
  return "Local model inference would happen here. This requires WebLLM or similar library to run models in the browser."
}

function generateFallbackResponse(message: string, context: any): string {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("romantic") || lowerMessage.includes("dinner")) {
    return `For a romantic dinner${context?.location ? ` in ${context.location}` : ""}, I'd recommend looking for restaurants with:\n\n• Intimate ambiance with dim lighting\n• Quality cuisine (Italian, French, or farm-to-table)\n• Good wine selection\n• Outdoor seating if weather permits\n\nWould you like me to search for specific restaurants matching these criteria?`
  }

  if (lowerMessage.includes("activity") || lowerMessage.includes("fun")) {
    return `For a fun activity date${context?.location ? ` in ${context.location}` : ""}, consider:\n\n• Escape rooms for teamwork and excitement\n• Mini golf or bowling for casual fun\n• Art galleries or museums for culture\n• Cooking classes for interactive experience\n• Live music venues for entertainment\n\nWhat type of activity sounds most appealing?`
  }

  if (lowerMessage.includes("budget") || lowerMessage.includes("cheap") || lowerMessage.includes("affordable")) {
    return `For budget-friendly date ideas:\n\n• Picnic in a local park\n• Free museum days\n• Coffee shop and walk\n• Food truck hopping\n• Sunset watching at a scenic spot\n\nThese can be just as memorable without breaking the bank!`
  }

  if (lowerMessage.includes("itinerary") || lowerMessage.includes("plan")) {
    return `I can help you create a complete date itinerary! Here's a sample structure:\n\n1. **Start (${context?.time || "Evening"})**: Drinks or appetizers at a cozy bar\n2. **Main Activity**: Dinner at a nice restaurant\n3. **After**: Dessert at a different spot or evening walk\n4. **Optional**: Late-night coffee or nightcap\n\nWould you like me to customize this based on your preferences?`
  }

  return `I'd be happy to help you plan your date! I can assist with:\n\n• Finding restaurants and venues\n• Creating custom itineraries\n• Suggesting activities based on your interests\n• Budget-friendly options\n• Romantic ideas\n\nWhat would you like to focus on?`
}

function extractSuggestion(response: string, context: any): any {
  // Simple extraction - in production, this would be more sophisticated
  if (response.includes("restaurant") || response.includes("dinner")) {
    return {
      type: "venue",
      category: "restaurant",
      context,
    }
  }
  return null
}
