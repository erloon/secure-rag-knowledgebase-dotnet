// contexts/AIChatContext.tsx

import { createContext, useContext, ReactNode } from "react"
import type { ReactElement } from "react"
import type { ChatMessage, AIModel, DataSourceFile } from "@/types/chat"

/**
 * Global AI chat context value
 */
export interface AIChatContextValue {
  // State
  messages: ChatMessage[]
  selectedModel: AIModel
  selectedSources: DataSourceFile[]
  isStreaming: boolean

  // Actions
  sendMessage: (content: string) => Promise<void>
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
  return <AIChatContext.Provider value={value}>{children}</AIChatContext.Provider>
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
