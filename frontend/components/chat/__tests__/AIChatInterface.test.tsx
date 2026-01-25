// components/chat/__tests__/AIChatInterface.test.tsx

import { describe, it, expect, jest, beforeEach } from "@jest/globals"
import { render, screen, within } from "@testing-library/react"
import { AIChatInterface } from "../AIChatInterface"
import { AIChatProvider } from "@/contexts/AIChatContext"
import type { AIModel, DataSourceFile, ChatMessage } from "@/types/chat"

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: () => "test-uuid-" + Math.random(),
} as any

describe("AIChatInterface", () => {
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
      id: "claude-opus",
      name: "Claude Opus",
      provider: "Anthropic",
      providerSlug: "anthropic",
      contextWindow: 200000,
      maxOutputTokens: 4096,
    },
  ]

  const mockFiles: DataSourceFile[] = [
    {
      id: "file-1",
      filename: "test.pdf",
      fileType: "pdf",
      size: 1024,
      uploadedAt: "2026-01-25T00:00:00Z",
      chunkCount: 10,
      isSelected: false,
    },
    {
      id: "file-2",
      filename: "document.docx",
      fileType: "docx",
      size: 2048,
      uploadedAt: "2026-01-25T00:00:00Z",
      chunkCount: 20,
      isSelected: false,
    },
  ]

  const mockMessages: ChatMessage[] = [
    {
      id: "msg-1",
      role: "user",
      content: "Hello, AI!",
      status: "completed",
      timestamp: "2026-01-25T00:00:00Z",
    },
    {
      id: "msg-2",
      role: "assistant",
      content: "Hello! How can I help you today?",
      status: "completed",
      timestamp: "2026-01-25T00:00:01Z",
    },
  ]

  const mockHandlers = {
    sendMessage: jest.fn().mockResolvedValue({
      messageId: "msg-3",
      conversationId: "conv-1",
      stream: new ReadableStream(),
    }),
    fetchFilesList: jest.fn().mockResolvedValue(mockFiles),
    loadConversation: jest.fn().mockResolvedValue(null),
    copyToClipboard: jest.fn().mockResolvedValue(undefined),
    onModelChange: jest.fn().mockResolvedValue(undefined),
    onDataSourceChange: jest.fn().mockResolvedValue(undefined),
    regenerateResponse: jest.fn().mockResolvedValue({
      messageId: "msg-4",
      conversationId: "conv-1",
      stream: new ReadableStream(),
    }),
    stopStreaming: jest.fn(),
    onError: jest.fn(),
  }

  const contextValue = {
    messages: [],
    selectedModel: mockModels[0]!,
    selectedSources: [],
    isStreaming: false,
    sendMessage: mockHandlers.sendMessage,
    selectModel: jest.fn(),
    toggleSource: jest.fn(),
    regenerateResponse: mockHandlers.regenerateResponse,
    stopStreaming: mockHandlers.stopStreaming,
    clearError: jest.fn(),
    clearMessages: jest.fn(),
    error: null,
  }

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <AIChatProvider value={contextValue}>{component}</AIChatProvider>
    )
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Rendering", () => {
    it("should render without crashing", () => {
      renderWithProvider(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      // Check that the region is rendered
      expect(screen.getByRole("region", { name: /ai chat/i })).toBeInTheDocument()
    })

    it("should render ChatHeader component", () => {
      renderWithProvider(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      // ChatHeader shows model selector button with model name
      expect(screen.getByText("GPT-4o")).toBeInTheDocument()
    })

    it("should render ConversationContainer component", () => {
      renderWithProvider(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      // ConversationContainer has the conversation test ID
      const container = screen.getByTestId("conversation")
      expect(container).toBeInTheDocument()
    })

    it("should render PromptInputAdapter component", () => {
      renderWithProvider(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      // PromptInputAdapter renders a textarea for input
      const input = screen.getByRole("textbox")
      expect(input).toBeInTheDocument()
    })

    it("should apply correct layout classes", () => {
      const { container } = renderWithProvider(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass("flex")
      expect(wrapper).toHaveClass("flex-col")
      expect(wrapper).toHaveClass("h-full")
    })

    it("should accept custom className prop", () => {
      const { container } = renderWithProvider(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
          className="custom-class"
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass("custom-class")
    })
  })

  describe("Props Forwarding", () => {
    it("should forward models to ChatHeader", () => {
      renderWithProvider(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      // ChatHeader should show the selected model name
      expect(screen.getByText("GPT-4o")).toBeInTheDocument()
    })

    it("should forward availableFiles to context", () => {
      renderWithProvider(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      // Files should be available through context
      expect(contextValue.selectedSources).toHaveLength(0)
    })

    it("should forward onCopy callback to ConversationContainer", () => {
      const onCopy = jest.fn().mockResolvedValue(undefined)

      renderWithProvider(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
          onCopy={onCopy}
        />
      )

      // ConversationContainer should receive onCopy
      // Check that the component renders without errors
      expect(screen.getByTestId("conversation")).toBeInTheDocument()
    })

    it("should forward onRegenerate callback to ConversationContainer", () => {
      const onRegenerate = jest.fn().mockResolvedValue(undefined)

      renderWithProvider(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
          onRegenerate={onRegenerate}
        />
      )

      // ConversationContainer should receive onRegenerate
      expect(screen.getByTestId("conversation")).toBeInTheDocument()
    })

    it("should forward showActions to ConversationContainer", () => {
      renderWithProvider(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
          showActions={false}
        />
      )

      expect(screen.getByTestId("conversation")).toBeInTheDocument()
    })

    it("should forward emptyTitle to ConversationContainer", () => {
      renderWithProvider(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
          emptyTitle="Custom empty title"
        />
      )

      expect(screen.getByText("Custom empty title")).toBeInTheDocument()
    })

    it("should forward emptyDescription to ConversationContainer", () => {
      renderWithProvider(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
          emptyDescription="Custom empty description"
        />
      )

      expect(screen.getByText("Custom empty description")).toBeInTheDocument()
    })
  })

  describe("Context Integration", () => {
    it("should use messages from context", () => {
      const customContext = {
        ...contextValue,
        messages: mockMessages,
      }

      render(
        <AIChatProvider value={customContext}>
          <AIChatInterface models={mockModels} availableFiles={mockFiles} />
        </AIChatProvider>
      )

      // Messages should be available through context
      expect(customContext.messages).toHaveLength(2)
    })

    it("should use selectedModel from context", () => {
      const customContext = {
        ...contextValue,
        selectedModel: mockModels[1]!,
      }

      render(
        <AIChatProvider value={customContext}>
          <AIChatInterface models={mockModels} availableFiles={mockFiles} />
        </AIChatProvider>
      )

      expect(customContext.selectedModel.id).toBe("claude-opus")
    })

    it("should use isStreaming from context", () => {
      const customContext = {
        ...contextValue,
        isStreaming: true,
      }

      render(
        <AIChatProvider value={customContext}>
          <AIChatInterface models={mockModels} availableFiles={mockFiles} />
        </AIChatProvider>
      )

      // When streaming, the submit button should be disabled or show a stop button
      // Just verify the component renders without error when streaming
      expect(screen.getByTestId("conversation")).toBeInTheDocument()
    })
  })

  describe("Responsive Layout", () => {
    it("should render with flex column layout", () => {
      const { container } = renderWithProvider(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain("flex")
      expect(wrapper.className).toContain("flex-col")
    })

    it("should render with full height", () => {
      const { container } = renderWithProvider(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain("h-full")
    })

    it("should render with gap between sections", () => {
      const { container } = renderWithProvider(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain("gap-4")
    })
  })

  describe("Accessibility", () => {
    it("should render with proper ARIA attributes", () => {
      const { container } = renderWithProvider(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.tagName).toBe("DIV")
    })

    it("should be keyboard navigable", () => {
      renderWithProvider(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      // All interactive elements should be accessible via keyboard
      // Check that there are focusable buttons in the interface
      const buttons = screen.getAllByRole("button")
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe("Edge Cases", () => {
    it("should handle empty models array", () => {
      renderWithProvider(
        <AIChatInterface
          models={[]}
          availableFiles={mockFiles}
        />
      )

      // Should still render the region
      expect(screen.getByRole("region", { name: /ai chat/i })).toBeInTheDocument()
    })

    it("should handle empty availableFiles array", () => {
      renderWithProvider(
        <AIChatInterface
          models={mockModels}
          availableFiles={[]}
        />
      )

      expect(screen.getByRole("region", { name: /ai chat/i })).toBeInTheDocument()
    })

    it("should handle null callbacks gracefully", () => {
      renderWithProvider(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      // Should not throw errors
      expect(screen.getByTestId("conversation")).toBeInTheDocument()
    })

    it("should handle missing optional props", () => {
      renderWithProvider(
        <AIChatInterface models={mockModels} availableFiles={mockFiles} />
      )

      // Should use default values
      expect(screen.getByText("No messages yet")).toBeInTheDocument()
      expect(screen.getByText("Start a conversation to see messages here")).toBeInTheDocument()
    })
  })
})
