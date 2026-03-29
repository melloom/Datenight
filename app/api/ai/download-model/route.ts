import { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  const { modelName } = await request.json()

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Simulate model download with progress updates
        // In production, this would download from Hugging Face or similar
        const modelUrl = getModelUrl(modelName)
        
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ status: "starting", progress: 0 })}\n\n`)
        )

        // Simulate download progress
        for (let i = 0; i <= 100; i += 10) {
          await new Promise(resolve => setTimeout(resolve, 500))
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ status: "downloading", progress: i })}\n\n`)
          )
        }

        // In production, save model to local storage or IndexedDB
        const modelPath = `/models/${modelName}.gguf`
        
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            status: "complete", 
            progress: 100,
            path: modelPath 
          })}\n\n`)
        )

        controller.close()
      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            status: "error", 
            error: error instanceof Error ? error.message : "Unknown error" 
          })}\n\n`)
        )
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}

function getModelUrl(modelName: string): string {
  const models: Record<string, string> = {
    "llama-3.2-1b": "https://huggingface.co/meta-llama/Llama-3.2-1B-Instruct-GGUF/resolve/main/llama-3.2-1b-instruct-q4_k_m.gguf",
    "phi-3-mini": "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf",
  }
  
  return models[modelName] || models["llama-3.2-1b"]
}
