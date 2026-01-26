// app/ChatPage.tsx

"use client"

import { useState, useMemo } from "react"
import { AIChatProvider } from "@/contexts/AIChatContext"
import { AIChatInterface } from "@/components/chat/AIChatInterface"
import { useAIChat } from "@/hooks/useAIChat"
import type {
  AIModel,
  DataSourceFile,
  AIChatHandlers,
  StreamChunk,
  SendMessageResponse,
  Citation,
} from "@/types/chat"

/**
 * Mock AI models data
 */
const mockModels: AIModel[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    providerSlug: "openai",
    contextWindow: 128000,
    maxOutputTokens: 4096,
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    providerSlug: "anthropic",
    contextWindow: 200000,
    maxOutputTokens: 8192,
  },
]

/**
 * Mock data source files
 */
const mockFiles: DataSourceFile[] = [
  {
    id: "file-1",
    filename: "Employee_Handbook.pdf",
    fileType: "pdf",
    size: 2048576,
    uploadedAt: "2026-01-25T10:00:00Z",
    chunkCount: 42,
    isSelected: false,
  },
  {
    id: "file-2",
    filename: "Product_Documentation.docx",
    fileType: "docx",
    size: 1048576,
    uploadedAt: "2026-01-24T14:30:00Z",
    chunkCount: 28,
    isSelected: false,
  },
]

/**
 * Mock citations for demonstration
 */
const mockCitations: Citation[] = [
  {
    id: "cit-1",
    document: "Employee_Handbook.pdf",
    page: 15,
    chunkIndex: 3,
    relevanceScore: 92,
  },
  {
    id: "cit-2",
    document: "Product_Documentation.docx",
    chunkIndex: 7,
    relevanceScore: 87,
  },
]

/**
 * Create a mock streaming response
 * Simulates token-by-token streaming with citations
 */
function createMockStream(): ReadableStream<StreamChunk> {
  return new ReadableStream<StreamChunk>({
    start(controller) {
      const mockResponse =
        "This is a simulated AI response demonstrating the chat interface. In production, this would be connected to the backend RAG API and would include actual answers based on your document knowledge base."

      let index = 0
      let sequence = 0

      function enqueueToken() {
        if (index < mockResponse.length) {
          // Send token in chunks of 5 characters for more realistic streaming
          const chunkSize = Math.min(5, mockResponse.length - index)
          const chunk = mockResponse.slice(index, index + chunkSize)

          controller.enqueue({
            type: "token",
            content: chunk,
            sequence: sequence++,
          })

          index += chunkSize
          setTimeout(enqueueToken, 30) // Simulate network delay
        } else {
          // Send citations
          mockCitations.forEach((citation) => {
            controller.enqueue({
              type: "citation",
              citation,
              sequence: sequence++,
            })
          })

          // Send done signal
          controller.enqueue({
            type: "done",
            sequence: sequence++,
          })
          controller.close()
        }
      }

      enqueueToken()
    },
  })
}

/**
 * Inner component that uses the chat hook
 */
function ChatContent() {
  const [selectedModel, setSelectedModel] = useState<AIModel>(mockModels[0])
  const [selectedSources, setSelectedSources] = useState<DataSourceFile[]>([])

  // Mock handlers implementation
  const handlers: AIChatHandlers = useMemo(
    () => ({
      sendMessage: async (_payload) => {
        const stream = createMockStream()
        return {
          messageId: crypto.randomUUID(),
          conversationId: crypto.randomUUID(),
          stream,
        } as SendMessageResponse
      },

      fetchFilesList: async () => mockFiles,

      loadConversation: async (_conversationId) => null,

      copyToClipboard: async (text: string) => {
        await navigator.clipboard.writeText(text)
      },

      onModelChange: async (_modelId) => {
        // No-op for mock
      },

      onDataSourceChange: async (_sourceIds) => {
        // No-op for mock
      },

      regenerateResponse: async (_messageId) => {
        const stream = createMockStream()
        return {
          messageId: crypto.randomUUID(),
          conversationId: crypto.randomUUID(),
          stream,
        } as SendMessageResponse
      },

      stopStreaming: (abortController: AbortController) => {
        abortController.abort()
      },

      onError: (error: Error, context: string) => {
        console.error(`[Mock Handler] Error in ${context}:`, error)
      },
    }),
    []
  )

  // Use the chat hook
  const chatState = useAIChat({
    handlers,
    selectedModel,
    selectedSources,
  })

  // Toggle source selection
  const toggleSource = (sourceId: string) => {
    setSelectedSources((prev) => {
      const exists = prev.find((s) => s.id === sourceId)
      if (exists) {
        return prev.filter((s) => s.id !== sourceId)
      } else {
        const file = mockFiles.find((f) => f.id === sourceId)
        return file ? [...prev, file] : prev
      }
    })
  }

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      messages: chatState.messages,
      selectedModel,
      selectedSources,
      isStreaming: chatState.isStreaming,
      error: chatState.error,
      sendMessage: chatState.sendMessage,
      regenerateResponse: chatState.regenerateResponse,
      stopStreaming: chatState.stopStreaming,
      clearError: chatState.clearError,
      clearMessages: chatState.clearMessages,
      selectModel: setSelectedModel,
      toggleSource,
    }),
    [
      chatState.messages,
      selectedModel,
      selectedSources,
      chatState.isStreaming,
      chatState.error,
      chatState.sendMessage,
      chatState.regenerateResponse,
      chatState.stopStreaming,
      chatState.clearError,
      chatState.clearMessages,
    ]
  )

  return (
    <AIChatProvider value={contextValue}>
      <AIChatInterface
        models={mockModels}
        availableFiles={mockFiles}
        onCopy={async (content) => await navigator.clipboard.writeText(content)}
        onRegenerate={async (messageId) => await chatState.regenerateResponse(messageId)}
      />
    </AIChatProvider>
  )
}

/**
 * ChatPage - Client component wrapper for the chat interface
 * Sets up mock data and handlers for demonstration
 */
export default function ChatPage() {
  return <ChatContent />
}
