// hooks/useSidebar.ts

import { useState, useCallback, useRef, useEffect } from "react"
import { useIsMobile } from "./use-mobile"
import type { SidebarContextValue } from "@/types/sidebar"

/**
 * Main sidebar state management hook
 * Handles open/close, collapsed/expanded, localStorage persistence
 * Phase 1.7 Pattern #4: Defer-Read Pattern for callbacks
 * Phase 1.7 Pattern #7: Error State Exposure
 */
export function useSidebar(): SidebarContextValue {
  const isMobile = useIsMobile()

  // Helper function to read from localStorage
  const readCollapsedState = useCallback(() => {
    // On mobile, always return false
    if (isMobile) return false

    try {
      const stored = localStorage.getItem("sidebar-collapsed")
      return stored === "true"
    } catch {
      return false
    }
  }, [isMobile])

  // State
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Initialize collapsed state from localStorage on mount
  useEffect(() => {
    setIsCollapsed(readCollapsedState())
  }, [readCollapsedState])

  // Phase 1.7 Pattern #4: Defer-Read Pattern
  // Track current state without triggering re-renders
  const isMobileRef = useRef(isMobile)
  const isCollapsedRef = useRef(isCollapsed)
  const isOpenRef = useRef(isOpen)

  useEffect(() => {
    isMobileRef.current = isMobile
  }, [isMobile])

  useEffect(() => {
    isCollapsedRef.current = isCollapsed
  }, [isCollapsed])

  useEffect(() => {
    isOpenRef.current = isOpen
  }, [isOpen])

  // Actions - use defer-read pattern
  const open = useCallback(() => setIsOpen(true), [])

  const close = useCallback(() => setIsOpen(false), [])

  const toggle = useCallback(() => {
    // Read from ref, not state (defer-read pattern)
    const currentIsMobile = isMobileRef.current

    if (currentIsMobile) {
      setIsOpen(prev => !prev)
    } else {
      setIsCollapsed(prev => {
        const newValue = !prev
        try {
          localStorage.setItem("sidebar-collapsed", String(newValue))
        } catch (err) {
          setError(err instanceof Error ? err : new Error("Failed to save sidebar state"))
        }
        return newValue
      })
    }
  }, []) // No deps - reads from refs

  const setCollapsed = useCallback((collapsed: boolean) => {
    // Read from ref, not state (defer-read pattern)
    const currentIsMobile = isMobileRef.current

    if (!currentIsMobile) {
      setIsCollapsed(collapsed)
      try {
        localStorage.setItem("sidebar-collapsed", String(collapsed))
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to save sidebar state"))
      }
    }
  }, []) // No deps - reads from refs

  const clearError = useCallback(() => setError(null), [])

  // Computed state
  const state = isCollapsed ? "collapsed" : "expanded"

  return {
    isOpen,
    isCollapsed,
    isMobile,
    state,
    open,
    close,
    toggle,
    setCollapsed,
    error,
    clearError
  }
}
