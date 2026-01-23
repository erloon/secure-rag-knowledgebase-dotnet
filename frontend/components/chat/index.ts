// components/chat/index.ts

/**
 * Chat components for AI chat interface
 *
 * Phase 2: Input & Selection Components
 *
 * These adapter components bridge our custom types/hooks to the shadcn AI Elements UI.
 */

export { MessageAdapter } from "./MessageAdapter"
export type { MessageAdapterProps } from "./MessageAdapter"

export { PromptInputAdapter } from "./PromptInputAdapter"
export type { PromptInputAdapterProps } from "./PromptInputAdapter"

export { ModelSelectorAdapter } from "./ModelSelectorAdapter"
export type { ModelSelectorAdapterProps } from "./ModelSelectorAdapter"

export { DataSourceSelector } from "./DataSourceSelector"
export type { DataSourceSelectorProps } from "./DataSourceSelector"

export { ChatHeader } from "./ChatHeader"
export type { ChatHeaderProps } from "./ChatHeader"
