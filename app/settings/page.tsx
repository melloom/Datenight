"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, Key, Brain, CheckCircle2, AlertCircle } from "lucide-react"

interface AISettings {
  provider: "gemini" | "openai" | "local"
  geminiApiKey: string
  openaiApiKey: string
  localModelPath: string
  useLocalModel: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<AISettings>({
    provider: "gemini",
    geminiApiKey: "",
    openaiApiKey: "",
    localModelPath: "",
    useLocalModel: false,
  })
  
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  useEffect(() => {
    const saved = localStorage.getItem("ai-settings")
    if (saved) {
      setSettings(JSON.parse(saved))
    }
  }, [])

  const handleSave = () => {
    setSaveStatus("saving")
    try {
      localStorage.setItem("ai-settings", JSON.stringify(settings))
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch (error) {
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 2000)
    }
  }

  const handleDownloadModel = async () => {
    setIsDownloading(true)
    setDownloadProgress(0)

    try {
      const response = await fetch("/api/ai/download-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelName: "llama-3.2-1b" }),
      })

      if (!response.ok) throw new Error("Download failed")

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No reader available")

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = new TextDecoder().decode(value)
        const lines = text.split("\n").filter(Boolean)
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6))
            if (data.progress) {
              setDownloadProgress(data.progress)
            }
            if (data.path) {
              setSettings(prev => ({ ...prev, localModelPath: data.path }))
            }
          }
        }
      }
    } catch (error) {
      console.error("Model download failed:", error)
      alert("Failed to download model. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Settings</h1>
        <p className="text-muted-foreground">
          Configure your AI provider and API keys for enhanced date planning features
        </p>
      </div>

      <Tabs defaultValue="provider" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="provider">AI Provider</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="local-model">Local Model</TabsTrigger>
        </TabsList>

        <TabsContent value="provider" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Choose AI Provider</CardTitle>
              <CardDescription>
                Select which AI service to use for date recommendations and venue analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">AI Provider</Label>
                <Select
                  value={settings.provider}
                  onValueChange={(value: any) => setSettings(prev => ({ ...prev, provider: value }))}
                >
                  <SelectTrigger id="provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">Google Gemini (Cloud)</SelectItem>
                    <SelectItem value="openai">OpenAI GPT (Cloud)</SelectItem>
                    <SelectItem value="local">Local Model (Privacy-focused)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <Brain className="h-4 w-4" />
                <AlertDescription>
                  {settings.provider === "local" 
                    ? "Local models run on your device and don't send data to external servers. Requires model download."
                    : "Cloud providers offer the best performance but require an API key and internet connection."}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Enter your API keys for cloud AI providers. Keys are stored locally in your browser.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gemini-key">Google Gemini API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="gemini-key"
                    type="password"
                    placeholder="Enter your Gemini API key"
                    value={settings.geminiApiKey}
                    onChange={(e) => setSettings(prev => ({ ...prev, geminiApiKey: e.target.value }))}
                  />
                  <Button variant="outline" size="icon" asChild>
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                      <Key className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get your free API key from Google AI Studio
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="openai-key"
                    type="password"
                    placeholder="Enter your OpenAI API key"
                    value={settings.openaiApiKey}
                    onChange={(e) => setSettings(prev => ({ ...prev, openaiApiKey: e.target.value }))}
                  />
                  <Button variant="outline" size="icon" asChild>
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                      <Key className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get your API key from OpenAI Platform
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="local-model" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Local AI Model</CardTitle>
              <CardDescription>
                Download and run AI models locally on your device for complete privacy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Use Local Model</Label>
                  <p className="text-sm text-muted-foreground">
                    Run AI on your device instead of cloud services
                  </p>
                </div>
                <Switch
                  checked={settings.useLocalModel}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, useLocalModel: checked }))}
                />
              </div>

              {settings.useLocalModel && (
                <>
                  <div className="space-y-2">
                    <Label>Model Status</Label>
                    {settings.localModelPath ? (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <AlertDescription>
                          Model installed at: {settings.localModelPath}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                        <AlertDescription>
                          No local model installed. Download one to get started.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Available Models</Label>
                    <div className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Llama 3.2 1B</p>
                          <p className="text-sm text-muted-foreground">
                            Fast, lightweight model (~1.3GB)
                          </p>
                        </div>
                        <Button
                          onClick={handleDownloadModel}
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <>Downloading {downloadProgress}%</>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </>
                          )}
                        </Button>
                      </div>
                      {isDownloading && (
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${downloadProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saveStatus === "saving"}>
          {saveStatus === "saving" && "Saving..."}
          {saveStatus === "saved" && (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Saved
            </>
          )}
          {saveStatus === "idle" && "Save Settings"}
          {saveStatus === "error" && "Error - Try Again"}
        </Button>
      </div>
    </div>
  )
}
