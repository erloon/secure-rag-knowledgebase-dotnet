/**
 * Local types for shadcn AI Elements compatibility.
 * These match the shape expected by AI Elements components
 * without importing from the Vercel AI SDK.
 */

/**
 * Message role enumeration (matches AI Elements expectations)
 */
export type AIElementMessageRole = "user" | "assistant" | "system" | "data"

/**
 * Message part for complex message structures
 */
export interface AIElementMessagePart {
  type: "text" | "reasoning" | "source-url"
  text?: string
  state?: "streaming" | "done"
  sourceId?: string
  url?: string
  title?: string
}

/**
 * AI Element message structure
 */
export interface AIElementMessage {
  id: string
  role: AIElementMessageRole
  parts?: AIElementMessagePart[]
  metadata?: Record<string, unknown>
}
