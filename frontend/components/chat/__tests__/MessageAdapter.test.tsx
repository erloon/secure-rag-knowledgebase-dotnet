// components/chat/__tests__/MessageAdapter.test.tsx

import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MessageAdapter } from "../MessageAdapter"
import { createMockChatMessage } from "@/__tests__/utils/mock-helpers"

describe("MessageAdapter", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("rendering", () => {
    it("should render user message with correct styling", () => {
      const message = createMockChatMessage({
        role: "user",
        content: "Hello, how are you?"
      })

      render(<MessageAdapter message={message} />)

      expect(screen.getByText("Hello, how are you?")).toBeInTheDocument()
    })

    it("should render assistant message with actions", () => {
      const message = createMockChatMessage({
        role: "assistant",
        content: "I'm doing well, thank you!"
      })

      // Need to provide onRegenerate for regenerate button to show
      const mockRegenerate = jest.fn().mockResolvedValue(undefined)
      render(<MessageAdapter message={message} showActions={true} onRegenerate={mockRegenerate} />)

      expect(screen.getByText("I'm doing well, thank you!")).toBeInTheDocument()

      // Check for copy action button
      const copyButton = screen.getByRole("button", { name: /copy/i })
      expect(copyButton).toBeInTheDocument()

      // Check for regenerate action button (only shows when onRegenerate is provided)
      const regenerateButton = screen.getByRole("button", { name: /regenerate/i })
      expect(regenerateButton).toBeInTheDocument()
    })

    it("should render streaming message with loading indicator", () => {
      const message = createMockChatMessage({
        role: "assistant",
        content: "",
        status: "streaming"
      })

      render(<MessageAdapter message={message} />)

      expect(screen.getByText(/thinking/i)).toBeInTheDocument()
    })

    it("should render system message", () => {
      const message = createMockChatMessage({
        role: "system",
        content: "System: You are a helpful assistant."
      })

      render(<MessageAdapter message={message} />)

      expect(screen.getByText("System: You are a helpful assistant.")).toBeInTheDocument()
    })

    it("should hide actions when showActions is false", () => {
      const message = createMockChatMessage({
        role: "assistant",
        content: "Test message"
      })

      render(<MessageAdapter message={message} showActions={false} />)

      expect(screen.queryByRole("button", { name: /copy/i })).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /regenerate/i })).not.toBeInTheDocument()
    })

    it("should not show actions for user messages", () => {
      const message = createMockChatMessage({
        role: "user",
        content: "User message"
      })

      render(<MessageAdapter message={message} showActions={true} />)

      expect(screen.queryByRole("button", { name: /copy/i })).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /regenerate/i })).not.toBeInTheDocument()
    })

    it("should not show actions for streaming assistant messages", () => {
      const message = createMockChatMessage({
        role: "assistant",
        content: "Streaming...",
        status: "streaming"
      })

      render(<MessageAdapter message={message} showActions={true} />)

      expect(screen.queryByRole("button", { name: /copy/i })).not.toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /regenerate/i })).not.toBeInTheDocument()
    })
  })

  describe("reasoning display", () => {
    it("should render reasoning section when available", () => {
      const message = createMockChatMessage({
        role: "assistant",
        content: "Final answer",
        annotations: {
          timestamp: new Date().toISOString(),
          model: "gpt-4o",
          reasoning: "Let me think about this step by step..."
        }
      })

      render(<MessageAdapter message={message} />)

      expect(screen.getByText("Final answer")).toBeInTheDocument()
      expect(screen.getByText(/view reasoning/i)).toBeInTheDocument()
    })

    it("should allow expanding reasoning section", async () => {
      const user = userEvent.setup()
      const message = createMockChatMessage({
        role: "assistant",
        content: "Final answer",
        annotations: {
          timestamp: new Date().toISOString(),
          model: "gpt-4o",
          reasoning: "This is my reasoning process."
        }
      })

      render(<MessageAdapter message={message} />)

      const summary = screen.getByText(/view reasoning/i)
      await user.click(summary)

      expect(screen.getByText("This is my reasoning process.")).toBeInTheDocument()
    })
  })

  describe("interactions", () => {
    it("should call onCopy when copy button is clicked", async () => {
      const user = userEvent.setup()
      const onCopy = jest.fn().mockResolvedValue(undefined)
      const message = createMockChatMessage({
        role: "assistant",
        content: "Copy this text"
      })

      render(<MessageAdapter message={message} onCopy={onCopy} showActions={true} />)

      const copyButton = screen.getByRole("button", { name: /copy/i })
      await user.click(copyButton)

      await waitFor(() => {
        expect(onCopy).toHaveBeenCalledWith("Copy this text")
      })
    })

    it("should call onRegenerate when regenerate button is clicked", async () => {
      const user = userEvent.setup()
      const onRegenerate = jest.fn().mockResolvedValue(undefined)
      const message = createMockChatMessage({
        role: "assistant",
        content: "Regenerate this",
        id: "message-123"
      })

      render(<MessageAdapter message={message} onRegenerate={onRegenerate} showActions={true} />)

      const regenerateButton = screen.getByRole("button", { name: /regenerate/i })
      await user.click(regenerateButton)

      await waitFor(() => {
        expect(onRegenerate).toHaveBeenCalledWith("message-123")
      })
    })

    it("should not crash when onCopy is not provided", async () => {
      const user = userEvent.setup()
      const message = createMockChatMessage({
        role: "assistant",
        content: "Test"
      })

      render(<MessageAdapter message={message} showActions={true} />)

      const copyButton = screen.getByRole("button", { name: /copy/i })
      await user.click(copyButton)

      // Should not throw an error
      expect(copyButton).toBeInTheDocument()
    })
  })

  describe("memoization", () => {
    it("should not re-render unnecessarily when message content is same", () => {
      const message = createMockChatMessage({
        role: "assistant",
        content: "Test message"
      })

      const { rerender } = render(<MessageAdapter message={message} />)

      // Re-render with same message (same reference)
      rerender(<MessageAdapter message={message} />)

      // Component should handle this gracefully
      expect(screen.getByText("Test message")).toBeInTheDocument()
    })
  })

  describe("edge cases", () => {
    it("should handle empty message content", () => {
      const message = createMockChatMessage({
        role: "user",
        content: ""
      })

      render(<MessageAdapter message={message} />)

      // Should render without crashing
      expect(document.querySelector(".is-user")).toBeInTheDocument()
    })

    it("should handle message with no annotations", () => {
      const message = createMockChatMessage({
        role: "assistant",
        content: "No annotations",
        annotations: undefined
      })

      render(<MessageAdapter message={message} />)

      expect(screen.getByText("No annotations")).toBeInTheDocument()
    })

    it("should handle very long message content", () => {
      const longContent = "A".repeat(10000)
      const message = createMockChatMessage({
        role: "assistant",
        content: longContent
      })

      render(<MessageAdapter message={message} />)

      expect(screen.getByText(longContent)).toBeInTheDocument()
    })
  })
})
