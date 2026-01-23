// components/chat/MessageAdapter.tsx

import { memo, useMemo, useCallback } from "react"
import { Copy, RefreshCw, Loader2 } from "lucide-react"
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageActions,
  MessageAction,
} from "@/components/ai-elements/message"
import { toAIElementMessage } from "@/lib/ai-element-adapters"
import type { ChatMessage } from "@/types/chat"
import type { MemoizedComponent } from "@/types/components"

/**
 * Props for MessageAdapter component
 */
export interface MessageAdapterProps {
  /** The message to render */
  message: ChatMessage
  /** Optional callback when copy is clicked */
  onCopy?: (content: string) => Promise<void>
  /** Optional callback when regenerate is clicked */
  onRegenerate?: (messageId: string) => Promise<void>
  /** Whether to show action buttons */
  showActions?: boolean
}

/**
 * MessageAdapter - Renders ChatMessage using AI Elements Message component.
 * Bridges our custom ChatMessage type to the shadcn AI Elements UI.
 *
 * Follows Phase 1.7 conventions:
 * - MemoizedComponent<T> type for React.memo
 * - useMemo for computed values (aiMessage conversion)
 * - useCallback for stable callbacks
 *
 * @example
 * ```tsx
 * <MessageAdapter
 *   message={message}
 *   onCopy={handleCopy}
 *   onRegenerate={handleRegenerate}
 *   showActions={true}
 * />
 * ```
 */
export const MessageAdapter: MemoizedComponent<MessageAdapterProps> = memo(function MessageAdapter({
  message,
  onCopy,
  onRegenerate,
  showActions = true,
}) {
  // Convert ChatMessage to AIElementMessage using adapter utility
  // Memoized to prevent unnecessary re-conversion on re-renders
  const aiMessage = useMemo(() => toAIElementMessage(message), [message])

  // Message role determines styling (user vs assistant)
  const from = message.role satisfies "user" | "assistant" | "system"

  // Show loading indicator for streaming messages
  const isStreaming = message.status === "streaming"

  // Handle copy action - stable callback with useCallback
  const handleCopy = useCallback(async () => {
    if (onCopy) {
      await onCopy(message.content)
    }
  }, [message.content, onCopy])

  // Handle regenerate action - stable callback with useCallback
  const handleRegenerate = useCallback(async () => {
    if (onRegenerate) {
      await onRegenerate(message.id)
    }
  }, [message.id, onRegenerate])

  // Determine if actions should be shown
  // Only show for assistant messages with completed or error status
  const shouldShowActions = showActions && from === "assistant" && !isStreaming

  return (
    <Message from={from}>
      <MessageContent>
        {isStreaming && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="size-4 animate-spin" />
            <span>Thinking...</span>
          </div>
        )}
        {!isStreaming && message.content && (
          <MessageResponse>{message.content}</MessageResponse>
        )}
        {message.annotations?.reasoning && !isStreaming && (
          <details className="mt-2 group/details">
            <summary className="cursor-pointer text-muted-foreground text-sm hover:text-foreground">
              View reasoning
            </summary>
            <div className="mt-2 rounded-md bg-muted/50 p-3 text-sm">
              <MessageResponse>{message.annotations.reasoning}</MessageResponse>
            </div>
          </details>
        )}
      </MessageContent>

      {/* Action buttons for assistant messages */}
      {shouldShowActions && (
        <MessageActions>
          <MessageAction tooltip="Copy" onClick={handleCopy}>
            <Copy className="size-4" />
          </MessageAction>
          {onRegenerate && (
            <MessageAction tooltip="Regenerate" onClick={handleRegenerate}>
              <RefreshCw className="size-4" />
            </MessageAction>
          )}
        </MessageActions>
      )}
    </Message>
  )
})
