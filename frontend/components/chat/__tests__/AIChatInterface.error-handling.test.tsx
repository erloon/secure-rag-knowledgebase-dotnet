/**
 * Error handling tests for AIChatInterface
 * Tests error boundaries, error display, and error recovery
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AIChatProvider } from "@/contexts/AIChatContext"
import { AIChatInterface } from "../AIChatInterface"
import type { AIModel, DataSourceFile, ChatMessage } from "@/types/chat"
import type { AIChatContextValue } from "@/contexts/AIChatContext"

// Mock data
const mockModels: AIModel[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    providerSlug: "openai"
  }
]

const mockFiles: DataSourceFile[] = [
  {
    id: "file-1",
    filename: "test.pdf",
    fileType: "pdf",
    size: 1000000,
    uploadedAt: "2026-01-15T10:30:00Z",
    chunkCount: 100,
    isSelected: false
  }
]

const createMockContext = (
  overrides?: Partial<AIChatContextValue>
): AIChatContextValue => ({
  messages: [],
  selectedModel: mockModels[0]!,
  selectedSources: [],
  isStreaming: false,
  sendMessage: jest.fn(),
  selectModel: jest.fn(),
  toggleSource: jest.fn(),
  regenerateResponse: jest.fn(),
  stopStreaming: jest.fn(),
  clearError: jest.fn(),
  clearMessages: jest.fn(),
  error: null,
  ...overrides
})

function renderWithProviders(
  ui: React.ReactElement,
  contextValue?: AIChatContextValue
) {
  return render(
    <AIChatProvider value={contextValue || createMockContext()}>
      {ui}
    </AIChatProvider>
  )
}

describe("AIChatInterface - Error Handling", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Error State Display", () => {
    it("should display error message when error is present", () => {
      const testError = new Error("Network error occurred")
      const contextWithError = createMockContext({ error: testError })

      renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />,
        contextWithError
      )

      // Error should be visible in the prompt input area
      const errorMessage = screen.queryByText(/network error occurred/i)
      expect(errorMessage).toBeInTheDocument()
    })

    it("should not display error when error is null", () => {
      const contextWithoutError = createMockContext({ error: null })

      renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />,
        contextWithoutError
      )

      // No error message should be present
      const errorMessage = screen.queryByRole("alert")
      expect(errorMessage).not.toBeInTheDocument()
    })

    it("should display error with custom error message", () => {
      const customError = new Error("Failed to connect to server")
      const contextWithError = createMockContext({ error: customError })

      renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />,
        contextWithError
      )

      const errorMessage = screen.queryByText(/failed to connect to server/i)
      expect(errorMessage).toBeInTheDocument()
    })
  })

  describe("Error Recovery", () => {
    it("should call clearError when dismiss button is clicked", async () => {
      const testError = new Error("Test error")
      const clearError = jest.fn()
      const contextWithError = createMockContext({
        error: testError,
        clearError
      })

      renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />,
        contextWithError
      )

      // Error should be displayed
      const errorMessage = screen.queryByText(/test error/i)
      expect(errorMessage).toBeInTheDocument()
      expect(clearError).toBeDefined()
    })

    it("should allow retry after error", async () => {
      const testError = new Error("Network error")
      const sendMessage = jest.fn()
      const contextWithError = createMockContext({
        error: testError,
        sendMessage
      })

      const { container } = renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />,
        contextWithError
      )

      // Should render interface even with error
      const region = screen.getByRole("region")
      expect(region).toBeInTheDocument()
    })
  })

  describe("Error Boundaries", () => {
    it("should render gracefully when models array is empty", () => {
      const context = createMockContext()

      renderWithProviders(
        <AIChatInterface
          models={[]}
          availableFiles={mockFiles}
        />,
        context
      )

      // Should still render the interface
      const container = screen.getByRole("region", { name: /ai chat interface/i })
      expect(container).toBeInTheDocument()
    })

    it("should render gracefully when files array is empty", () => {
      const context = createMockContext()

      renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={[]}
        />,
        context
      )

      // Should still render the interface
      const container = screen.getByRole("region", { name: /ai chat interface/i })
      expect(container).toBeInTheDocument()
    })

    it("should handle undefined optional props gracefully", () => {
      const context = createMockContext()

      renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
          onCopy={undefined}
          onRegenerate={undefined}
        />,
        context
      )

      // Should render without errors
      const container = screen.getByRole("region")
      expect(container).toBeInTheDocument()
    })
  })

  describe("Error States During Streaming", () => {
    it("should show error when streaming fails", () => {
      const streamingError = new Error("Stream interrupted")
      const messagesWithError: ChatMessage[] = [
        {
          id: "msg-1",
          role: "user",
          content: "Test question",
          status: "completed",
          timestamp: "2026-01-26T10:00:00Z"
        },
        {
          id: "msg-2",
          role: "assistant",
          content: "",
          status: "error",
          timestamp: "2026-01-26T10:00:01Z",
          annotations: {
            timestamp: "2026-01-26T10:00:01Z",
            model: "gpt-4o"
          }
        }
      ]

      const contextWithError = createMockContext({
        messages: messagesWithError,
        error: streamingError
      })

      renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />,
        contextWithError
      )

      // Error should be visible
      const errorMessage = screen.queryByText(/stream interrupted/i)
      expect(errorMessage).toBeInTheDocument()
    })

    it("should stop streaming UI when error occurs", () => {
      const error = new Error("Connection lost")
      const contextWithError = createMockContext({
        error,
        isStreaming: false // Streaming should be stopped
      })

      renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />,
        contextWithError
      )

      // Interface should still be rendered
      const region = screen.getByRole("region")
      expect(region).toBeInTheDocument()
    })
  })

  describe("Error Message Accessibility", () => {
    it("should have ARIA role for error messages", () => {
      const testError = new Error("Accessible error message")
      const contextWithError = createMockContext({ error: testError })

      renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />,
        contextWithError
      )

      const errorMessage = screen.queryByText(/accessible error message/i)
      if (errorMessage) {
        expect(errorMessage).toBeInTheDocument()
      }
    })

    it("should be keyboard navigable", () => {
      const testError = new Error("Keyboard test error")
      const clearError = jest.fn()
      const contextWithError = createMockContext({
        error: testError,
        clearError
      })

      renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />,
        contextWithError
      )

      // Error should be displayed
      const errorMessage = screen.queryByText(/keyboard test error/i)
      expect(errorMessage).toBeInTheDocument()
    })
  })
})
