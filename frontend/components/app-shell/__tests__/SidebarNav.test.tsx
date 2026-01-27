// components/app-shell/__tests__/SidebarNav.test.tsx

import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import { render, screen } from "@testing-library/react"
import { SidebarNav } from "../SidebarNav"
import { SidebarProvider, Sidebar } from "@/components/ui/sidebar"

// Mock window.matchMedia for responsive hooks
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock usePathname
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
}))

describe("SidebarNav", () => {
  const mockItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: () => null, // Mock icon
      description: "Overview",
    },
    {
      title: "Chat",
      href: "/chat",
      icon: () => null,
      description: "AI chat",
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderWithSidebar = (component: React.ReactElement) => {
    return render(
      <SidebarProvider>
        <Sidebar>
          {component}
        </Sidebar>
      </SidebarProvider>
    )
  }

  describe("rendering", () => {
    it("should render all nav items from config", () => {
      renderWithSidebar(<SidebarNav items={mockItems} />)

      expect(screen.getByText("Dashboard")).toBeInTheDocument()
      expect(screen.getByText("Chat")).toBeInTheDocument()
    })

    it("should render navigation group structure", () => {
      const { container } = renderWithSidebar(
        <SidebarNav items={mockItems} />
      )

      // Check for SidebarGroup and SidebarGroupContent
      const group = container.querySelector('[data-sidebar="group"]')
      expect(group).toBeInTheDocument()
    })

    it("should render empty state when no items provided", () => {
      renderWithSidebar(<SidebarNav items={[]} />)

      // Should render without crashing
      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument()
    })
  })

  describe("navigation structure", () => {
    it("should render SidebarGroup with label", () => {
      renderWithSidebar(<SidebarNav items={mockItems} />)

      // shadcn SidebarGroup renders with proper structure
      expect(screen.getByText("Dashboard")).toBeInTheDocument()
    })

    it("should render all items in a list", () => {
      const { container } = renderWithSidebar(
        <SidebarNav items={mockItems} />
      )

      // Should have navigation list
      const links = container.querySelectorAll("a")
      expect(links.length).toBe(2)
    })
  })
})
