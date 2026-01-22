// hooks/useAIChat.ts

import { useState, useCallback, useRef } from "react"
import type {
  ChatMessage,
  AIModel,
  DataSourceFile,
  AIChatHandlers,
  StreamChunk,
  MessageRole,
  MessageStatus,
  SendMessagePayload
} from "@/types/chat"

export interface UseAIChatParams {
  /** Initial messages */
  initialMessages?: ChatMessage[]
  /** Event handlers */
  handlers: AIChatHandlers
  /** Selected model */
  selectedModel: AIModel
  /** Selected data sources */
  selectedSources: DataSourceFile[]
}

export interface UseAIChatReturn {
  // State
  messages: ChatMessage[]
  isStreaming: boolean
  isLoading: boolean
  error: Error | null
  abortController: AbortController | null

  // Actions
  sendMessage: (content: string) => Promise<void>
  regenerateResponse: (messageId: string) => Promise<void>
  stopStreaming: () => void
  clearError: () => void
  clearMessages: () => void
}

/**
 * Main chat state management hook
 * Handles messages, streaming, loading states, errors
 */
export function useAIChat(params: UseAIChatParams): UseAIChatReturn {
  const { handlers, selectedModel, selectedSources } = params

  const [messages, setMessages] = useState<ChatMessage[]>(params.initialMessages ?? [])
  const [isStreaming, setIsStreaming] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Process SSE stream
  const processStream = useCallback(
    async (
      stream: ReadableStream<StreamChunk>,
      assistantMessage: ChatMessage
    ) => {
      const reader = stream.getReader()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          // Parse chunk (assuming server sends pre-parsed JSON objects)
          const chunk = value

          // Handle different chunk types
          switch (chunk.type) {
            case "token":
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessage.id
                    ? { ...msg, content: msg.content + (chunk.content ?? "") }
                    : msg
                )
              )
              break

            case "citation":
              setMessages(prev =>
                prev.map(msg => {
                  if (msg.id === assistantMessage.id) {
                    const citations = msg.annotations?.citations ?? []
                    return {
                      ...msg,
                      annotations: {
                        timestamp: msg.annotations?.timestamp ?? new Date().toISOString(),
                        model: msg.annotations?.model ?? selectedModel.id,
                        citations: [...citations, chunk.citation!],
                        ...(msg.annotations?.usage && { usage: msg.annotations.usage }),
                        ...(msg.annotations?.reasoning && { reasoning: msg.annotations.reasoning })
                      }
                    }
                  }
                  return msg
                })
              )
              break

            case "reasoning":
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessage.id
                    ? {
                        ...msg,
                        annotations: {
                          timestamp: msg.annotations?.timestamp ?? new Date().toISOString(),
                          model: msg.annotations?.model ?? selectedModel.id,
                          reasoning: chunk.reasoning,
                          ...(msg.annotations?.citations && { citations: msg.annotations.citations }),
                          ...(msg.annotations?.usage && { usage: msg.annotations.usage })
                        }
                      }
                    : msg
                )
              )
              break

            case "tool_call":
              setMessages(prev =>
                prev.map(msg => {
                  if (msg.id === assistantMessage.id) {
                    const toolCalls = msg.toolCalls ?? []
                    return {
                      ...msg,
                      toolCalls: [...toolCalls, chunk.toolCall!]
                    }
                  }
                  return msg
                })
              )
              break

            case "error":
              const errorMessage = chunk.error ?? "Unknown error"
              setError(new Error(errorMessage))
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessage.id
                    ? { ...msg, status: "error" as MessageStatus }
                    : msg
                )
              )
              handlers.onError(new Error(errorMessage), "stream")
              break

            case "done":
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessage.id
                    ? { ...msg, status: "completed" as MessageStatus }
                    : msg
                )
              )
              break
          }
        }
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error("Stream read error")
        setError(errorObj)
        handlers.onError(errorObj, "stream")

        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, status: "error" as MessageStatus }
              : msg
          )
        )
      } finally {
        setIsStreaming(false)
        abortControllerRef.current = null
      }
    },
    [handlers]
  )

  // Send a message
  const sendMessage = useCallback(
    async (content: string) => {
      // Clear previous errors
      setError(null)

      // Create user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user" as MessageRole,
        content,
        status: "completed" as MessageStatus,
        timestamp: new Date().toISOString()
      }

      // Add user message to state
      setMessages(prev => [...prev, userMessage])

      // Create assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as MessageRole,
        content: "",
        status: "streaming" as MessageStatus,
        timestamp: new Date().toISOString(),
        annotations: {
          timestamp: new Date().toISOString(),
          model: selectedModel.id
        }
      }

      // Add assistant message to state
      setMessages(prev => [...prev, assistantMessage])

      // Create abort controller
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      // Build payload
      const payload: SendMessagePayload = {
        message: content,
        dataSources: selectedSources.map(s => s.id),
        model: selectedModel.id,
        conversationHistory: messages,
        conversationId: undefined
      }

      setIsStreaming(true)
      setIsLoading(true)

      try {
        // Call handler
        const response = await handlers.sendMessage(payload)

        setIsLoading(false)

        // Process stream
        await processStream(response.stream, assistantMessage)
      } catch (err) {
        setIsLoading(false)
        setIsStreaming(false)
        abortControllerRef.current = null

        const errorObj = err instanceof Error ? err : new Error("Send message failed")
        setError(errorObj)
        handlers.onError(errorObj, "sendMessage")

        // Update assistant message status
        setMessages(prev =>
          prev.map(msg =>
            msg.id === assistantMessage.id
              ? { ...msg, status: "error" as MessageStatus }
              : msg
          )
        )
      }
    },
    [selectedModel, selectedSources, messages, handlers, processStream]
  )

  // Regenerate a response
  const regenerateResponse = useCallback(
    async (messageId: string) => {
      // Find the message index
      const messageIndex = messages.findIndex(m => m.id === messageId)
      if (messageIndex === -1) return

      // Find the user message for this turn
      const userMessage = messages[messageIndex - 1]
      if (!userMessage || userMessage.role !== "user") {
        handlers.onError(new Error("Cannot regenerate: user message not found"), "regenerateResponse")
        return
      }

      // Remove all messages after (and including) the assistant message
      setMessages(prev => prev.slice(0, messageIndex))

      // Resend the user message
      await sendMessage(userMessage.content)
    },
    [messages, sendMessage, handlers]
  )

  // Stop streaming
  const stopStreaming = useCallback(() => {
    const controller = abortControllerRef.current
    if (controller) {
      handlers.stopStreaming(controller)
      setIsStreaming(false)
      abortControllerRef.current = null

      // Update the streaming message status
      setMessages(prev =>
        prev.map(msg =>
          msg.status === "streaming"
            ? { ...msg, status: "stopped" as MessageStatus }
            : msg
        )
      )
    }
  }, [handlers])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    setIsStreaming(false)
    abortControllerRef.current = null
  }, [])

  return {
    messages,
    isStreaming,
    isLoading,
    error,
    abortController: abortControllerRef.current,
    sendMessage,
    regenerateResponse,
    stopStreaming,
    clearError,
    clearMessages
  }
}
