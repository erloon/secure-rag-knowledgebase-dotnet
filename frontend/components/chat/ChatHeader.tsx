// components/chat/ChatHeader.tsx

import { memo } from "react"
import { useAIChatContext } from "@/contexts/AIChatContext"
import { ModelSelectorAdapter } from "./ModelSelectorAdapter"
import { DataSourceSelector } from "./DataSourceSelector"
import type { AIModel, DataSourceFile } from "@/types/chat"
import type { MemoizedComponent } from "@/types/components"

/**
 * Props for ChatHeader component
 */
export interface ChatHeaderProps {
  /** Available AI models */
  models: AIModel[]
  /** Available data source files */
  availableFiles: DataSourceFile[]
}

/**
 * ChatHeader - Composes ModelSelectorAdapter and DataSourceSelector in a header.
 * Displays selected sources count and provides quick access to model selection.
 *
 * Follows Phase 1.7 conventions:
 * - MemoizedComponent<T> type for React.memo
 * - Context integration for shared state
 * - Clean composition of adapter components
 *
 * @example
 * ```tsx
 * <ChatHeader models={models} availableFiles={files} />
 * ```
 */
export const ChatHeader: MemoizedComponent<ChatHeaderProps> = memo(function ChatHeader({
  models,
  availableFiles,
}) {
  const { selectedSources } = useAIChatContext()

  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      {/* Left side: Model selector */}
      <div className="flex items-center gap-3">
        <ModelSelectorAdapter models={models} />
      </div>

      {/* Right side: Data source selector with count indicator */}
      <div className="flex items-center gap-2">
        <DataSourceSelector availableFiles={availableFiles} />
        {selectedSources.length > 0 && (
          <span className="text-muted-foreground text-sm">
            {selectedSources.length} file{selectedSources.length !== 1 ? "s" : ""} selected
          </span>
        )}
      </div>
    </div>
  )
})
