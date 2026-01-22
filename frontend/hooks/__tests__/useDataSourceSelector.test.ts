// hooks/__tests__/useDataSourceSelector.test.ts

import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { renderHook, act } from "@testing-library/react"
import { useDataSourceSelector } from "../useDataSourceSelector"
import { createMockDataSourceFile } from "@/__tests__/utils/mock-helpers"
import type { DataSourceFile } from "@/types/chat"

describe("useDataSourceSelector", () => {
  const mockFiles: DataSourceFile[] = [
    createMockDataSourceFile({ id: "file-1", filename: "document1.pdf", isSelected: false }),
    createMockDataSourceFile({ id: "file-2", filename: "document2.docx", isSelected: false }),
    createMockDataSourceFile({ id: "file-3", filename: "document3.txt", isSelected: false })
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should initialize with empty selection if no initialSelectedIds provided", () => {
    const { result } = renderHook(() =>
      useDataSourceSelector({ availableFiles: mockFiles })
    )

    expect(result.current.selectedFiles).toEqual([])
    expect(result.current.selectedCount).toBe(0)
    expect(result.current.isOpen).toBe(false)
  })

  it("should initialize with specified files if initialSelectedIds provided", () => {
    const { result } = renderHook(() =>
      useDataSourceSelector({
        availableFiles: mockFiles,
        initialSelectedIds: ["file-1", "file-3"]
      })
    )

    expect(result.current.selectedFiles).toHaveLength(2)
    expect(result.current.selectedFiles[0]?.id).toBe("file-1")
    expect(result.current.selectedFiles[1]?.id).toBe("file-3")
    expect(result.current.selectedCount).toBe(2)
  })

  it("should toggle source on when it is not selected", () => {
    const onSelectionChange = jest.fn()
    const { result } = renderHook(() =>
      useDataSourceSelector({
        availableFiles: mockFiles,
        onSelectionChange
      })
    )

    act(() => {
      result.current.toggleSource("file-1")
    })

    expect(result.current.selectedFiles).toHaveLength(1)
    expect(result.current.selectedFiles[0]?.id).toBe("file-1")
    expect(result.current.selectedCount).toBe(1)
    expect(onSelectionChange).toHaveBeenCalledWith(["file-1"])
  })

  it("should toggle source off when it is already selected", () => {
    const onSelectionChange = jest.fn()
    const { result } = renderHook(() =>
      useDataSourceSelector({
        availableFiles: mockFiles,
        initialSelectedIds: ["file-1"],
        onSelectionChange
      })
    )

    expect(result.current.selectedCount).toBe(1)

    act(() => {
      result.current.toggleSource("file-1")
    })

    expect(result.current.selectedFiles).toHaveLength(0)
    expect(result.current.selectedCount).toBe(0)
    expect(onSelectionChange).toHaveBeenCalledWith([])
  })

  it("should return true from isSelected when source is selected", () => {
    const { result } = renderHook(() =>
      useDataSourceSelector({
        availableFiles: mockFiles,
        initialSelectedIds: ["file-1", "file-2"]
      })
    )

    expect(result.current.isSelected("file-1")).toBe(true)
    expect(result.current.isSelected("file-2")).toBe(true)
    expect(result.current.isSelected("file-3")).toBe(false)
  })

  it("should handle multiple toggles correctly", () => {
    const { result } = renderHook(() =>
      useDataSourceSelector({ availableFiles: mockFiles })
    )

    // Select file-1
    act(() => {
      result.current.toggleSource("file-1")
    })
    expect(result.current.selectedCount).toBe(1)

    // Select file-2
    act(() => {
      result.current.toggleSource("file-2")
    })
    expect(result.current.selectedCount).toBe(2)

    // Deselect file-1
    act(() => {
      result.current.toggleSource("file-1")
    })
    expect(result.current.selectedCount).toBe(1)
    expect(result.current.isSelected("file-2")).toBe(true)
  })

  it("should call onSelectionChange with sorted IDs", () => {
    const onSelectionChange = jest.fn()
    const { result } = renderHook(() =>
      useDataSourceSelector({
        availableFiles: mockFiles,
        onSelectionChange
      })
    )

    act(() => {
      result.current.toggleSource("file-3")
      result.current.toggleSource("file-1")
      result.current.toggleSource("file-2")
    })

    expect(onSelectionChange).toHaveBeenCalledWith(["file-1", "file-2", "file-3"])
  })

  it("should handle invalid source IDs gracefully", () => {
    const { result } = renderHook(() =>
      useDataSourceSelector({ availableFiles: mockFiles })
    )

    act(() => {
      result.current.toggleSource("invalid-id")
    })

    expect(result.current.selectedFiles).toHaveLength(0)
    expect(result.current.isSelected("invalid-id")).toBe(false)
  })

  it("should toggle dropdown open state", () => {
    const { result } = renderHook(() =>
      useDataSourceSelector({ availableFiles: mockFiles })
    )

    expect(result.current.isOpen).toBe(false)

    act(() => {
      result.current.setIsOpen(true)
    })

    expect(result.current.isOpen).toBe(true)

    act(() => {
      result.current.setIsOpen(false)
    })

    expect(result.current.isOpen).toBe(false)
  })

  it("should filter available files to get selected files", () => {
    const onSelectionChange = jest.fn()
    const { result } = renderHook(() =>
      useDataSourceSelector({
        availableFiles: mockFiles,
        onSelectionChange
      })
    )

    act(() => {
      result.current.toggleSource("file-1")
      result.current.toggleSource("file-3")
    })

    const selectedFiles = result.current.selectedFiles
    expect(selectedFiles).toHaveLength(2)
    expect(selectedFiles.find(f => f.id === "file-1")?.filename).toBe("document1.pdf")
    expect(selectedFiles.find(f => f.id === "file-3")?.filename).toBe("document3.txt")
  })
})
