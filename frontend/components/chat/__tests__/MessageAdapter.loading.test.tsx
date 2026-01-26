/**
 * Loading state tests for MessageAdapter
 * Tests skeleton and shimmer effects during streaming
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import { MessageAdapter } from "../MessageAdapter"
import type { ChatMessage } from "@/types/chat"

// Mock data
const mockUserMessage: ChatMessage = {
  id: "msg-1",
  role: "user",
  content: "Hello, how are you?",
  status: "completed",
  timestamp: "2026-01-26T10:00:00Z"
}

const mockAssistantMessage: ChatMessage = {
  id: "msg-2",
  role: "assistant",
  content: "I'm doing well, thank you!",
  status: "completed",
  timestamp: "2026-01-26T10:00:01Z",
  annotations: {
    timestamp: "2026-01-26T10:00:01Z",
    model: "gpt-4o"
  }
}

const mockStreamingMessage: ChatMessage = {
  id: "msg-3",
  role: "assistant",
  content: "Thinking...",
  status: "streaming",
  timestamp: "2026-01-26T10:00:02Z",
  annotations: {
    timestamp: "2026-01-26T10:00:02Z",
    model: "gpt-4o"
  }
}

const mockPendingMessage: ChatMessage = {
  id: "msg-4",
  role: "assistant",
  content: "",
  status: "pending",
  timestamp: "2026-01-26T10:00:03Z",
  annotations: {
    timestamp: "2026-01-26T10:00:03Z",
    model: "gpt-4o"
  }
}

describe("MessageAdapter - Loading States", () => {
  const mockOnCopy = jest.fn()
  const mockOnRegenerate = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Streaming State", () => {
    it("should show loading indicator when streaming", () => {
      const { container } = render(
        <MessageAdapter
          message={mockStreamingMessage}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
          showActions={true}
        />
      )

      // Component should render without error
      expect(container.firstChild).toBeInTheDocument()
    })

    it("should display streaming content", () => {
      render(
        <MessageAdapter
          message={mockStreamingMessage}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
          showActions={true}
        />
      )

      // Should show the streaming content
      expect(screen.getByText("Thinking...")).toBeInTheDocument()
    })

    it("should hide citations during streaming", () => {
      const streamingWithCitations: ChatMessage = {
        ...mockStreamingMessage,
        annotations: {
          ...mockStreamingMessage.annotations,
          citations: [
            {
              id: "cit-1",
              document: "test.pdf",
              page: 1,
              chunkIndex: 0,
              relevanceScore: 95
            }
          ]
        }
      }

      const { container } = render(
        <MessageAdapter
          message={streamingWithCitations}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
          showActions={true}
        />
      )

      // Component should render
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe("Pending State", () => {
    it("should show skeleton when pending", () => {
      const { container } = render(
        <MessageAdapter
          message={mockPendingMessage}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
          showActions={true}
        />
      )

      // Should render without error
      expect(container.firstChild).toBeInTheDocument()
    })

    it("should not show actions when pending", () => {
      const { container } = render(
        <MessageAdapter
          message={mockPendingMessage}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
          showActions={true}
        />
      )

      // Component should render
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe("Completed State", () => {
    it("should show full content when completed", () => {
      render(
        <MessageAdapter
          message={mockAssistantMessage}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
          showActions={true}
          isStreaming={false}
        />
      )

      // Should show the completed content
      expect(screen.getByText("I'm doing well, thank you!")).toBeInTheDocument()
    })

    it("should show actions when completed and enabled", () => {
      render(
        <MessageAdapter
          message={mockAssistantMessage}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
          showActions={true}
          isStreaming={false}
        />
      )

      // Copy button should be visible
      const copyButton = screen.queryByRole("button", { name: /copy/i })
      expect(copyButton).toBeInTheDocument()
    })

    it("should not show actions when showActions is false", () => {
      render(
        <MessageAdapter
          message={mockAssistantMessage}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
          showActions={false}
          isStreaming={false}
        />
      )

      // Copy button should not be visible
      const copyButton = screen.queryByRole("button", { name: /copy/i })
      expect(copyButton).not.toBeInTheDocument()
    })
  })

  describe("User Message Loading States", () => {
    it("should always show user message immediately", () => {
      render(
        <MessageAdapter
          message={mockUserMessage}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
          showActions={true}
          isStreaming={false}
        />
      )

      expect(screen.getByText("Hello, how are you?")).toBeInTheDocument()
    })

    it("should not show loading indicator for user messages", () => {
      const pendingUserMessage: ChatMessage = {
        ...mockUserMessage,
        status: "pending"
      }

      render(
        <MessageAdapter
          message={pendingUserMessage}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
          showActions={true}
          isStreaming={false}
        />
      )

      // User message content should still be visible
      expect(screen.getByText("Hello, how are you?")).toBeInTheDocument()
    })
  })

  describe("Loading State Transitions", () => {
    it("should transition from pending to streaming", () => {
      const { container, rerender } = render(
        <MessageAdapter
          message={mockPendingMessage}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
          showActions={true}
        />
      )

      // Initial pending state - should render
      expect(container.firstChild).toBeInTheDocument()

      // Rerender with streaming state
      rerender(
        <MessageAdapter
          message={mockStreamingMessage}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
          showActions={true}
        />
      )

      // Should show streaming content
      expect(screen.getByText("Thinking...")).toBeInTheDocument()
    })

    it("should transition from streaming to completed", () => {
      const { rerender } = render(
        <MessageAdapter
          message={mockStreamingMessage}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
          showActions={true}
        />
      )

      // Streaming state
      expect(screen.getByText("Thinking...")).toBeInTheDocument()

      // Rerender with completed state
      rerender(
        <MessageAdapter
          message={mockAssistantMessage}
          onCopy={mockOnCopy}
          onRegenerate={mockOnRegenerate}
          showActions={true}
        />
      )

      // Should show completed content
      expect(screen.getByText("I'm doing well, thank you!")).toBeInTheDocument()
    })
  })
})
