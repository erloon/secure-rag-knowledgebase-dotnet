// hooks/__tests__/useConversationScroll.test.ts

import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useConversationScroll } from "../useConversationScroll"

describe("useConversationScroll", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      bottom: 100,
      height: 500,
      left: 0,
      right: 300,
      top: 0,
      width: 300,
      x: 0,
      y: 0,
      toJSON: () => ({})
    }))
  })

  it("should initialize with isAtBottom = true", () => {
    const { result } = renderHook(() => useConversationScroll())

    expect(result.current.isAtBottom).toBe(true)
    expect(result.current.scrollRef).toBeDefined()
    expect(result.current.scrollToBottom).toBeDefined()
    expect(result.current.scrollToTop).toBeDefined()
  })

  it("should provide a scroll ref", () => {
    const { result } = renderHook(() => useConversationScroll())

    expect(result.current.scrollRef).toBeDefined()
    expect(result.current.scrollRef.current).toBeNull()
  })

  it("should scroll to bottom when scrollToBottom is called", () => {
    const { result } = renderHook(() => useConversationScroll())

    // Create a mock div element
    const mockElement = document.createElement("div")
    mockElement.scrollTop = 100
    mockElement.scrollHeight = 500

    // Assign to ref
    act(() => {
      result.current.scrollRef.current = mockElement
    })

    // Call scrollToBottom
    act(() => {
      result.current.scrollToBottom()
    })

    expect(mockElement.scrollTop).toBe(500)
  })

  it("should scroll to top when scrollToTop is called", () => {
    const { result } = renderHook(() => useConversationScroll())

    const mockElement = document.createElement("div")
    mockElement.scrollTop = 100

    act(() => {
      result.current.scrollRef.current = mockElement
    })

    act(() => {
      result.current.scrollToTop()
    })

    expect(mockElement.scrollTop).toBe(0)
  })

  it("should update isAtBottom on scroll event", () => {
    const { result } = renderHook(() => useConversationScroll())

    const mockElement = document.createElement("div")

    act(() => {
      result.current.scrollRef.current = mockElement
    })

    // Mock scroll position near bottom
    mockElement.scrollTop = 400
    mockElement.scrollHeight = 500
    mockElement.clientHeight = 100

    act(() => {
      mockElement.dispatchEvent(new Event("scroll"))
    })

    // At bottom (within threshold)
    expect(result.current.isAtBottom).toBe(true)
  })

  it("should set isAtBottom to false when scrolled up from bottom", () => {
    const { result } = renderHook(() => useConversationScroll())

    const mockElement = document.createElement("div")

    act(() => {
      result.current.scrollRef.current = mockElement
    })

    // Scrolled far from bottom
    mockElement.scrollTop = 100
    mockElement.scrollHeight = 500
    mockElement.clientHeight = 100

    act(() => {
      mockElement.dispatchEvent(new Event("scroll"))
    })

    expect(result.current.isAtBottom).toBe(false)
  })

  it("should auto-scroll when content changes if enabled", () => {
    const { result } = renderHook(() => useConversationScroll({ autoScroll: true }))

    const mockElement = document.createElement("div")
    mockElement.scrollTop = 100
    mockElement.scrollHeight = 500

    act(() => {
      result.current.scrollRef.current = mockElement
    })

    // Trigger a content change
    act(() => {
      mockElement.scrollTop = 400 // Near bottom
      mockElement.dispatchEvent(new Event("scroll"))
    })

    // Should stay at bottom after content change
    expect(result.current.isAtBottom).toBe(true)
  })

  it("should respect smooth scroll parameter", () => {
    const { result } = renderHook(() => useConversationScroll({ smooth: true }))

    const mockElement = document.createElement("div")
    mockElement.scrollTop = 100

    act(() => {
      result.current.scrollRef.current = mockElement
    })

    const scrollToSpy = jest.spyOn(mockElement, "scrollTo")

    act(() => {
      result.current.scrollToBottom()
    })

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: expect.any(Number),
      behavior: "smooth"
    })
  })

  it("should handle missing ref gracefully", () => {
    const { result } = renderHook(() => useConversationScroll())

    // Should not throw when ref is null
    expect(() => {
      act(() => {
        result.current.scrollToBottom()
        result.current.scrollToTop()
      })
    }).not.toThrow()
  })
})
