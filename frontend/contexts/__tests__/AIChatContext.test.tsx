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
    sendMessage: jest.fn(),
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
          <span>{context.selectedModel.name}</span>
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
      return <span>{context.selectedModel.name}</span>
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
      return <span>{context.selectedModel.name}</span>
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
})
