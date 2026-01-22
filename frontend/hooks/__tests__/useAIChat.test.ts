// hooks/__tests__/useAIChat.test.ts

import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useAIChat } from "../useAIChat"
import {
  createMockHandlers,
  createMockAIModel,
  createMockDataSourceFile,
  createMockStreamChunks,
  createControlledStream,
  createMockCitation
} from "@/__tests__/utils/mock-helpers"
import type { AIModel, DataSourceFile, StreamChunk } from "@/types/chat"

// Mock crypto.randomUUID
const mockUUID = () => {
  let counter = 0
  return () => `test-uuid-${counter++}`
}
global.crypto = { ...global.crypto, randomUUID: mockUUID() } as Crypto

describe("useAIChat", () => {
  const mockModel: AIModel = createMockAIModel({ id: "gpt-4o", name: "GPT-4o" })
  const mockFile: DataSourceFile = createMockDataSourceFile({ id: "file-1" })

  let mockStreamController: ReadableStreamDefaultController<StreamChunk> | null = null
  let createStreamSpy: jest.Mock

  const createMockStream = () => {
    return new ReadableStream<StreamChunk>({
      start(controller) {
        mockStreamController = controller
      }
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockStreamController = null

    createStreamSpy = jest.fn(() => ({
      messageId: "msg-assistant-1",
      conversationId: "conv-1",
      stream: createMockStream()
    }))
  })

  it("should initialize with empty messages", () => {
    const handlers = createMockHandlers()
    const { result } = renderHook(() =>
      useAIChat({
        handlers,
        selectedModel: mockModel,
        selectedSources: []
      })
    )

    expect(result.current.messages).toEqual([])
    expect(result.current.isStreaming).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.abortController).toBeNull()
  })

  it("should send message and add user message to state", async () => {
    const handlers = createMockHandlers({
      sendMessage: createStreamSpy
    })

    const { result } = renderHook(() =>
      useAIChat({
        handlers,
        selectedModel: mockModel,
        selectedSources: []
      })
    )

    await act(async () => {
      await result.current.sendMessage("Hello, AI!")
    })

    expect(result.current.messages).toHaveLength(2) // user + assistant
    expect(result.current.messages[0]?.role).toBe("user")
    expect(result.current.messages[0]?.content).toBe("Hello, AI!")
    expect(handlers.sendMessage).toHaveBeenCalledWith({
      message: "Hello, AI!",
      dataSources: [],
      model: "gpt-4o",
      conversationHistory: [],
      conversationId: undefined
    })
  })

  it("should include data sources in payload", async () => {
    const handlers = createMockHandlers({
      sendMessage: createStreamSpy
    })

    const { result } = renderHook(() =>
      useAIChat({
        handlers,
        selectedModel: mockModel,
        selectedSources: [mockFile]
      })
    )

    await act(async () => {
      await result.current.sendMessage("Hello")
    })

    expect(handlers.sendMessage).toHaveBeenCalledWith({
      message: "Hello",
      dataSources: ["file-1"],
      model: "gpt-4o",
      conversationHistory: [],
      conversationId: undefined
    })
  })

  it("should create assistant message and start streaming", async () => {
    const handlers = createMockHandlers({
      sendMessage: createStreamSpy
    })

    const { result } = renderHook(() =>
      useAIChat({
        handlers,
        selectedModel: mockModel,
        selectedSources: []
      })
    )

    await act(async () => {
      await result.current.sendMessage("test")
    })

    expect(result.current.messages).toHaveLength(2)
    expect(result.current.messages[0]?.role).toBe("user")
    expect(result.current.messages[1]?.role).toBe("assistant")
    expect(result.current.messages[1]?.status).toBe("streaming")
    expect(result.current.isStreaming).toBe(true)
    expect(result.current.abortController).not.toBeNull()
  })

  it("should process token chunks and update assistant message", async () => {
    const handlers = createMockHandlers({
      sendMessage: createStreamSpy
    })

    const { result } = renderHook(() =>
      useAIChat({
        handlers,
        selectedModel: mockModel,
        selectedSources: []
      })
    )

    await act(async () => {
      await result.current.sendMessage("test")
    })

    // Simulate streaming tokens
    await act(async () => {
      mockStreamController?.enqueue({ type: "token", content: "Hello", sequence: 0 })
      mockStreamController?.enqueue({ type: "token", content: " there", sequence: 1 })
      await new Promise(resolve => setTimeout(resolve, 50))
    })

    expect(result.current.messages[1]?.content).toBe("Hello there")
  })

  it("should process citation chunks", async () => {
    const handlers = createMockHandlers({
      sendMessage: createStreamSpy
    })

    const { result } = renderHook(() =>
      useAIChat({
        handlers,
        selectedModel: mockModel,
        selectedSources: []
      })
    )

    await act(async () => {
      await result.current.sendMessage("test")
    })

    const citation = createMockCitation({ document: "test.pdf" })

    await act(async () => {
      mockStreamController?.enqueue({
        type: "citation",
        citation,
        sequence: 0
      })
      await new Promise(resolve => setTimeout(resolve, 50))
    })

    expect(result.current.messages[1]?.annotations?.citations).toHaveLength(1)
    expect(result.current.messages[1]?.annotations?.citations?.[0]?.document).toBe("test.pdf")
  })

  it("should process reasoning chunks", async () => {
    const handlers = createMockHandlers({
      sendMessage: createStreamSpy
    })

    const { result } = renderHook(() =>
      useAIChat({
        handlers,
        selectedModel: mockModel,
        selectedSources: []
      })
    )

    await act(async () => {
      await result.current.sendMessage("test")
    })

    await act(async () => {
      mockStreamController?.enqueue({
        type: "reasoning",
        reasoning: "Let me think about this...",
        sequence: 0
      })
      await new Promise(resolve => setTimeout(resolve, 50))
    })

    expect(result.current.messages[1]?.annotations?.reasoning).toBe("Let me think about this...")
  })

  it("should mark message as completed when done", async () => {
    const handlers = createMockHandlers({
      sendMessage: createStreamSpy
    })

    const { result } = renderHook(() =>
      useAIChat({
        handlers,
        selectedModel: mockModel,
        selectedSources: []
      })
    )

    await act(async () => {
      await result.current.sendMessage("test")
    })

    await act(async () => {
      mockStreamController?.enqueue({ type: "done", sequence: 0 })
      await new Promise(resolve => setTimeout(resolve, 50))
    })

    expect(result.current.messages[1]?.status).toBe("completed")
    expect(result.current.isStreaming).toBe(false)
    expect(result.current.abortController).toBeNull()
  })

  it("should handle error chunks", async () => {
    const handlers = createMockHandlers({
      sendMessage: createStreamSpy
    })

    const onError = jest.fn()
    const handlersWithError = { ...handlers, onError }

    const { result } = renderHook(() =>
      useAIChat({
        handlers: handlersWithError,
        selectedModel: mockModel,
        selectedSources: []
      })
    )

    await act(async () => {
      await result.current.sendMessage("test")
    })

    await act(async () => {
      mockStreamController?.enqueue({
        type: "error",
        error: "Something went wrong",
        sequence: 0
      })
      await new Promise(resolve => setTimeout(resolve, 50))
    })

    expect(result.current.messages[1]?.status).toBe("error")
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe("Something went wrong")
    expect(onError).toHaveBeenCalled()
  })

  it("should stop streaming when stopStreaming is called", async () => {
    const handlers = createMockHandlers({
      sendMessage: createStreamSpy
    })

    const stopSpy = jest.fn()
    const handlersWithStop = { ...handlers, stopStreaming: stopSpy }

    const { result } = renderHook(() =>
      useAIChat({
        handlers: handlersWithStop,
        selectedModel: mockModel,
        selectedSources: []
      })
    )

    await act(async () => {
      await result.current.sendMessage("test")
    })

    expect(result.current.abortController).not.toBeNull()

    act(() => {
      result.current.stopStreaming()
    })

    expect(stopSpy).toHaveBeenCalled()
    expect(result.current.messages[1]?.status).toBe("stopped")
    expect(result.current.isStreaming).toBe(false)
  })

  it("should clear error when clearError is called", async () => {
    const handlers = createMockHandlers({
      sendMessage: createStreamSpy
    })

    const { result } = renderHook(() =>
      useAIChat({
        handlers,
        selectedModel: mockModel,
        selectedSources: []
      })
    )

    await act(async () => {
      await result.current.sendMessage("test")
    })

    await act(async () => {
      mockStreamController?.enqueue({
        type: "error",
        error: "Error",
        sequence: 0
      })
      await new Promise(resolve => setTimeout(resolve, 50))
    })

    expect(result.current.error).not.toBeNull()

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })

  it("should clear all messages when clearMessages is called", async () => {
    const handlers = createMockHandlers({
      sendMessage: createStreamSpy
    })

    const { result } = renderHook(() =>
      useAIChat({
        handlers,
        selectedModel: mockModel,
        selectedSources: []
      })
    )

    await act(async () => {
      await result.current.sendMessage("test1")
      await result.current.sendMessage("test2")
    })

    expect(result.current.messages).toHaveLength(4) // 2 user + 2 assistant

    act(() => {
      result.current.clearMessages()
    })

    expect(result.current.messages).toHaveLength(0)
  })

  it("should regenerate response by removing subsequent messages", async () => {
    const handlers = createMockHandlers({
      sendMessage: createStreamSpy,
      regenerateResponse: createStreamSpy
    })

    const { result } = renderHook(() =>
      useAIChat({
        handlers,
        selectedModel: mockModel,
        selectedSources: []
      })
    )

    // Send first message
    await act(async () => {
      await result.current.sendMessage("message1")
      mockStreamController?.enqueue({ type: "done", sequence: 0 })
      await new Promise(resolve => setTimeout(resolve, 50))
    })

    // Send second message
    await act(async () => {
      await result.current.sendMessage("message2")
      mockStreamController?.enqueue({ type: "done", sequence: 0 })
      await new Promise(resolve => setTimeout(resolve, 50))
    })

    expect(result.current.messages).toHaveLength(4) // 2 user + 2 assistant

    // Regenerate from first assistant message
    await act(async () => {
      await result.current.regenerateResponse(result.current.messages[1]!.id)
    })

    // Should remove messages after the first assistant message
    expect(result.current.messages).toHaveLength(2) // First user + new assistant streaming
  })
})
