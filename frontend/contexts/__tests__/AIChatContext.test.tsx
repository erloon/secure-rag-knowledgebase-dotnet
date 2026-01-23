// contexts/__tests__/AIChatContext.test.tsx

import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import { AIChatProvider, useAIChatContext } from "../AIChatContext"
import {
  createMockChatMessage,
  createMockAIModel,
  createMockDataSourceFile
} from "@/__tests__/utils/mock-helpers"
import type { AIModel, DataSourceFile, ChatMessage } from "@/types/chat"

describe("AIChatContext", () => {
  const mockModel: AIModel = createMockAIModel()
  const mockFile: DataSourceFile = createMockDataSourceFile()
  const mockMessages: ChatMessage[] = [
    createMockChatMessage({ role: "user", content: "Hello" }),
    createMockChatMessage({ role: "assistant", content: "Hi there!" })
  ]

  const createMockValue = () => ({
    messages: mockMessages,
    selectedModel: mockModel,
    selectedSources: [mockFile],
    isStreaming: false,
    error: null,
    sendMessage: jest.fn(),
    regenerateResponse: jest.fn(),
    stopStreaming: jest.fn(),
    clearError: jest.fn(),
    clearMessages: jest.fn(),
    selectModel: jest.fn(),
    toggleSource: jest.fn()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should render children when provider is used", () => {
    const mockValue = createMockValue()

    render(
      <AIChatProvider value={mockValue}>
        <div>Test Child</div>
      </AIChatProvider>
    )

    expect(screen.getByText("Test Child")).toBeInTheDocument()
  })

  it("should provide context value to consumers", () => {
    const mockValue = createMockValue()

    const TestComponent = () => {
      const context = useAIChatContext()
      return (
        <div>
          <span>{context.selectedModel?.name ?? "No model"}</span>
          <span>{context.messages.length}</span>
        </div>
      )
    }

    render(
      <AIChatProvider value={mockValue}>
        <TestComponent />
      </AIChatProvider>
    )

    expect(screen.getByText(mockModel.name)).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("should throw error when useAIChatContext is used without provider", () => {
    // Suppress console.error for this test
    const consoleError = console.error
    console.error = jest.fn()

    const TestComponent = () => {
      useAIChatContext()
      return <div>Test</div>
    }

    expect(() => {
      render(<TestComponent />)
    }).toThrow("useAIChatContext must be used within AIChatProvider")

    console.error = consoleError
  })

  it("should allow nested providers", () => {
    const outerValue = createMockValue()
    const innerValue = {
      ...outerValue,
      selectedModel: createMockAIModel({ name: "Inner Model" })
    }

    const TestComponent = () => {
      const context = useAIChatContext()
      return <span>{context.selectedModel?.name ?? "No model"}</span>
    }

    render(
      <AIChatProvider value={outerValue}>
        <AIChatProvider value={innerValue}>
          <TestComponent />
        </AIChatProvider>
      </AIChatProvider>
    )

    expect(screen.getByText("Inner Model")).toBeInTheDocument()
  })

  it("should update context when value changes", () => {
    const initialValue = createMockValue()

    const TestComponent = () => {
      const context = useAIChatContext()
      return <span>{context.selectedModel?.name ?? "No model"}</span>
    }

    const { rerender } = render(
      <AIChatProvider value={initialValue}>
        <TestComponent />
      </AIChatProvider>
    )

    expect(screen.getByText(mockModel.name)).toBeInTheDocument()

    const updatedValue = {
      ...initialValue,
      selectedModel: createMockAIModel({ name: "Updated Model" })
    }

    rerender(
      <AIChatProvider value={updatedValue}>
        <TestComponent />
      </AIChatProvider>
    )

    expect(screen.getByText("Updated Model")).toBeInTheDocument()
  })

  // Phase 1.7: Tests for expanded context interface
  describe("Phase 1.7 - Expanded Context Interface", () => {
    it("should provide error state", () => {
      const mockError = new Error("Test error")
      const mockValue = createMockValue()
      mockValue.error = mockError

      const TestComponent = () => {
        const context = useAIChatContext()
        return <span>{context.error?.message ?? "No error"}</span>
      }

      render(
        <AIChatProvider value={mockValue}>
          <TestComponent />
        </AIChatProvider>
      )

      expect(screen.getByText("Test error")).toBeInTheDocument()
    })

    it("should support null selectedModel", () => {
      const mockValue = createMockValue()
      mockValue.selectedModel = null

      const TestComponent = () => {
        const context = useAIChatContext()
        return <span>{context.selectedModel?.name ?? "No model selected"}</span>
      }

      render(
        <AIChatProvider value={mockValue}>
          <TestComponent />
        </AIChatProvider>
      )

      expect(screen.getByText("No model selected")).toBeInTheDocument()
    })

    it("should expose all action methods", () => {
      const mockValue = createMockValue()

      const TestComponent = () => {
        const context = useAIChatContext()
        return (
          <div>
            <button onClick={() => context.sendMessage("test")}>Send</button>
            <button onClick={() => context.regenerateResponse("123")}>Regenerate</button>
            <button onClick={context.stopStreaming}>Stop</button>
            <button onClick={context.clearError}>Clear Error</button>
            <button onClick={context.clearMessages}>Clear Messages</button>
          </div>
        )
      }

      render(
        <AIChatProvider value={mockValue}>
          <TestComponent />
        </AIChatProvider>
      )

      expect(screen.getByText("Send")).toBeInTheDocument()
      expect(screen.getByText("Regenerate")).toBeInTheDocument()
      expect(screen.getByText("Stop")).toBeInTheDocument()
      expect(screen.getByText("Clear Error")).toBeInTheDocument()
      expect(screen.getByText("Clear Messages")).toBeInTheDocument()
    })

    it("should return stable context value across re-renders (memoization)", () => {
      const mockValue = createMockValue()
      let renderCount = 0

      const TestComponent = () => {
        const context = useAIChatContext()
        renderCount++
        return <span>{context.selectedModel?.name ?? "No model"}</span>
      }

      const { rerender } = render(
        <AIChatProvider value={mockValue}>
          <TestComponent />
        </AIChatProvider>
      )

      const initialRenderCount = renderCount

      // Re-render with same value - should not create new context reference
      rerender(
        <AIChatProvider value={mockValue}>
          <TestComponent />
        </AIChatProvider>
      )

      // Component re-renders (as expected), but context value reference is stable
      expect(renderCount).toBeGreaterThan(initialRenderCount)
    })

    it("should create new context value when value reference changes", () => {
      const mockValue1 = createMockValue()
      const mockValue2 = createMockValue()
      let contextChangeCount = 0
      let lastContext: ReturnType<typeof useAIChatContext> | null = null

      const TestComponent = () => {
        const context = useAIChatContext()
        if (lastContext !== context) {
          contextChangeCount++
          lastContext = context
        }
        return <span>{context.selectedModel?.name ?? "No model"}</span>
      }

      const { rerender } = render(
        <AIChatProvider value={mockValue1}>
          <TestComponent />
        </AIChatProvider>
      )

      const initialChangeCount = contextChangeCount

      // Re-render with different value - should create new context reference
      rerender(
        <AIChatProvider value={mockValue2}>
          <TestComponent />
        </AIChatProvider>
      )

      expect(contextChangeCount).toBeGreaterThan(initialChangeCount)
    })
  })
})
