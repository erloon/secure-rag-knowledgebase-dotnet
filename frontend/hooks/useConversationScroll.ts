// hooks/useConversationScroll.ts

import { useRef, useState, useEffect, useCallback } from "react"

export interface UseConversationScrollParams {
  /** Auto-scroll to bottom on new messages */
  autoScroll?: boolean
  /** Smooth scrolling */
  smooth?: boolean
  /** Container ref */
  containerRef?: React.RefObject<HTMLDivElement>
}

export interface UseConversationScrollReturn {
  scrollRef: React.RefObject<HTMLDivElement | null>
  isAtBottom: boolean
  scrollToBottom: () => void
  scrollToTop: () => void
}

/**
 * Auto-scroll management for conversation
 * Tracks scroll position and shows/hides scroll button
 */
export function useConversationScroll(
  params: UseConversationScrollParams = {}
): UseConversationScrollReturn {
  const { autoScroll = true, smooth = true, containerRef } = params

  // Use provided ref or create our own
  const internalScrollRef = useRef<HTMLDivElement>(null)
  const scrollRef = containerRef ?? internalScrollRef

  const [isAtBottom, setIsAtBottom] = useState(true)

  // Threshold for considering "at bottom" (in pixels)
  const BOTTOM_THRESHOLD = 50

  // Check if we're at the bottom
  const checkIsAtBottom = useCallback(() => {
    const element = scrollRef.current
    if (!element) return true

    const { scrollTop, scrollHeight, clientHeight } = element
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    return distanceFromBottom <= BOTTOM_THRESHOLD
  }, [scrollRef])

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    const element = scrollRef.current
    if (!element) return

    if (smooth) {
      element.scrollTo({
        top: element.scrollHeight,
        behavior: "smooth"
      })
    } else {
      element.scrollTop = element.scrollHeight
    }
  }, [scrollRef, smooth])

  // Scroll to top
  const scrollToTop = useCallback(() => {
    const element = scrollRef.current
    if (!element) return

    if (smooth) {
      element.scrollTo({
        top: 0,
        behavior: "smooth"
      })
    } else {
      element.scrollTop = 0
    }
  }, [scrollRef, smooth])

  // Handle scroll events
  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    const handleScroll = () => {
      setIsAtBottom(checkIsAtBottom())
    }

    // Initial check
    handleScroll()

    // Add event listener
    element.addEventListener("scroll", handleScroll)

    // Cleanup
    return () => {
      element.removeEventListener("scroll", handleScroll)
    }
  }, [scrollRef, checkIsAtBottom])

  // Auto-scroll when content changes (if enabled)
  useEffect(() => {
    if (!autoScroll || !isAtBottom) return

    // Small delay to ensure DOM has updated
    const timer = setTimeout(() => {
      scrollToBottom()
    }, 0)

    return () => clearTimeout(timer)
  }, [autoScroll, isAtBottom, scrollToBottom])

  return {
    scrollRef,
    isAtBottom,
    scrollToBottom,
    scrollToTop
  }
}
