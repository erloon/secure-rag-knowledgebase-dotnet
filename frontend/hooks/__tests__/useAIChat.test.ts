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

  const createCompletedMockStream = () => {
    return new ReadableStream<StreamChunk>({
      start(controller) {
        controller.close()
      }
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockStreamController = null

    createStreamSpy = jest.fn().mockResolvedValue({
      messageId: "msg-assistant-1",
      conversationId: "conv-1",
      stream: createMockStream()
    })
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
    const completedStreamSpy = jest.fn().mockResolvedValue({
      messageId: "msg-assistant-1",
      conversationId: "conv-1",
      stream: createCompletedMockStream()
    })

    const handlers = createMockHandlers({
      sendMessage: completedStreamSpy
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
    // Use a completed stream to avoid timeout
    const completedStreamSpy = jest.fn().mockResolvedValue({
      messageId: "msg-assistant-1",
      conversationId: "conv-1",
      stream: createCompletedMockStream()
    })

    const handlers = createMockHandlers({
      sendMessage: completedStreamSpy
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

    // Don't await - let it start streaming
    act(() => {
      result.current.sendMessage("test")
    })

    // Wait for the message to be created
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2)
    })

    expect(result.current.messages[0]?.role).toBe("user")
    expect(result.current.messages[1]?.role).toBe("assistant")
    expect(result.current.messages[1]?.status).toBe("streaming")
    expect(result.current.isStreaming).toBe(true)
    expect(result.current.abortController).not.toBeNull()

    // Clean up by closing the stream
    act(() => {
      mockStreamController?.close()
    })
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

    // Don't await - let it start streaming
    act(() => {
      result.current.sendMessage("test")
    })

    // Wait for streaming to start
    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true)
    })

    // Simulate streaming tokens
    act(() => {
      mockStreamController?.enqueue({ type: "token", content: "Hello", sequence: 0 })
      mockStreamController?.enqueue({ type: "token", content: " there", sequence: 1 })
    })

    await waitFor(() => {
      expect(result.current.messages[1]?.content).toBe("Hello there")
    })

    // Clean up
    act(() => {
      mockStreamController?.close()
    })
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

    // Don't await - let it start streaming
    act(() => {
      result.current.sendMessage("test")
    })

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true)
    })

    const citation = createMockCitation({ document: "test.pdf" })

    act(() => {
      mockStreamController?.enqueue({
        type: "citation",
        citation,
        sequence: 0
      })
    })

    await waitFor(() => {
      expect(result.current.messages[1]?.annotations?.citations).toHaveLength(1)
    })
    expect(result.current.messages[1]?.annotations?.citations?.[0]?.document).toBe("test.pdf")

    // Clean up
    act(() => {
      mockStreamController?.close()
    })
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

    // Don't await - let it start streaming
    act(() => {
      result.current.sendMessage("test")
    })

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true)
    })

    act(() => {
      mockStreamController?.enqueue({
        type: "reasoning",
        reasoning: "Let me think about this...",
        sequence: 0
      })
    })

    await waitFor(() => {
      expect(result.current.messages[1]?.annotations?.reasoning).toBe("Let me think about this...")
    })

    // Clean up
    act(() => {
      mockStreamController?.close()
    })
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

    // Don't await - let it start streaming
    act(() => {
      result.current.sendMessage("test")
    })

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true)
    })

    act(() => {
      mockStreamController?.enqueue({ type: "done", sequence: 0 })
      mockStreamController?.close()
    })

    await waitFor(() => {
      expect(result.current.messages[1]?.status).toBe("completed")
    })
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

    // Don't await - let it start streaming
    act(() => {
      result.current.sendMessage("test")
    })

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true)
    })

    act(() => {
      mockStreamController?.enqueue({
        type: "error",
        error: "Something went wrong",
        sequence: 0
      })
      mockStreamController?.close()
    })

    await waitFor(() => {
      expect(result.current.messages[1]?.status).toBe("error")
    })
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

    // Don't await - let it start streaming
    act(() => {
      result.current.sendMessage("test")
    })

    await waitFor(() => {
      expect(result.current.abortController).not.toBeNull()
    })

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

    // Don't await - let it start streaming
    act(() => {
      result.current.sendMessage("test")
    })

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true)
    })

    act(() => {
      mockStreamController?.enqueue({
        type: "error",
        error: "Error",
        sequence: 0
      })
      mockStreamController?.close()
    })

    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
    })

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })

  it("should clear all messages when clearMessages is called", async () => {
    // Use completed streams to avoid timeout
    let streamCount = 0
    const completedStreamSpy = jest.fn().mockImplementation(() => {
      return Promise.resolve({
        messageId: `msg-assistant-${++streamCount}`,
        conversationId: "conv-1",
        stream: createCompletedMockStream()
      })
    })

    const handlers = createMockHandlers({
      sendMessage: completedStreamSpy
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
    })

    await act(async () => {
      await result.current.sendMessage("test2")
    })

    expect(result.current.messages.length).toBeGreaterThanOrEqual(2) // at least 2 messages

    act(() => {
      result.current.clearMessages()
    })

    expect(result.current.messages).toHaveLength(0)
  })

  it("should regenerate response by removing subsequent messages", async () => {
    // Use controlled streams for this test
    let streamController1: ReadableStreamDefaultController<StreamChunk> | null = null
    let streamController2: ReadableStreamDefaultController<StreamChunk> | null = null
    let streamCount = 0

    const controlledStreamSpy = jest.fn().mockImplementation(() => {
      streamCount++
      return Promise.resolve({
        messageId: `msg-assistant-${streamCount}`,
        conversationId: "conv-1",
        stream: new ReadableStream<StreamChunk>({
          start(controller) {
            if (streamCount === 1) streamController1 = controller
            else streamController2 = controller
          }
        })
      })
    })

    const handlers = createMockHandlers({
      sendMessage: controlledStreamSpy,
      regenerateResponse: controlledStreamSpy
    })

    const { result } = renderHook(() =>
      useAIChat({
        handlers,
        selectedModel: mockModel,
        selectedSources: []
      })
    )

    // Send first message
    act(() => {
      result.current.sendMessage("message1")
    })

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThanOrEqual(1)
    })

    // Complete the first stream
    act(() => {
      streamController1?.enqueue({ type: "done", sequence: 0 })
      streamController1?.close()
    })

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(false)
    })

    // Send second message
    act(() => {
      result.current.sendMessage("message2")
    })

    await waitFor(() => {
      expect(result.current.messages.length).toBeGreaterThanOrEqual(3)
    })

    // Complete the second stream
    act(() => {
      streamController2?.enqueue({ type: "done", sequence: 0 })
      streamController2?.close()
    })

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(false)
    })

    expect(result.current.messages.length).toBeGreaterThanOrEqual(4) // 2 user + 2 assistant

    // Regenerate from first assistant message
    act(() => {
      if (result.current.messages[1]) {
        result.current.regenerateResponse(result.current.messages[1].id)
      }
    })

    // Should remove messages after the first assistant message and start new streaming
    await waitFor(() => {
      expect(result.current.messages.length).toBeLessThan(4)
    })
  })
})
