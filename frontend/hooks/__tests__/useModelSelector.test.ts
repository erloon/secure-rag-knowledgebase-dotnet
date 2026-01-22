// hooks/__tests__/useModelSelector.test.ts

import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { renderHook, act } from "@testing-library/react"
import { useModelSelector } from "../useModelSelector"
import { createMockAIModel } from "@/__tests__/utils/mock-helpers"
import type { AIModel } from "@/types/chat"

describe("useModelSelector", () => {
  const mockModels: AIModel[] = [
    createMockAIModel({ id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", providerSlug: "openai" }),
    createMockAIModel({ id: "claude-opus", name: "Claude Opus", provider: "Anthropic", providerSlug: "anthropic" }),
    createMockAIModel({ id: "gemini-pro", name: "Gemini Pro", provider: "Google", providerSlug: "google" })
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should initialize with first model if no initialModelId provided", () => {
    const { result } = renderHook(() => useModelSelector({ models: mockModels }))

    expect(result.current.selectedModel).toEqual(mockModels[0])
    expect(result.current.isOpen).toBe(false)
    expect(result.current.searchQuery).toBe("")
  })

  it("should initialize with specified model if initialModelId provided", () => {
    const { result } = renderHook(() =>
      useModelSelector({ models: mockModels, initialModelId: "claude-opus" })
    )

    expect(result.current.selectedModel).toEqual(mockModels[1])
  })

  it("should initialize with null if models array is empty", () => {
    const { result } = renderHook(() => useModelSelector({ models: [] }))

    expect(result.current.selectedModel).toBeNull()
    expect(result.current.filteredModels).toEqual([])
  })

  it("should select model when selectModel is called with valid ID", () => {
    const onModelChange = jest.fn()
    const { result } = renderHook(() =>
      useModelSelector({ models: mockModels, onModelChange })
    )

    act(() => {
      result.current.selectModel("claude-opus")
    })

    expect(result.current.selectedModel).toEqual(mockModels[1])
    expect(onModelChange).toHaveBeenCalledWith(mockModels[1])
  })

  it("should not change selection when selectModel is called with invalid ID", () => {
    const { result } = renderHook(() =>
      useModelSelector({ models: mockModels, initialModelId: "gpt-4o" })
    )

    const originalModel = result.current.selectedModel

    act(() => {
      result.current.selectModel("invalid-id")
    })

    expect(result.current.selectedModel).toEqual(originalModel)
  })

  it("should filter models by search query", () => {
    const { result } = renderHook(() => useModelSelector({ models: mockModels }))

    act(() => {
      result.current.setSearchQuery("gpt")
    })

    expect(result.current.filteredModels).toHaveLength(1)
    expect(result.current.filteredModels[0]?.id).toBe("gpt-4o")
  })

  it("should filter models by provider", () => {
    const { result } = renderHook(() => useModelSelector({ models: mockModels }))

    act(() => {
      result.current.setSearchQuery("anthropic")
    })

    expect(result.current.filteredModels).toHaveLength(1)
    expect(result.current.filteredModels[0]?.id).toBe("claude-opus")
  })

  it("should be case-insensitive when filtering", () => {
    const { result } = renderHook(() => useModelSelector({ models: mockModels }))

    act(() => {
      result.current.setSearchQuery("GPT")
    })

    expect(result.current.filteredModels).toHaveLength(1)
    expect(result.current.filteredModels[0]?.id).toBe("gpt-4o")
  })

  it("should return all models when search query is empty", () => {
    const { result } = renderHook(() => useModelSelector({ models: mockModels }))

    act(() => {
      result.current.setSearchQuery("gpt")
    })

    expect(result.current.filteredModels).toHaveLength(1)

    act(() => {
      result.current.setSearchQuery("")
    })

    expect(result.current.filteredModels).toHaveLength(3)
  })

  it("should toggle dropdown open state", () => {
    const { result } = renderHook(() => useModelSelector({ models: mockModels }))

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
})
