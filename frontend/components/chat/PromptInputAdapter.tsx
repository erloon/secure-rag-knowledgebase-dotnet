// components/chat/PromptInputAdapter.tsx

import { memo, useCallback, useMemo } from "react"
import { Loader2 } from "lucide-react"
import type { FormEvent } from "react"
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input"
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input"
import { useAIChatContext } from "@/contexts/AIChatContext"
import type { MemoizedComponent } from "@/types/components"

/**
 * Props for PromptInputAdapter component
 */
export interface PromptInputAdapterProps {
  /** Whether the input is disabled */
  disabled?: boolean
  /** Placeholder text for the textarea */
  placeholder?: string
  /** Optional callback when streaming is stopped */
  onStop?: () => void
}

/**
 * PromptInputAdapter - Bridges AI chat hooks to AI Elements PromptInput component.
 * Handles message submission, streaming state, and displays selected sources.
 *
 * Follows Phase 1.7 conventions:
 * - MemoizedComponent<T> type for React.memo
 * - useCallback for stable callbacks
 * - useMemo for computed values
 * - Context integration for shared state
 *
 * @example
 * ```tsx
 * <PromptInputAdapter
 *   placeholder="Ask a question..."
 *   disabled={isStreaming}
 *   onStop={handleStop}
 * />
 * ```
 */
export const PromptInputAdapter: MemoizedComponent<PromptInputAdapterProps> = memo(function PromptInputAdapter({
  disabled = false,
  placeholder = "Ask a question...",
  onStop,
}) {
  const { sendMessage, isStreaming, stopStreaming, selectedSources, error, clearError } =
    useAIChatContext()

  // Handle form submission
  const handleSubmit = useCallback(
    async (message: PromptInputMessage, event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      // Don't submit if message is empty or already streaming
      if (!message.text.trim() || isStreaming) {
        return
      }

      // Clear any previous error
      if (error) {
        clearError()
      }

      // Send the message
      await sendMessage(message.text)
    },
    [sendMessage, isStreaming, error, clearError]
  )

  // Handle stop streaming
  const handleStop = useCallback(() => {
    stopStreaming()
    onStop?.()
  }, [stopStreaming, onStop])

  // Generate attachment pills for selected sources
  // These display as chips in the input area showing which files are selected
  const attachmentPills = useMemo(() => {
    return selectedSources.map((source) => ({
      name: source.filename,
      type: source.fileType,
      size: source.size,
    }))
  }, [selectedSources])

  // Determine the submit button status based on streaming state
  // ChatStatus from AI SDK: "idle" | "submitted" | "streaming" | "error"
  // When not streaming, we don't pass a status (undefined)
  const submitStatus = isStreaming ? ("streaming" as const) : undefined

  return (
    <div className="relative w-full">
      {/* Error display */}
      {error && (
        <div className="mb-2 rounded-md bg-destructive/10 p-3 text-destructive text-sm">
          <p className="font-medium">Error</p>
          <p>{error.message}</p>
          <button
            type="button"
            onClick={clearError}
            className="mt-2 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Selected sources indicator */}
      {selectedSources.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {selectedSources.map((source) => (
            <div
              key={source.id}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs"
            >
              <span className="font-medium">{source.filename}</span>
              <span className="text-muted-foreground">
                ({source.chunkCount ?? 0} chunks)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Main input component */}
      <PromptInput
        onSubmit={handleSubmit}
        className="relative"
      >
        <PromptInputTextarea
          placeholder={placeholder}
          disabled={disabled || isStreaming}
        />

        {/* Loading indicator during streaming */}
        {isStreaming && (
          <div className="absolute right-12 top-3">
            <Loader2 className="text-muted-foreground size-4 animate-spin" />
          </div>
        )}

        <PromptInputSubmit
          status={submitStatus}
          onStop={handleStop}
          disabled={disabled || !isStreaming}
        />
      </PromptInput>
    </div>
  )
})
