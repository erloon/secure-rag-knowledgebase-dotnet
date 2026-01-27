// contexts/SidebarContext.tsx

import { createContext, useContext, ReactNode, useMemo } from "react"
import type { ReactElement } from "react"
import { useSidebar } from "@/hooks/useSidebar"
import type { SidebarContextValue } from "@/types/sidebar"

/**
 * Global sidebar context
 * Shares sidebar state across component tree
 * Phase 1.7 Pattern #1: Context Interface Completeness
 */
const SidebarContext = createContext<SidebarContextValue | null>(null)

/**
 * Props for sidebar provider component
 */
export interface SidebarProviderProps {
  children: ReactNode
}

/**
 * Provider component for sidebar context
 * Wraps useSidebar hook to share state across component tree
 * Phase 1.7 Pattern #3: Context Value Memoization
 */
export function SidebarProvider({ children }: SidebarProviderProps): ReactElement {
  // Use the useSidebar hook to get sidebar state and actions
  const sidebarState = useSidebar()

  // Phase 1.7 Pattern #3: Memoize context value to prevent unnecessary re-renders
  const memoizedValue = useMemo<SidebarContextValue>(
    () => sidebarState,
    [sidebarState]
  )

  return <SidebarContext.Provider value={memoizedValue}>{children}</SidebarContext.Provider>
}

/**
 * Hook to use sidebar context
 * @throws Error if used outside of SidebarProvider
 */
export function useSidebarContext(): SidebarContextValue {
  const context = useContext(SidebarContext)

  if (!context) {
    throw new Error("useSidebarContext must be used within SidebarProvider")
  }

  return context
}
