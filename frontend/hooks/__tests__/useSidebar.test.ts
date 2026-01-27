// hooks/__tests__/useSidebar.test.ts

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useSidebar } from "../useSidebar"
import type { SidebarContextValue } from "@/types/sidebar"

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
  length: 0,
  key: jest.fn(),
}

// Store the original localStorage
const originalLocalStorage = window.localStorage

// Mock localStorage on window object
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
  configurable: true,
})

// Mock window.matchMedia
const mockMatchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}))

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: mockMatchMedia,
})

// Mock window.innerWidth
const originalInnerWidth = window.innerWidth

describe("useSidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset localStorage mock (including return values)
    localStorageMock.getItem.mockReset()
    localStorageMock.setItem.mockReset()
    localStorageMock.clear.mockReset()
    localStorageMock.removeItem.mockReset()
    // Set default localStorage mock return value
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockImplementation(() => {})
    // Reset window.innerWidth to desktop
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    })
  })

  describe("Hook Interface", () => {
    it("should return all context properties", () => {
      const { result } = renderHook(() => useSidebar())

      expect(result.current).toHaveProperty("isOpen")
      expect(result.current).toHaveProperty("isCollapsed")
      expect(result.current).toHaveProperty("isMobile")
      expect(result.current).toHaveProperty("state")
      expect(result.current).toHaveProperty("open")
      expect(result.current).toHaveProperty("close")
      expect(result.current).toHaveProperty("toggle")
      expect(result.current).toHaveProperty("setCollapsed")
      expect(result.current).toHaveProperty("error")
      expect(result.current).toHaveProperty("clearError")
    })

    it("should provide isOpen, isCollapsed, isMobile states", () => {
      const { result } = renderHook(() => useSidebar())

      expect(typeof result.current.isOpen).toBe("boolean")
      expect(typeof result.current.isCollapsed).toBe("boolean")
      expect(typeof result.current.isMobile).toBe("boolean")
    })

    it("should provide computed state string", () => {
      const { result } = renderHook(() => useSidebar())

      expect(result.current.state).toMatch(/^(expanded|collapsed)$/)
    })

    it("should provide all action methods", () => {
      const { result } = renderHook(() => useSidebar())

      expect(typeof result.current.open).toBe("function")
      expect(typeof result.current.close).toBe("function")
      expect(typeof result.current.toggle).toBe("function")
      expect(typeof result.current.setCollapsed).toBe("function")
      expect(typeof result.current.clearError).toBe("function")
    })
  })

  describe("State Management", () => {
    it("should initialize with isOpen=false", () => {
      const { result } = renderHook(() => useSidebar())

      expect(result.current.isOpen).toBe(false)
    })

    it("should open sidebar when open is called", () => {
      const { result } = renderHook(() => useSidebar())

      act(() => {
        result.current.open()
      })

      expect(result.current.isOpen).toBe(true)
    })

    it("should close sidebar when close is called", () => {
      const { result } = renderHook(() => useSidebar())

      act(() => {
        result.current.open()
      })

      act(() => {
        result.current.close()
      })

      expect(result.current.isOpen).toBe(false)
    })

    it("should toggle isOpen state when toggle is called on mobile", async () => {
      // Set mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 500,
      })

      const { result } = renderHook(() => useSidebar())

      // Wait for mobile detection
      await waitFor(() => {
        expect(result.current.isMobile).toBe(true)
      })

      act(() => {
        result.current.toggle()
      })

      expect(result.current.isOpen).toBe(true)

      act(() => {
        result.current.toggle()
      })

      expect(result.current.isOpen).toBe(false)
    })

    it("should toggle isCollapsed state when toggle is called on desktop", () => {
      const { result } = renderHook(() => useSidebar())

      act(() => {
        result.current.toggle()
      })

      expect(result.current.isCollapsed).toBe(true)

      act(() => {
        result.current.toggle()
      })

      expect(result.current.isCollapsed).toBe(false)
    })

    it("should set collapsed state on desktop", () => {
      const { result } = renderHook(() => useSidebar())

      act(() => {
        result.current.setCollapsed(true)
      })

      expect(result.current.isCollapsed).toBe(true)

      act(() => {
        result.current.setCollapsed(false)
      })

      expect(result.current.isCollapsed).toBe(false)
    })

    it("should ignore setCollapsed on mobile", async () => {
      // Set mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 500,
      })

      const { result } = renderHook(() => useSidebar())

      // Wait for mobile detection
      await waitFor(() => {
        expect(result.current.isMobile).toBe(true)
      })

      act(() => {
        result.current.setCollapsed(true)
      })

      // Should remain false on mobile
      expect(result.current.isCollapsed).toBe(false)
    })

    it("should compute correct state string", () => {
      const { result } = renderHook(() => useSidebar())

      expect(result.current.state).toBe("expanded")

      act(() => {
        result.current.setCollapsed(true)
      })

      expect(result.current.state).toBe("collapsed")
    })
  })

  describe("localStorage Integration", () => {
    it("should read initial collapsed state from localStorage on desktop", async () => {
      // IMPORTANT: Reset and set return value BEFORE any rendering
      localStorageMock.getItem.mockReset()
      localStorageMock.getItem.mockReturnValue("true")

      const { result } = renderHook(() => useSidebar())

      // Wait for useEffect to run
      await waitFor(() => {
        expect(result.current.isCollapsed).toBe(true)
      })

      expect(localStorageMock.getItem).toHaveBeenCalledWith("sidebar-collapsed")
    })

    it("should start with false when localStorage is empty on desktop", async () => {
      // IMPORTANT: Reset and set return value BEFORE any rendering
      localStorageMock.getItem.mockReset()
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useSidebar())

      // Wait for useEffect to run
      await waitFor(() => {
        expect(result.current.isCollapsed).toBe(false)
      })

      expect(localStorageMock.getItem).toHaveBeenCalledWith("sidebar-collapsed")
    })

    it("should persist collapsed state to localStorage on desktop", async () => {
      // IMPORTANT: Reset and set return value BEFORE any rendering
      localStorageMock.getItem.mockReset()
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useSidebar())

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isCollapsed).toBe(false)
      })

      // Clear any previous calls
      localStorageMock.setItem.mockClear()

      act(() => {
        result.current.setCollapsed(true)
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith("sidebar-collapsed", "true")
    })

    it("should handle localStorage quota exceeded errors gracefully", async () => {
      // IMPORTANT: Reset and set return value BEFORE any rendering
      localStorageMock.getItem.mockReset()
      localStorageMock.getItem.mockReturnValue(null)

      // Mock setItem to throw error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("localStorage quota exceeded")
      })

      const { result } = renderHook(() => useSidebar())

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isCollapsed).toBe(false)
      })

      act(() => {
        result.current.setCollapsed(true)
      })

      // Should set error state
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe("localStorage quota exceeded")

      // But isCollapsed should still update
      expect(result.current.isCollapsed).toBe(true)

      // Reset setItem to default
      localStorageMock.setItem.mockImplementation(() => {})
    })

    it("should handle localStorage disabled errors gracefully", async () => {
      // IMPORTANT: Reset and set return value BEFORE any rendering
      localStorageMock.getItem.mockReset()
      localStorageMock.getItem.mockReturnValue(null)

      // Mock setItem to throw error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("localStorage is disabled")
      })

      const { result } = renderHook(() => useSidebar())

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isCollapsed).toBe(false)
      })

      act(() => {
        result.current.toggle()
      })

      // Should set error state
      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe("localStorage is disabled")

      // Reset setItem to default
      localStorageMock.setItem.mockImplementation(() => {})
    })

    it("should not persist isOpen state to localStorage", async () => {
      // IMPORTANT: Reset and set return value BEFORE any rendering
      localStorageMock.getItem.mockReset()
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useSidebar())

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isCollapsed).toBe(false)
      })

      // Clear any previous calls
      localStorageMock.setItem.mockClear()

      act(() => {
        result.current.open()
      })

      // isOpen should change but localStorage shouldn't be called
      expect(result.current.isOpen).toBe(true)
      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })
  })

  describe("Responsive Behavior", () => {
    it("should detect mobile viewport", async () => {
      // Set mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 500,
      })

      const { result } = renderHook(() => useSidebar())

      await waitFor(() => {
        expect(result.current.isMobile).toBe(true)
      })
    })

    it("should detect desktop viewport", () => {
      // Already desktop (set in beforeEach)
      const { result } = renderHook(() => useSidebar())

      expect(result.current.isMobile).toBe(false)
    })
  })

  describe("Error Handling", () => {
    it("should initialize with null error", () => {
      const { result } = renderHook(() => useSidebar())

      expect(result.current.error).toBeNull()
    })

    it("should expose error state", async () => {
      // IMPORTANT: Reset and set return value BEFORE any rendering
      localStorageMock.getItem.mockReset()
      localStorageMock.getItem.mockReturnValue(null)

      // Mock setItem to throw error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Test error")
      })

      const { result } = renderHook(() => useSidebar())

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isCollapsed).toBe(false)
      })

      act(() => {
        result.current.setCollapsed(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)
      expect(result.current.error?.message).toBe("Test error")

      // Reset setItem to default
      localStorageMock.setItem.mockImplementation(() => {})
    })

    it("should clear error when clearError is called", async () => {
      // IMPORTANT: Reset and set return value BEFORE any rendering
      localStorageMock.getItem.mockReset()
      localStorageMock.getItem.mockReturnValue(null)

      // Mock setItem to throw error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("Test error")
      })

      const { result } = renderHook(() => useSidebar())

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isCollapsed).toBe(false)
      })

      act(() => {
        result.current.setCollapsed(true)
      })

      expect(result.current.error).toBeInstanceOf(Error)

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()

      // Reset setItem to default
      localStorageMock.setItem.mockImplementation(() => {})
    })
  })

  describe("Defer-Read Pattern (Phase 1.7 Pattern #4)", () => {
    it("should use defer-read pattern for toggle callback", async () => {
      // IMPORTANT: Reset and set return value BEFORE any rendering
      localStorageMock.getItem.mockReset()
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useSidebar())

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isCollapsed).toBe(false)
      })

      // Toggle multiple times - callback reference should be stable
      const toggleCallback1 = result.current.toggle
      const toggleCallback2 = result.current.toggle

      expect(toggleCallback1).toBe(toggleCallback2)

      // Multiple calls should work
      act(() => {
        toggleCallback1()
        toggleCallback2()
      })

      expect(result.current.isCollapsed).toBe(false) // Reset after second toggle
    })

    it("should not create stale closures in callbacks", async () => {
      // IMPORTANT: Reset and set return value BEFORE any rendering
      localStorageMock.getItem.mockReset()
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useSidebar())

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isCollapsed).toBe(false)
      })

      // Capture callback
      const openCallback = result.current.open

      // Change state
      act(() => {
        result.current.open()
      })

      // Old callback should still work and use latest state
      act(() => {
        openCallback()
      })

      expect(result.current.isOpen).toBe(true)
    })

    it("should prevent callback recreation on every state change", async () => {
      // IMPORTANT: Reset and set return value BEFORE any rendering
      localStorageMock.getItem.mockReset()
      localStorageMock.getItem.mockReturnValue(null)

      const { result } = renderHook(() => useSidebar())

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.isCollapsed).toBe(false)
      })

      // Get initial callback references
      const toggleCallback1 = result.current.toggle
      const closeCallback1 = result.current.close

      // Trigger state change
      act(() => {
        result.current.toggle()
      })

      // Callbacks should have same reference (not recreated)
      expect(result.current.toggle).toBe(toggleCallback1)
      expect(result.current.close).toBe(closeCallback1)
    })
  })
})
