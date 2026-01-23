// components/chat/ConversationContainer.tsx

import { memo, useMemo } from "react"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation"
import { MessageAdapter } from "./MessageAdapter"
import { MessageSquareIcon } from "lucide-react"
import { useAIChatContext } from "@/contexts/AIChatContext"
import type { ChatMessage } from "@/types/chat"
import type { MemoizedComponent } from "@/types/components"

/**
 * Props for ConversationContainer component
 */
export interface ConversationContainerProps {
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
}

/**
 * ConversationContainer - Auto-scrolling conversation display using AI Elements.
 *
 * This component wraps the Conversation and ConversationContent from AI Elements
 * to create a chat interface that:
 * - Auto-scrolls to the latest message
 * - Shows a scroll button when user scrolls up
 * - Displays empty state when no messages exist
 * - Renders messages using MessageAdapter
 *
 * Follows Phase 1.7 conventions:
 * - MemoizedComponent<T> type for React.memo
 * - useMemo for computed values (message list)
 * - Context integration for shared state
 *
 * @example
 * ```tsx
 * <ConversationContainer
 *   onCopy={handleCopy}
 *   onRegenerate={handleRegenerate}
 *   showActions={true}
 *   emptyTitle="Start a conversation"
 *   emptyDescription="Ask a question to get started"
 * />
 * ```
 */
export const ConversationContainer: MemoizedComponent<ConversationContainerProps> = memo(
  function ConversationContainer({
    onCopy,
    onRegenerate,
    showActions = true,
    emptyTitle = "No messages yet",
    emptyDescription = "Start a conversation to see messages here",
  }) {
    const { messages } = useAIChatContext()

    // Memoize message list to prevent unnecessary re-renders
    const messageList = useMemo(() => {
      if (messages.length === 0) {
        return null
      }

      return messages.map((message: ChatMessage) => (
        <MessageAdapter
          key={message.id}
          message={message}
          onCopy={onCopy}
          onRegenerate={onRegenerate}
          showActions={showActions}
        />
      ))
    }, [messages, onCopy, onRegenerate, showActions])

    return (
      <Conversation className="h-full">
        <ConversationContent>
          {messageList || (
            <ConversationEmptyState
              title={emptyTitle}
              description={emptyDescription}
              icon={<MessageSquareIcon className="size-8" />}
            />
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
    )
  }
)
