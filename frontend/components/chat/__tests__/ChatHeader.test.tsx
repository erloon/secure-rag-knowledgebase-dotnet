// components/chat/__tests__/ChatHeader.test.tsx

import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import { ChatHeader } from "../ChatHeader"
import { AIChatProvider } from "@/contexts/AIChatContext"
import { createMockAIModel, createMockDataSourceFile } from "@/__tests__/utils/mock-helpers"
import type { AIModel, DataSourceFile } from "@/types/chat"

const mockContextValue = {
  messages: [],
  selectedModel: null,
  selectedSources: [],
  isStreaming: false,
  error: null,
  sendMessage: jest.fn(),
  regenerateResponse: jest.fn(),
  stopStreaming: jest.fn(),
  clearError: jest.fn(),
  clearMessages: jest.fn(),
  selectModel: jest.fn(),
  toggleSource: jest.fn()
}

function renderWithProvider(ui: React.ReactElement, context = mockContextValue) {
  return render(<AIChatProvider value={context}>{ui}</AIChatProvider>)
}

describe("ChatHeader", () => {
  const mockModels: AIModel[] = [
    createMockAIModel({ id: "model-1", name: "GPT-4o", provider: "OpenAI", providerSlug: "openai" }),
    createMockAIModel({ id: "model-2", name: "Claude 3.5", provider: "Anthropic", providerSlug: "anthropic" }),
  ]

  const mockFiles: DataSourceFile[] = [
    createMockDataSourceFile({ id: "file-1", filename: "document.pdf", chunkCount: 100 }),
    createMockDataSourceFile({ id: "file-2", filename: "notes.docx", chunkCount: 50 }),
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("initial render", () => {
    it("should render ModelSelectorAdapter", () => {
      renderWithProvider(<ChatHeader models={mockModels} availableFiles={mockFiles} />)

      // Model selector should be visible
      expect(screen.getByText(mockModels[0].name)).toBeInTheDocument()
    })

    it("should render DataSourceSelector", () => {
      renderWithProvider(<ChatHeader models={mockModels} availableFiles={mockFiles} />)

      // Data sources button should be visible
      expect(screen.getByText("Data Sources")).toBeInTheDocument()
    })

    it("should render with correct layout classes", () => {
      const { container } = renderWithProvider(<ChatHeader models={mockModels} availableFiles={mockFiles} />)

      // Should have border bottom
      const header = container.querySelector(".border-b")
      expect(header).toBeInTheDocument()
    })
  })

  describe("selected sources indicator", () => {
    it("should not show count when no sources selected", () => {
      renderWithProvider(<ChatHeader models={mockModels} availableFiles={mockFiles} />)

      expect(screen.queryByText(/files selected/i)).not.toBeInTheDocument()
    })

    it("should show count when one source selected", () => {
      const contextWithSelection = {
        ...mockContextValue,
        selectedSources: [mockFiles[0]]
      }

      renderWithProvider(
        <ChatHeader models={mockModels} availableFiles={mockFiles} />,
        contextWithSelection
      )

      expect(screen.getByText("1 file selected")).toBeInTheDocument()
    })

    it("should show count when multiple sources selected", () => {
      const contextWithSelection = {
        ...mockContextValue,
        selectedSources: mockFiles
      }

      renderWithProvider(
        <ChatHeader models={mockModels} availableFiles={mockFiles} />,
        contextWithSelection
      )

      expect(screen.getByText("2 files selected")).toBeInTheDocument()
    })

    it("should use singular 'file' when count is 1", () => {
      const contextWithSelection = {
        ...mockContextValue,
        selectedSources: [mockFiles[0]]
      }

      renderWithProvider(
        <ChatHeader models={mockModels} availableFiles={mockFiles} />,
        contextWithSelection
      )

      expect(screen.getByText(/1 file selected/i)).toBeInTheDocument()
    })

    it("should use plural 'files' when count is not 1", () => {
      const contextWithSelection = {
        ...mockContextValue,
        selectedSources: [mockFiles[0], mockFiles[1]]
      }

      renderWithProvider(
        <ChatHeader models={mockModels} availableFiles={mockFiles} />,
        contextWithSelection
      )

      expect(screen.getByText(/2 files selected/i)).toBeInTheDocument()
    })
  })

  describe("component composition", () => {
    it("should compose ModelSelectorAdapter and DataSourceSelector together", () => {
      renderWithProvider(<ChatHeader models={mockModels} availableFiles={mockFiles} />)

      // Both components should be present
      expect(screen.getByText(mockModels[0].name)).toBeInTheDocument()
      expect(screen.getByText("Data Sources")).toBeInTheDocument()
    })

    it("should maintain proper spacing between components", () => {
      const { container } = renderWithProvider(<ChatHeader models={mockModels} availableFiles={mockFiles} />)

      // Check for flex layout with gap
      const header = container.querySelector(".border-b")
      expect(header?.className).toContain("flex")
    })
  })

  describe("context integration", () => {
    it("should use selectedSources from context", () => {
      const contextWithSelection = {
        ...mockContextValue,
        selectedSources: [mockFiles[0], mockFiles[1]]
      }

      renderWithProvider(
        <ChatHeader models={mockModels} availableFiles={mockFiles} />,
        contextWithSelection
      )

      expect(screen.getByText("2 files selected")).toBeInTheDocument()
    })

    it("should update when context selectedSources changes", () => {
      const { rerender } = renderWithProvider(<ChatHeader models={mockModels} availableFiles={mockFiles} />)

      // Initially no selection
      expect(screen.queryByText(/files selected/i)).not.toBeInTheDocument()

      // Update context with selection
      const contextWithSelection = {
        ...mockContextValue,
        selectedSources: [mockFiles[0]]
      }

      rerender(
        <AIChatProvider value={contextWithSelection}>
          <ChatHeader models={mockModels} availableFiles={mockFiles} />
        </AIChatProvider>
      )

      expect(screen.getByText("1 file selected")).toBeInTheDocument()
    })
  })

  describe("edge cases", () => {
    it("should handle empty models array", () => {
      renderWithProvider(<ChatHeader models={[]} availableFiles={mockFiles} />)

      // Should still render without crashing
      expect(screen.getByText("Data Sources")).toBeInTheDocument()
    })

    it("should handle empty files array", () => {
      renderWithProvider(<ChatHeader models={mockModels} availableFiles={[]} />)

      // Should still render without crashing
      expect(screen.getByText(mockModels[0].name)).toBeInTheDocument()
      expect(screen.getByText("Data Sources")).toBeInTheDocument()
    })

    it("should handle both arrays empty", () => {
      renderWithProvider(<ChatHeader models={[]} availableFiles={[]} />)

      // Should still render without crashing
      expect(screen.getByText("Data Sources")).toBeInTheDocument()
    })
  })

  describe("responsive behavior", () => {
    it("should have responsive layout classes", () => {
      const { container } = renderWithProvider(<ChatHeader models={mockModels} availableFiles={mockFiles} />)

      const header = container.querySelector(".border-b")
      expect(header).toBeInTheDocument()
      expect(header?.className).toContain("px-4")
      expect(header?.className).toContain("py-3")
    })
  })
})
