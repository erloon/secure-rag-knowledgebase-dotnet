// contexts/AIChatContext.tsx

import { createContext, useContext, ReactNode, useMemo } from "react"
import type { ReactElement } from "react"
import type { ChatMessage, AIModel, DataSourceFile } from "@/types/chat"

/**
 * Global AI chat context value
 * Exposes all state and actions from useAIChat hook to consumers
 */
export interface AIChatContextValue {
  // State
  messages: ChatMessage[]
  selectedModel: AIModel | null  // Nullable - may not be selected initially
  selectedSources: DataSourceFile[]
  isStreaming: boolean
  error: Error | null  // Expose error state for UI display

  // Actions
  sendMessage: (content: string) => Promise<void>
  regenerateResponse: (messageId: string) => Promise<void>
  stopStreaming: () => void
  clearError: () => void
  clearMessages: () => void

  // Selection
  selectModel: (model: AIModel) => void
  toggleSource: (sourceId: string) => void
}

/**
 * Global AI chat context
 * Shares state across component tree
 */
const AIChatContext = createContext<AIChatContextValue | null>(null)

/**
 * Provider component for AI chat context
 */
export interface AIChatProviderProps {
  children: ReactNode
  value: AIChatContextValue
}

export function AIChatProvider({ children, value }: AIChatProviderProps): ReactElement {
  // Memoize context value to prevent unnecessary re-renders of consumers
  // when the parent component updates but the context value hasn't changed
  const memoizedValue = useMemo(() => value, [value])

  return <AIChatContext.Provider value={memoizedValue}>{children}</AIChatContext.Provider>
}

/**
 * Hook to use AI chat context
 * @throws Error if used outside of AIChatProvider
 */
export function useAIChatContext(): AIChatContextValue {
  const context = useContext(AIChatContext)

  if (!context) {
    throw new Error("useAIChatContext must be used within AIChatProvider")
  }

  return context
}
