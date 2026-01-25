// components/chat/AIChatInterface.tsx

import { memo } from "react"
import { ChatHeader } from "./ChatHeader"
import { ConversationContainer } from "./ConversationContainer"
import { PromptInputAdapter } from "./PromptInputAdapter"
import { useAIChatContext } from "@/contexts/AIChatContext"
import type { AIModel, DataSourceFile } from "@/types/chat"
import type { MemoizedComponent } from "@/types/components"

/**
 * Props for AIChatInterface component
 */
export interface AIChatInterfaceProps {
  /** Available AI models */
  models: AIModel[]
  /** Available data source files */
  availableFiles: DataSourceFile[]
  /** Optional callback when copy is clicked */
  onCopy?: (content: string) => Promise<void>
  /** Optional callback when regenerate is clicked */
  onRegenerate?: (messageId: string) => Promise<void>
  /** Whether to show action buttons on messages */
  showActions?: boolean
  /** Empty state title */
  emptyTitle?: string
  /** Empty state description */
  emptyDescription?: string
  /** Additional CSS class name */
  className?: string
}

/**
 * AIChatInterface - Root component composing all chat interface components.
 *
 * This component brings together the entire chat UI:
 * - ChatHeader: Model selector and data source indicator
 * - ConversationContainer: Message display with auto-scroll
 * - PromptInputAdapter: Input area with attachment support
 *
 * Follows Phase 1.7 conventions:
 * - MemoizedComponent<T> type for React.memo
 * - Context integration for shared state
 * - Consistent callback forwarding pattern
 *
 * @example
 * ```tsx
 * <AIChatInterface
 *   models={models}
 *   availableFiles={files}
 *   onCopy={handleCopy}
 *   onRegenerate={handleRegenerate}
 *   emptyTitle="Start chatting"
 *   emptyDescription="Ask a question to begin"
 * />
 * ```
 */
export const AIChatInterface: MemoizedComponent<AIChatInterfaceProps> = memo(
  function AIChatInterface({
    models,
    availableFiles,
    onCopy,
    onRegenerate,
    showActions = true,
    emptyTitle = "No messages yet",
    emptyDescription = "Start a conversation to see messages here",
    className = "",
  }) {
    const { isStreaming, stopStreaming } = useAIChatContext()

    return (
      <div
        className={`flex flex-col h-full gap-4 ${className}`.trim()}
        role="region"
        aria-label="AI chat interface"
      >
        {/* Header with model selector and data source indicator */}
        <ChatHeader models={models} availableFiles={availableFiles} />

        {/* Conversation area with message display and auto-scroll */}
        <div className="flex-1 min-h-0">
          <ConversationContainer
            onCopy={onCopy}
            onRegenerate={onRegenerate}
            showActions={showActions}
            emptyTitle={emptyTitle}
            emptyDescription={emptyDescription}
          />
        </div>

        {/* Input area with prompt input and attachments */}
        <PromptInputAdapter
          disabled={isStreaming}
          onStop={stopStreaming}
        />
      </div>
    )
  }
)
