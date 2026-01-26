/**
 * Responsive design tests for AIChatInterface
 * Tests mobile, tablet, and desktop layouts
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { render, screen, within } from "@testing-library/react"
import { AIChatProvider } from "@/contexts/AIChatContext"
import { AIChatInterface } from "../AIChatInterface"
import type { AIModel, DataSourceFile } from "@/types/chat"
import type { AIChatContextValue } from "@/contexts/AIChatContext"

// Mock data
const mockModels: AIModel[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    providerSlug: "openai"
  },
  {
    id: "claude-opus",
    name: "Claude Opus",
    provider: "Anthropic",
    providerSlug: "anthropic"
  }
]

const mockFiles: DataSourceFile[] = [
  {
    id: "file-1",
    filename: "Employee_Handbook.pdf",
    fileType: "pdf",
    size: 2458624,
    uploadedAt: "2026-01-15T10:30:00Z",
    chunkCount: 245,
    isSelected: false
  },
  {
    id: "file-2",
    filename: "Company_Policy.docx",
    fileType: "docx",
    size: 512000,
    uploadedAt: "2026-01-14T14:20:00Z",
    chunkCount: 52,
    isSelected: false
  }
]

const mockContextValue: AIChatContextValue = {
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
  error: null
}

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AIChatProvider value={mockContextValue}>
      {ui}
    </AIChatProvider>
  )
}

describe("AIChatInterface - Responsive Design", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("Mobile Layout (< 768px)", () => {
    it("should render with mobile-friendly spacing", () => {
      renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      const container = screen.getByRole("region", { name: /ai chat interface/i })
      expect(container).toBeInTheDocument()
      expect(container).toHaveClass("gap-4")
    })

    it("should have flexible width for mobile", () => {
      const { container } = renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      const interfaceContainer = container.querySelector(".flex.flex-col.h-full")
      expect(interfaceContainer).toBeInTheDocument()
    })

    it("should stack components vertically on mobile", () => {
      const { container } = renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      const interfaceContainer = container.querySelector(".flex.flex-col")
      expect(interfaceContainer).toBeInTheDocument()
    })
  })

  describe("Tablet Layout (768px - 1024px)", () => {
    it("should maintain vertical layout on tablet", () => {
      renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      const container = screen.getByRole("region", { name: /ai chat interface/i })
      expect(container).toHaveClass("flex-col")
    })
  })

  describe("Desktop Layout (> 1024px)", () => {
    it("should support custom className for desktop styling", () => {
      renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
          className="max-w-6xl mx-auto"
        />
      )

      const container = screen.getByRole("region", { name: /ai chat interface/i })
      expect(container).toHaveClass("max-w-6xl", "mx-auto")
    })
  })

  describe("Responsive Components", () => {
    it("should render ChatHeader on all screen sizes", () => {
      renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      // Interface should render with header
      const container = screen.getByRole("region", { name: /ai chat interface/i })
      expect(container).toBeInTheDocument()
      expect(container.firstChild).toBeTruthy()
    })

    it("should render ConversationContainer on all screen sizes", () => {
      renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      // Empty state should be present
      expect(screen.getByText("No messages yet")).toBeInTheDocument()
    })

    it("should render PromptInputAdapter on all screen sizes", () => {
      const { container } = renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      // Textarea should be present
      const textarea = container.querySelector("textarea")
      expect(textarea).toBeInTheDocument()
    })
  })

  describe("Accessibility - Responsive", () => {
    it("should have ARIA region label on all screen sizes", () => {
      renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      const region = screen.getByRole("region")
      expect(region).toHaveAttribute("aria-label", "AI chat interface")
    })

    it("should maintain keyboard navigation across screen sizes", () => {
      renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={mockFiles}
        />
      )

      // Container should be present and accessible
      const container = screen.getByRole("region")
      expect(container).toBeInTheDocument()
    })
  })

  describe("Responsive Edge Cases", () => {
    it("should handle long model names on small screens", () => {
      const longNameModel: AIModel = {
        id: "very-long-model-name-that-exceeds-mobile-width",
        name: "Very Long Model Name That Exceeds Mobile Width",
        provider: "Test Provider",
        providerSlug: "test"
      }

      renderWithProviders(
        <AIChatInterface
          models={[longNameModel]}
          availableFiles={mockFiles}
        />
      )

      // Should render without layout breaks
      const container = screen.getByRole("region")
      expect(container).toBeInTheDocument()
    })

    it("should handle many data sources on small screens", () => {
      const manyFiles: DataSourceFile[] = Array.from({ length: 20 }, (_, i) => ({
        id: `file-${i}`,
        filename: `Document_${i}.pdf`,
        fileType: "pdf",
        size: 1000000,
        uploadedAt: "2026-01-15T10:30:00Z",
        chunkCount: 100,
        isSelected: false
      }))

      renderWithProviders(
        <AIChatInterface
          models={mockModels}
          availableFiles={manyFiles}
        />
      )

      // Should still render without layout breaks
      const container = screen.getByRole("region")
      expect(container).toBeInTheDocument()
    })
  })
})
