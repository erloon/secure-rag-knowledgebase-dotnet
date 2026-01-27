/**
 * Navigation configuration for main sidebar
 * Single source of truth for application navigation
 */

import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Settings,
  type LucideIcon,
} from "lucide-react"
import type { NavItem } from "@/types/sidebar"

/**
 * Main application navigation items
 * Ordered by appearance in sidebar
 */
export const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Overview and recent activity",
  },
  {
    title: "Chat",
    href: "/chat",
    icon: MessageSquare,
    description: "AI-powered knowledge search",
  },
  {
    title: "Documents",
    href: "/documents",
    icon: FileText,
    description: "Document management",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "App configuration",
  },
]

/**
 * Find the active navigation item for a given pathname
 * Supports both exact and nested route matching
 *
 * @param pathname - Current route pathname
 * @returns Active NavItem or null if no match
 *
 * @example
 * ```typescript
 * // Exact match
 * getActiveNavItem("/chat") // Returns Chat nav item
 *
 * // Nested match (e.g., /documents/[id])
 * getActiveNavItem("/documents/abc123") // Returns Documents nav item
 *
 * // No match
 * getActiveNavItem("/unknown") // Returns null
 * ```
 */
export function getActiveNavItem(pathname: string | null): NavItem | null {
  // Handle null pathname (e.g., during testing or initial render)
  if (!pathname) return null

  // Try exact match first
  const exactMatch = mainNavItems.find((item) => item.href === pathname)
  if (exactMatch) return exactMatch

  // Try nested route match (e.g., /documents/123 → /documents)
  const nestedMatch = mainNavItems.find((item) =>
    pathname.startsWith(`${item.href}/`)
  )
  return nestedMatch || null
}

/**
 * Check if a navigation item is active for the given pathname
 * Helper function for component active state calculation
 *
 * @param item - Navigation item to check
 * @param pathname - Current route pathname
 * @returns true if the item is active
 *
 * @example
 * ```typescript
 * const isActive = isNavItemActive(chatItem, "/chat")
 * // Returns: true
 *
 * const isActive = isNavItemActive(docsItem, "/documents/abc123")
 * // Returns: true (nested match)
 *
 * const isActive = isNavItemActive(chatItem, "/documents")
 * // Returns: false
 * ```
 */
export function isNavItemActive(item: NavItem, pathname: string | null): boolean {
  // Handle null pathname
  if (!pathname) return false

  // Exact match
  if (item.href === pathname) return true

  // Nested match (e.g., /documents/[id] → /documents)
  if (pathname.startsWith(`${item.href}/`)) return true

  return false
}
