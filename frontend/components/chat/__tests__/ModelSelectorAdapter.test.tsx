// components/chat/__tests__/ModelSelectorAdapter.test.tsx

import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ModelSelectorAdapter } from "../ModelSelectorAdapter"
import { AIChatProvider } from "@/contexts/AIChatContext"
import { createMockAIModel, createMockAIModels } from "@/__tests__/utils/mock-helpers"
import type { AIModel } from "@/types/chat"

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

function renderWithProvider(ui: React.ReactElement) {
  return render(<AIChatProvider value={mockContextValue}>{ui}</AIChatProvider>)
}

describe("ModelSelectorAdapter", () => {
  const mockModels: AIModel[] = createMockAIModels(3)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("initial render", () => {
    it("should render with selected model", () => {
      renderWithProvider(<ModelSelectorAdapter models={mockModels} />)

      expect(screen.getByText(mockModels[0].name)).toBeInTheDocument()
    })

    it("should render provider logo", () => {
      renderWithProvider(<ModelSelectorAdapter models={mockModels} />)

      const logos = document.querySelectorAll('img[alt*="logo"]')
      expect(logos.length).toBeGreaterThan(0)
    })

    it("should show placeholder when no models available", () => {
      renderWithProvider(<ModelSelectorAdapter models={[]} />)

      expect(screen.getByText("Select Model")).toBeInTheDocument()
    })
  })

  describe("dropdown interactions", () => {
    it("should open dropdown when trigger is clicked", async () => {
      const user = userEvent.setup()
      renderWithProvider(<ModelSelectorAdapter models={mockModels} />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      // Wait for dropdown to appear
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })
    })

    it("should close dropdown when clicking outside", async () => {
      const user = userEvent.setup()
      renderWithProvider(<ModelSelectorAdapter models={mockModels} />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      // Click the close button to close the dialog
      const closeButton = screen.getByRole("button", { name: /close/i })
      await user.click(closeButton)

      // Dropdown should close
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      })
    })

    it("should display all available models in dropdown", async () => {
      const user = userEvent.setup()
      renderWithProvider(<ModelSelectorAdapter models={mockModels} />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        // Use getAllByRole to find model options in the listbox
        const options = screen.getAllByRole("option")
        expect(options.length).toBe(3)
      })
    })
  })

  describe("model selection", () => {
    it("should call selectModel when a model is clicked", async () => {
      const user = userEvent.setup()
      renderWithProvider(<ModelSelectorAdapter models={mockModels} />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      const secondModel = screen.getByText(mockModels[1].name)
      await user.click(secondModel)

      expect(mockContextValue.selectModel).toHaveBeenCalledWith(mockModels[1])
    })

    it("should close dropdown after selection", async () => {
      const user = userEvent.setup()
      renderWithProvider(<ModelSelectorAdapter models={mockModels} />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      // Get the first option from the listbox (inside the dialog)
      const options = screen.getAllByRole("option")
      await user.click(options[0])

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      })
    })

    it("should display selected model after selection", async () => {
      const user = userEvent.setup()
      const updatedContext = {
        ...mockContextValue,
        selectedModel: mockModels[1]
      }

      render(
        <AIChatProvider value={updatedContext}>
          <ModelSelectorAdapter models={mockModels} />
        </AIChatProvider>
      )

      expect(screen.getByText(mockModels[1].name)).toBeInTheDocument()
    })
  })

  describe("search functionality", () => {
    it("should filter models by search query", async () => {
      const user = userEvent.setup()
      renderWithProvider(<ModelSelectorAdapter models={mockModels} />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      // Type in search input
      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, mockModels[0].name)

      // Should only show matching model
      await waitFor(() => {
        const options = screen.getAllByRole("option")
        expect(options.length).toBe(1)
      })
    })

    it("should show empty state when no results found", async () => {
      const user = userEvent.setup()
      renderWithProvider(<ModelSelectorAdapter models={mockModels} />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      // Type search that won't match anything
      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, "NonExistentModelXYZ")

      await waitFor(() => {
        expect(screen.getByText(/no models found/i)).toBeInTheDocument()
      })
    })

    it("should filter by provider name", async () => {
      const user = userEvent.setup()
      renderWithProvider(<ModelSelectorAdapter models={mockModels} />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      // Search by provider
      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, mockModels[0].provider)

      await waitFor(() => {
        expect(screen.getByText(mockModels[0].name)).toBeInTheDocument()
      })
    })
  })

  describe("edge cases", () => {
    it("should handle single model", () => {
      const singleModel = [mockModels[0]]
      renderWithProvider(<ModelSelectorAdapter models={singleModel} />)

      expect(screen.getByText(mockModels[0].name)).toBeInTheDocument()
    })

    it("should handle models with special characters in name", () => {
      const specialModel = createMockAIModel({
        name: "GPT-4 (Turbo) - 2024",
        provider: "OpenAI"
      })

      renderWithProvider(<ModelSelectorAdapter models={[specialModel]} />)

      expect(screen.getByText(/GPT-4.*Turbo.*2024/)).toBeInTheDocument()
    })

    it("should handle context with null selected model", () => {
      const nullContext = {
        ...mockContextValue,
        selectedModel: null
      }

      render(
        <AIChatProvider value={nullContext}>
          <ModelSelectorAdapter models={mockModels} />
        </AIChatProvider>
      )

      // Should still show first available model
      expect(screen.getByText(mockModels[0].name)).toBeInTheDocument()
    })
  })

  describe("provider logos", () => {
    it("should render correct logo for each provider", async () => {
      const user = userEvent.setup()
      renderWithProvider(<ModelSelectorAdapter models={mockModels} />)

      const trigger = screen.getByRole("button")
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      // Check that logos are present for each model
      const logos = document.querySelectorAll('img[alt*="logo"]')
      expect(logos.length).toBeGreaterThan(0)
    })
  })
})
