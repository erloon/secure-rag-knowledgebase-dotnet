// contexts/__tests__/SidebarContext.test.tsx

import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals"
import { render, screen, act, cleanup } from "@testing-library/react"
import { SidebarProvider, useSidebarContext } from "../SidebarContext"
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

describe("SidebarContext", () => {
  beforeEach(() => {
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

  afterEach(() => {
    cleanup()
    // Restore window.innerWidth
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
  })

  describe("Basic Provider Functionality", () => {
    it("should render children when provider is used", () => {
      render(
        <SidebarProvider>
          <div>Test Child</div>
        </SidebarProvider>
      )

      expect(screen.getByText("Test Child")).toBeInTheDocument()
    })

    it("should provide context value to consumers", () => {
      const TestComponent = () => {
        const context = useSidebarContext()
        return (
          <div>
            <span data-testid="is-open">{String(context.isOpen)}</span>
            <span data-testid="is-collapsed">{String(context.isCollapsed)}</span>
            <span data-testid="is-mobile">{String(context.isMobile)}</span>
            <span data-testid="state">{context.state}</span>
          </div>
        )
      }

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      )

      expect(screen.getByTestId("is-open")).toHaveTextContent("false")
      expect(screen.getByTestId("is-collapsed")).toHaveTextContent("false")
      expect(screen.getByTestId("is-mobile")).toHaveTextContent("false")
      expect(screen.getByTestId("state")).toHaveTextContent("expanded")
    })

    it("should throw error when useSidebarContext used without provider", () => {
      // Suppress console.error for this test
      const consoleError = console.error
      console.error = jest.fn()

      const TestComponent = () => {
        useSidebarContext()
        return <div>Test</div>
      }

      expect(() => {
        render(<TestComponent />)
      }).toThrow("useSidebarContext must be used within SidebarProvider")

      console.error = consoleError
    })

    it("should update context when state changes", () => {
      const TestComponent = () => {
        const context = useSidebarContext()
        return (
          <div>
            <span data-testid="is-collapsed">{String(context.isCollapsed)}</span>
            <button onClick={() => context.setCollapsed(true)}>Toggle</button>
          </div>
        )
      }

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      )

      expect(screen.getByTestId("is-collapsed")).toHaveTextContent("false")

      act(() => {
        screen.getByText("Toggle").click()
      })

      expect(screen.getByTestId("is-collapsed")).toHaveTextContent("true")
    })
  })

  describe("State Management", () => {
    it("should initialize with default collapsed state from localStorage", () => {
      localStorageMock.getItem.mockReturnValue("true")

      const TestComponent = () => {
        const context = useSidebarContext()
        return <span data-testid="is-collapsed">{String(context.isCollapsed)}</span>
      }

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      )

      expect(screen.getByTestId("is-collapsed")).toHaveTextContent("true")
    })

    it("should initialize with isMobile detection", () => {
      // Set mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 500,
      })

      const TestComponent = () => {
        const context = useSidebarContext()
        return <span data-testid="is-mobile">{String(context.isMobile)}</span>
      }

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      )

      expect(screen.getByTestId("is-mobile")).toHaveTextContent("true")
    })

    it("should toggle isOpen state", () => {
      const TestComponent = () => {
        const context = useSidebarContext()
        return (
          <div>
            <span data-testid="is-open">{String(context.isOpen)}</span>
            <button onClick={context.open}>Open</button>
            <button onClick={context.close}>Close</button>
            <button onClick={context.toggle}>Toggle</button>
          </div>
        )
      }

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      )

      expect(screen.getByTestId("is-open")).toHaveTextContent("false")

      act(() => {
        screen.getByText("Open").click()
      })

      expect(screen.getByTestId("is-open")).toHaveTextContent("true")

      act(() => {
        screen.getByText("Close").click()
      })

      expect(screen.getByTestId("is-open")).toHaveTextContent("false")
    })

    it("should toggle isCollapsed state", async () => {
      // IMPORTANT: Reset and set return value BEFORE any rendering
      // This ensures the mock returns the correct value during component mount
      localStorageMock.getItem.mockReset()
      localStorageMock.getItem.mockReturnValue(null)

      const TestComponent = () => {
        const context = useSidebarContext()
        return (
          <div>
            <span data-testid="is-collapsed">{String(context.isCollapsed)}</span>
            <button onClick={context.toggle}>Toggle</button>
          </div>
        )
      }

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      )

      // Wait for useEffect to run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(screen.getByTestId("is-collapsed")).toHaveTextContent("false")

      await act(async () => {
        screen.getByText("Toggle").click()
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(screen.getByTestId("is-collapsed")).toHaveTextContent("true")

      await act(async () => {
        screen.getByText("Toggle").click()
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(screen.getByTestId("is-collapsed")).toHaveTextContent("false")
    })

    it("should compute correct state string", async () => {
      // IMPORTANT: Reset and set return value BEFORE any rendering
      localStorageMock.getItem.mockReset()
      localStorageMock.getItem.mockReturnValue(null)

      const TestComponent = () => {
        const context = useSidebarContext()
        return (
          <div>
            <span data-testid="state">{context.state}</span>
            <button onClick={() => context.setCollapsed(true)}>Collapse</button>
          </div>
        )
      }

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      )

      // Wait for useEffect to run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(screen.getByTestId("state")).toHaveTextContent("expanded")

      await act(async () => {
        screen.getByText("Collapse").click()
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(screen.getByTestId("state")).toHaveTextContent("collapsed")
    })
  })

  describe("localStorage Persistence", () => {
    it("should read initial collapsed state from localStorage", async () => {
      // IMPORTANT: Reset and set return value BEFORE any rendering
      localStorageMock.getItem.mockReset()
      localStorageMock.getItem.mockReturnValue("true")

      const TestComponent = () => {
        const context = useSidebarContext()
        return <span data-testid="is-collapsed">{String(context.isCollapsed)}</span>
      }

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      )

      // Wait for useEffect to run and read from localStorage
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(localStorageMock.getItem).toHaveBeenCalledWith("sidebar-collapsed")
      expect(screen.getByTestId("is-collapsed")).toHaveTextContent("true")
    })

    it("should save collapsed state to localStorage on change", async () => {
      // IMPORTANT: Reset and set return value BEFORE any rendering
      localStorageMock.getItem.mockReset()
      localStorageMock.getItem.mockReturnValue(null)

      const TestComponent = () => {
        const context = useSidebarContext()
        return (
          <div>
            <button onClick={() => context.setCollapsed(true)}>Set Collapsed</button>
          </div>
        )
      }

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      )

      // Wait for useEffect to run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(screen.getByText("Set Collapsed")).toBeInTheDocument()

      // Clear any previous calls
      localStorageMock.setItem.mockClear()

      await act(async () => {
        screen.getByText("Set Collapsed").click()
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(localStorageMock.setItem).toHaveBeenCalledWith("sidebar-collapsed", "true")
    })

    it("should not persist isOpen state (mobile only)", () => {
      const TestComponent = () => {
        const context = useSidebarContext()
        return (
          <div>
            <button onClick={context.open}>Open</button>
          </div>
        )
      }

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      )

      act(() => {
        screen.getByText("Open").click()
      })

      // isOpen should not be saved to localStorage
      expect(localStorageMock.setItem).not.toHaveBeenCalledWith("sidebar-open", expect.anything())
    })
  })

  describe("Error Handling (Phase 1.7 Pattern #7)", () => {
    it("should expose error state through context", () => {
      const TestComponent = () => {
        const context = useSidebarContext()
        return <span data-testid="error">{context.error?.message ?? "No error"}</span>
      }

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      )

      expect(screen.getByTestId("error")).toHaveTextContent("No error")
    })

    it("should provide clearError method", () => {
      const TestComponent = () => {
        const context = useSidebarContext()
        return (
          <div>
            <span data-testid="error">{context.error?.message ?? "No error"}</span>
            <button onClick={context.clearError}>Clear Error</button>
            <button onClick={() => context.setCollapsed(false)}>Trigger Action</button>
          </div>
        )
      }

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      )

      // Initially no error
      expect(screen.getByTestId("error")).toHaveTextContent("No error")

      // clearError should be callable without error
      act(() => {
        screen.getByText("Clear Error").click()
      })

      expect(screen.getByTestId("error")).toHaveTextContent("No error")
    })

    it("should clear error when clearError is called", async () => {
      // IMPORTANT: Reset and set return value BEFORE any rendering
      localStorageMock.getItem.mockReset()
      localStorageMock.getItem.mockReturnValue(null)

      const TestComponent = () => {
        const context = useSidebarContext()
        return (
          <div>
            <span data-testid="error">{context.error?.message ?? "No error"}</span>
            <button onClick={() => context.setCollapsed(true)}>Trigger Error</button>
            <button onClick={context.clearError}>Clear Error</button>
          </div>
        )
      }

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      )

      // Wait for component to mount
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(screen.getByText("Trigger Error")).toBeInTheDocument()

      // Set up localStorage to throw error AFTER mount
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("localStorage quota exceeded")
      })

      // Trigger an error
      await act(async () => {
        screen.getByText("Trigger Error").click()
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(screen.getByTestId("error")).toHaveTextContent("localStorage quota exceeded")

      // Clear the error
      await act(async () => {
        screen.getByText("Clear Error").click()
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(screen.getByTestId("error")).toHaveTextContent("No error")
    })
  })

  describe("Context Value Memoization (Phase 1.7 Pattern #3)", () => {
    it("should return stable context value across re-renders (reference stability)", async () => {
      let contextInstance1: SidebarContextValue | null = null
      let contextInstance2: SidebarContextValue | null = null
      let renderCount = 0

      const TestComponent = () => {
        const context = useSidebarContext()
        renderCount++

        // Capture context instances
        if (renderCount === 1) contextInstance1 = context
        if (renderCount === 2) contextInstance2 = context

        return <span>Test</span>
      }

      const { rerender } = render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      )

      // Wait for useEffect to run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      const initialRenderCount = renderCount

      // Re-render with same state - should not create new context reference
      await act(async () => {
        rerender(
          <SidebarProvider>
            <TestComponent />
          </SidebarProvider>
        )
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Context reference should be stable (same object reference)
      expect(contextInstance1).toStrictEqual(contextInstance2)
    })

    it("should create new context value when state reference changes", async () => {
      // IMPORTANT: Reset and set return value BEFORE any rendering
      localStorageMock.getItem.mockReset()
      localStorageMock.getItem.mockReturnValue(null)

      let contextChangeCount = 0
      let lastContext: SidebarContextValue | null = null

      const TestComponent = () => {
        const context = useSidebarContext()
        if (lastContext !== context) {
          contextChangeCount++
          lastContext = context
        }
        return (
          <div>
            <span data-testid="state">{context.state}</span>
            <button onClick={() => context.setCollapsed(true)}>Change State</button>
          </div>
        )
      }

      render(
        <SidebarProvider>
          <TestComponent />
        </SidebarProvider>
      )

      // Wait for useEffect to run
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      expect(screen.getByTestId("state")).toHaveTextContent("expanded")

      const initialChangeCount = contextChangeCount
      const initialState = screen.getByTestId("state").textContent

      // Change state - should create new context reference
      await act(async () => {
        screen.getByText("Change State").click()
        await new Promise(resolve => setTimeout(resolve, 0))
      })

      // Context should change when state changes
      expect(contextChangeCount).toBeGreaterThan(initialChangeCount)

      // State should have actually changed
      expect(screen.getByTestId("state").textContent).not.toBe(initialState)
    })
  })
})
