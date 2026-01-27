/**
 * Sidebar type definitions
 * Defines interfaces for sidebar navigation, context, and components
 * Follows Phase 1.7 conventions (complete interface, error state exposure)
 */

import type { LucideIcon } from "lucide-react"

/**
 * Navigation item structure for sidebar menu
 * Single source of truth for navigation configuration
 */
export interface NavItem {
  /** Display title for the navigation item */
  title: string
  /** URL path for navigation (e.g., '/chat', '/documents') */
  href: string
  /** Lucide React icon component */
  icon: LucideIcon
  /** Optional description for tooltips/aria labels */
  description?: string
  /** Optional badge text (e.g., 'New', '3') */
  badge?: string
  /** Whether the item is disabled */
  disabled?: boolean
  /** Active state (computed from pathname by component) */
  isActive?: boolean
}

/**
 * Complete sidebar context interface
 * Exposes ALL state and actions from useSidebar hook to consumers
 * Phase 1.7 Pattern #1: Context Interface Completeness
 * Phase 1.7 Pattern #7: Error State Exposure
 */
export interface SidebarContextValue {
  // State
  /** Mobile: whether sidebar is open (overlay) */
  isOpen: boolean
  /** Desktop: whether sidebar is collapsed (icon-only) */
  isCollapsed: boolean
  /** Responsive breakpoint detection */
  isMobile: boolean
  /** Computed state string for easier consumption */
  state: "expanded" | "collapsed"

  // Actions
  /** Open sidebar (mobile overlay) */
  open: () => void
  /** Close sidebar (mobile overlay) */
  close: () => void
  /** Toggle sidebar state (mobile or desktop) */
  toggle: () => void
  /** Set collapsed state (desktop) */
  setCollapsed: (collapsed: boolean) => void

  // Error Handling (Phase 1.7 Pattern #7)
  /** Current error state, if any */
  error: Error | null
  /** Clear any active error */
  clearError: () => void
}

/**
 * Props for sidebar header component
 */
export interface SidebarHeaderProps {
  /** Optional additional CSS classes */
  className?: string
}

/**
 * Props for sidebar navigation component
 */
export interface SidebarNavProps {
  /** Array of navigation items to render */
  items: NavItem[]
}

/**
 * Props for individual sidebar navigation item
 */
export interface SidebarNavItemProps {
  /** Navigation item data */
  item: NavItem
  /** Whether this item is currently active */
  isActive: boolean
}

/**
 * Props for sidebar footer component
 */
export interface SidebarFooterProps {
  /** User information for display */
  user?: {
    /** User's display name */
    name: string
    /** User's email address */
    email: string
    /** Optional avatar URL */
    avatar?: string
  }
}
