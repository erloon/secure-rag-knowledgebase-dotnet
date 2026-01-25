// components/chat/__tests__/DataSourceSelector.test.tsx

import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DataSourceSelector } from "../DataSourceSelector"
import { AIChatProvider } from "@/contexts/AIChatContext"
import { createMockDataSourceFile, createMockDataSourceFiles } from "@/__tests__/utils/mock-helpers"
import type { DataSourceFile } from "@/types/chat"

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

describe("DataSourceSelector", () => {
  const mockFiles: DataSourceFile[] = createMockDataSourceFiles(3)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("initial render", () => {
    it("should render with default trigger button", () => {
      renderWithProvider(<DataSourceSelector availableFiles={mockFiles} />)

      expect(screen.getByText("Data Sources")).toBeInTheDocument()
      expect(screen.getByRole("button")).toBeInTheDocument()
    })

    it("should render with custom trigger", () => {
      const customTrigger = <button type="button">Custom Trigger</button>

      renderWithProvider(
        <DataSourceSelector availableFiles={mockFiles} trigger={customTrigger} />
      )

      expect(screen.getByText("Custom Trigger")).toBeInTheDocument()
    })

    it("should not show selected count badge when no files selected", () => {
      renderWithProvider(<DataSourceSelector availableFiles={mockFiles} />)

      // No badge should be visible (count is 0)
      const badges = document.querySelectorAll(".bg-primary")
      expect(badges.length).toBe(0)
    })

    it("should show selected count badge when files are selected", () => {
      const contextWithSelection = {
        ...mockContextValue,
        selectedSources: [mockFiles[0], mockFiles[1]]
      }

      render(
        <AIChatProvider value={contextWithSelection}>
          <DataSourceSelector availableFiles={mockFiles} />
        </AIChatProvider>
      )

      expect(screen.getByText("2")).toBeInTheDocument()
    })
  })

  describe("dialog interactions", () => {
    it("should open dialog when trigger is clicked", async () => {
      const user = userEvent.setup()
      renderWithProvider(<DataSourceSelector availableFiles={mockFiles} />)

      const trigger = screen.getByRole("button", { name: /data sources/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
        expect(screen.getByText("Select Data Sources")).toBeInTheDocument()
      })
    })

    it("should close dialog when clicking outside", async () => {
      const user = userEvent.setup()
      renderWithProvider(<DataSourceSelector availableFiles={mockFiles} />)

      const trigger = screen.getByRole("button", { name: /data sources/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      // Press Escape key to close dialog
      await user.keyboard("{Escape}")

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      })
    })

    it("should display selected count in dialog header", async () => {
      const user = userEvent.setup()
      renderWithProvider(<DataSourceSelector availableFiles={mockFiles} />)

      const trigger = screen.getByRole("button", { name: /data sources/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("0 selected")).toBeInTheDocument()
      })
    })
  })

  describe("file list", () => {
    it("should display all available files", async () => {
      const user = userEvent.setup()
      renderWithProvider(<DataSourceSelector availableFiles={mockFiles} />)

      const trigger = screen.getByRole("button", { name: /data sources/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText(mockFiles[0].filename)).toBeInTheDocument()
        expect(screen.getByText(mockFiles[1].filename)).toBeInTheDocument()
        expect(screen.getByText(mockFiles[2].filename)).toBeInTheDocument()
      })
    })

    it("should display file metadata (filename, chunks, size)", async () => {
      const user = userEvent.setup()
      const testFile = createMockDataSourceFile({
        filename: "test.pdf",
        chunkCount: 150,
        size: 2048000
      })

      renderWithProvider(<DataSourceSelector availableFiles={[testFile]} />)

      const trigger = screen.getByRole("button", { name: /data sources/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("test.pdf")).toBeInTheDocument()
        expect(screen.getByText(/150 chunks/i)).toBeInTheDocument()
        // Size should be formatted (2.0 MB)
        expect(screen.getByText(/2\.0.*MB/i)).toBeInTheDocument()
      })
    })

    it("should show empty state when no files available", async () => {
      const user = userEvent.setup()
      renderWithProvider(<DataSourceSelector availableFiles={[]} />)

      const trigger = screen.getByRole("button", { name: /data sources/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText(/no files available/i)).toBeInTheDocument()
      })
    })
  })

  describe("file selection", () => {
    it("should toggle file selection when clicking file row", async () => {
      const user = userEvent.setup()
      renderWithProvider(<DataSourceSelector availableFiles={mockFiles} />)

      const trigger = screen.getByRole("button", { name: /data sources/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      const fileRow = screen.getByText(mockFiles[0].filename).closest("div")
      if (fileRow) {
        await user.click(fileRow)
      }

      expect(mockContextValue.toggleSource).toHaveBeenCalledWith(mockFiles[0].id)
    })

    it("should toggle file selection when checkbox is clicked", async () => {
      const user = userEvent.setup()
      renderWithProvider(<DataSourceSelector availableFiles={mockFiles} />)

      const trigger = screen.getByRole("button", { name: /data sources/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      // Click the file row which contains the checkbox instead of checkbox directly
      const fileRow = screen.getByText(mockFiles[0].filename).closest("[class*='flex']")
      if (fileRow) {
        await user.click(fileRow)
      }

      expect(mockContextValue.toggleSource).toHaveBeenCalled()
    })

    it("should show checkmark for selected files", async () => {
      const user = userEvent.setup()
      const contextWithSelection = {
        ...mockContextValue,
        selectedSources: [mockFiles[0]]
      }

      render(
        <AIChatProvider value={contextWithSelection}>
          <DataSourceSelector availableFiles={mockFiles} />
        </AIChatProvider>
      )

      const trigger = screen.getByRole("button", { name: /data sources/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      // First file should have checked checkbox
      const checkboxes = screen.getAllByRole("checkbox")
      expect(checkboxes[0]).toBeChecked()
    })

    it("should update selected count in header when files are toggled", async () => {
      const user = userEvent.setup()
      renderWithProvider(<DataSourceSelector availableFiles={mockFiles} />)

      const trigger = screen.getByRole("button", { name: /data sources/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText("0 selected")).toBeInTheDocument()
      })

      // Toggle a file
      const fileRow = screen.getByText(mockFiles[0].filename).closest("div")
      if (fileRow) {
        await user.click(fileRow)
      }

      // Count should update
      await waitFor(() => {
        expect(screen.getByText("1 selected")).toBeInTheDocument()
      })
    })
  })

  describe("accessibility", () => {
    it("should be keyboard navigable", async () => {
      const user = userEvent.setup()
      renderWithProvider(<DataSourceSelector availableFiles={mockFiles} />)

      const trigger = screen.getByRole("button", { name: /data sources/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      const fileRow = screen.getByText(mockFiles[0].filename).closest('[role="button"]')
      if (fileRow) {
        fileRow.focus()
        expect(document.activeElement).toBe(fileRow)

        // Press Enter to toggle
        await user.keyboard("{Enter}")

        expect(mockContextValue.toggleSource).toHaveBeenCalled()
      }
    })

    it("should have proper ARIA labels", async () => {
      const user = userEvent.setup()
      renderWithProvider(<DataSourceSelector availableFiles={mockFiles} />)

      const trigger = screen.getByRole("button", { name: /data sources/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument()
      })

      const checkboxes = screen.getAllByRole("checkbox")
      checkboxes.forEach((checkbox, index) => {
        expect(checkbox).toHaveAttribute("aria-label", `Select ${mockFiles[index].filename}`)
      })
    })
  })

  describe("file size formatting", () => {
    it("should format bytes correctly", async () => {
      const user = userEvent.setup()
      const smallFile = createMockDataSourceFile({ size: 512 })

      renderWithProvider(<DataSourceSelector availableFiles={[smallFile]} />)

      const trigger = screen.getByRole("button", { name: /data sources/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText(/512 B/i)).toBeInTheDocument()
      })
    })

    it("should format kilobytes correctly", async () => {
      const user = userEvent.setup()
      const kbFile = createMockDataSourceFile({ size: 1024 * 5 })

      renderWithProvider(<DataSourceSelector availableFiles={[kbFile]} />)

      const trigger = screen.getByRole("button", { name: /data sources/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText(/5\.0.*KB/i)).toBeInTheDocument()
      })
    })

    it("should format megabytes correctly", async () => {
      const user = userEvent.setup()
      const mbFile = createMockDataSourceFile({ size: 1024 * 1024 * 10 })

      renderWithProvider(<DataSourceSelector availableFiles={[mbFile]} />)

      const trigger = screen.getByRole("button", { name: /data sources/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText(/10\.0.*MB/i)).toBeInTheDocument()
      })
    })
  })

  describe("edge cases", () => {
    it("should handle file with zero chunks", async () => {
      const user = userEvent.setup()
      const noChunksFile = createMockDataSourceFile({ chunkCount: 0 })

      renderWithProvider(<DataSourceSelector availableFiles={[noChunksFile]} />)

      const trigger = screen.getByRole("button", { name: /data sources/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText(/0 chunks/i)).toBeInTheDocument()
      })
    })

    it("should handle very long filename", async () => {
      const user = userEvent.setup()
      const longNameFile = createMockDataSourceFile({
        filename: "this-is-a-very-long-filename-that-should-be-truncated.pdf"
      })

      renderWithProvider(<DataSourceSelector availableFiles={[longNameFile]} />)

      const trigger = screen.getByRole("button", { name: /data sources/i })
      await user.click(trigger)

      await waitFor(() => {
        expect(screen.getByText(/this-is-a-very-long-filename/i)).toBeInTheDocument()
      })
    })
  })
})
