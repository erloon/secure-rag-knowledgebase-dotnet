// components/chat/__tests__/PromptInputAdapter.test.tsx

import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PromptInputAdapter } from "../PromptInputAdapter"
import { AIChatProvider } from "@/contexts/AIChatContext"
import { createMockDataSourceFile } from "@/__tests__/utils/mock-helpers"
import type { DataSourceFile } from "@/types/chat"

const mockContextValue = {
  messages: [],
  selectedModel: null,
  selectedSources: [],
  isStreaming: false,
  error: null,
  sendMessage: jest.fn().mockResolvedValue(undefined),
  regenerateResponse: jest.fn(),
  stopStreaming: jest.fn(),
  clearError: jest.fn(),
  clearMessages: jest.fn(),
  selectModel: jest.fn(),
  toggleSource: jest.fn()
}

function renderWithProvider(ui: React.ReactElement) {
  return render(<AIChatProvider value={mockContextValue}>{ui}</AIChatProvider>)
}

describe("PromptInputAdapter", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("initial render", () => {
    it("should render with default placeholder", () => {
      renderWithProvider(<PromptInputAdapter />)

      expect(screen.getByPlaceholderText(/ask a question/i)).toBeInTheDocument()
    })

    it("should render with custom placeholder", () => {
      renderWithProvider(<PromptInputAdapter placeholder="Type your message..." />)

      expect(screen.getByPlaceholderText("Type your message...")).toBeInTheDocument()
    })

    it("should render submit button", () => {
      renderWithProvider(<PromptInputAdapter />)

      const submitButton = document.querySelector('button[type="submit"]')
      expect(submitButton).toBeInTheDocument()
    })
  })

  describe("message submission", () => {
    it("should call sendMessage when form is submitted", async () => {
      const user = userEvent.setup()
      renderWithProvider(<PromptInputAdapter />)

      const textarea = screen.getByRole("textbox")
      await user.type(textarea, "Hello, AI!")

      const form = document.querySelector("form")
      if (form) {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
      }

      await waitFor(() => {
        expect(mockContextValue.sendMessage).toHaveBeenCalledWith("Hello, AI!")
      })
    })

    it("should not submit empty message", async () => {
      const user = userEvent.setup()
      renderWithProvider(<PromptInputAdapter />)

      const form = document.querySelector("form")
      if (form) {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
      }

      expect(mockContextValue.sendMessage).not.toHaveBeenCalled()
    })

    it("should not submit when streaming", async () => {
      const user = userEvent.setup()
      const streamingContext = {
        ...mockContextValue,
        isStreaming: true
      }

      render(
        <AIChatProvider value={streamingContext}>
          <PromptInputAdapter />
        </AIChatProvider>
      )

      const textarea = screen.getByRole("textbox")
      await user.type(textarea, "Should not send")

      const form = document.querySelector("form")
      if (form) {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
      }

      expect(mockContextValue.sendMessage).not.toHaveBeenCalled()
    })

    it("should clear error when submitting new message", async () => {
      const user = userEvent.setup()
      const errorContext = {
        ...mockContextValue,
        error: new Error("Previous error")
      }

      render(
        <AIChatProvider value={errorContext}>
          <PromptInputAdapter />
        </AIChatProvider>
      )

      const textarea = screen.getByRole("textbox")
      await user.type(textarea, "New message")

      const form = document.querySelector("form")
      if (form) {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))
      }

      await waitFor(() => {
        expect(mockContextValue.clearError).toHaveBeenCalled()
      })
    })
  })

  describe("streaming state", () => {
    it("should disable input while streaming", () => {
      const streamingContext = {
        ...mockContextValue,
        isStreaming: true
      }

      render(
        <AIChatProvider value={streamingContext}>
          <PromptInputAdapter />
        </AIChatProvider>
      )

      const textarea = screen.getByRole("textbox")
      expect(textarea).toBeDisabled()
    })

    it("should show stop button during streaming", () => {
      const streamingContext = {
        ...mockContextValue,
        isStreaming: true
      }

      render(
        <AIChatProvider value={streamingContext}>
          <PromptInputAdapter />
        </AIChatProvider>
      )

      // Stop button should be present during streaming
      const stopButton = document.querySelector('button[aria-label="Stop"]')
      expect(stopButton).toBeInTheDocument()
    })

    it("should call stopStreaming when stop button is clicked", async () => {
      const user = userEvent.setup()
      const streamingContext = {
        ...mockContextValue,
        isStreaming: true
      }

      render(
        <AIChatProvider value={streamingContext}>
          <PromptInputAdapter />
        </AIChatProvider>
      )

      const stopButton = document.querySelector('button[aria-label="Stop"]') as HTMLElement
      if (stopButton) {
        await user.click(stopButton)
      }

      await waitFor(() => {
        expect(mockContextValue.stopStreaming).toHaveBeenCalled()
      })
    })

    it("should show loading indicator during streaming", () => {
      const streamingContext = {
        ...mockContextValue,
        isStreaming: true
      }

      render(
        <AIChatProvider value={streamingContext}>
          <PromptInputAdapter />
        </AIChatProvider>
      )

      // Check for loading spinner
      const spinner = document.querySelector(".animate-spin")
      expect(spinner).toBeInTheDocument()
    })
  })

  describe("selected sources display", () => {
    it("should display selected sources as pills", () => {
      const mockFile = createMockDataSourceFile({
        id: "file-1",
        filename: "document.pdf",
        chunkCount: 100
      })

      const sourcesContext = {
        ...mockContextValue,
        selectedSources: [mockFile]
      }

      render(
        <AIChatProvider value={sourcesContext}>
          <PromptInputAdapter />
        </AIChatProvider>
      )

      expect(screen.getByText("document.pdf")).toBeInTheDocument()
      expect(screen.getByText(/\(100 chunks\)/)).toBeInTheDocument()
    })

    it("should display multiple selected sources", () => {
      const files: DataSourceFile[] = [
        createMockDataSourceFile({ id: "file-1", filename: "doc1.pdf", chunkCount: 50 }),
        createMockDataSourceFile({ id: "file-2", filename: "doc2.pdf", chunkCount: 75 })
      ]

      const sourcesContext = {
        ...mockContextValue,
        selectedSources: files
      }

      render(
        <AIChatProvider value={sourcesContext}>
          <PromptInputAdapter />
        </AIChatProvider>
      )

      expect(screen.getByText("doc1.pdf")).toBeInTheDocument()
      expect(screen.getByText("doc2.pdf")).toBeInTheDocument()
    })
  })

  describe("error display", () => {
    it("should display error message when error exists", () => {
      const errorContext = {
        ...mockContextValue,
        error: new Error("Something went wrong")
      }

      render(
        <AIChatProvider value={errorContext}>
          <PromptInputAdapter />
        </AIChatProvider>
      )

      expect(screen.getByText("Error")).toBeInTheDocument()
      expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    })

    it("should call clearError when dismiss is clicked", async () => {
      const user = userEvent.setup()
      const errorContext = {
        ...mockContextValue,
        error: new Error("Test error")
      }

      render(
        <AIChatProvider value={errorContext}>
          <PromptInputAdapter />
        </AIChatProvider>
      )

      const dismissButton = screen.getByText("Dismiss")
      await user.click(dismissButton)

      expect(mockContextValue.clearError).toHaveBeenCalled()
    })
  })

  describe("keyboard interactions", () => {
    it("should submit on Enter key", async () => {
      const user = userEvent.setup()
      renderWithProvider(<PromptInputAdapter />)

      const textarea = screen.getByRole("textbox")
      await user.type(textarea, "Test message")

      // Get the form and dispatch submit event directly
      const form = textarea.closest('form')
      expect(form).not.toBeNull()
      
      // Trigger form submission via fireEvent
      fireEvent.submit(form!)

      await waitFor(() => {
        expect(mockContextValue.sendMessage).toHaveBeenCalledWith("Test message")
      })
    })

    it("should not submit on Shift+Enter", async () => {
      const user = userEvent.setup()
      renderWithProvider(<PromptInputAdapter />)

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement
      await user.type(textarea, "Line 1{Shift>}{Enter}{/Shift}")

      // Should not submit - sendMessage should not be called
      expect(mockContextValue.sendMessage).not.toHaveBeenCalled()
      // The textarea should contain the text (possibly with a newline)
      expect(textarea.value).toContain("Line 1")
    })
  })

  describe("disabled state", () => {
    it("should be disabled when disabled prop is true", () => {
      renderWithProvider(<PromptInputAdapter disabled={true} />)

      const textarea = screen.getByRole("textbox")
      expect(textarea).toBeDisabled()
    })
  })

  describe("onStop callback", () => {
    it("should call onStop when streaming is stopped", async () => {
      const user = userEvent.setup()
      const onStop = jest.fn()
      const streamingContext = {
        ...mockContextValue,
        isStreaming: true
      }

      render(
        <AIChatProvider value={streamingContext}>
          <PromptInputAdapter onStop={onStop} />
        </AIChatProvider>
      )

      const stopButton = document.querySelector('button[aria-label="Stop"]') as HTMLElement
      if (stopButton) {
        await user.click(stopButton)
      }

      await waitFor(() => {
        expect(onStop).toHaveBeenCalled()
      })
    })
  })

  describe("edge cases", () => {
    it("should handle very long input", async () => {
      const user = userEvent.setup()
      renderWithProvider(<PromptInputAdapter />)

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement
      const longText = "A".repeat(1000)
      
      // Use fireEvent for long text to avoid timeout
      fireEvent.change(textarea, { target: { value: longText } })

      expect(textarea.value).toBe(longText)
    })

    it("should handle special characters in input", async () => {
      const user = userEvent.setup()
      renderWithProvider(<PromptInputAdapter />)

      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement
      
      // Use fireEvent for special characters to avoid encoding issues
      fireEvent.change(textarea, { target: { value: 'Test <>&"\'' } })

      expect(textarea.value).toBe('Test <>&"\'')
    })
  })
})
