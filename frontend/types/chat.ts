// types/chat.ts

/**
 * Message role enumeration
 */
export type MessageRole = "user" | "assistant" | "system"

/**
 * Message status for tracking state
 */
export type MessageStatus =
  | "pending"      // Message created, waiting to send
  | "streaming"    // Currently receiving streamed response
  | "completed"    // Message fully received
  | "error"        // Error occurred
  | "stopped"      // User stopped streaming

/**
 * Reasoning display status
 */
export type ReasoningStatus =
  | "hidden"       // Not shown
  | "streaming"    // Currently displaying reasoning
  | "collapsed"    // Reasoning complete, collapsed
  | "expanded"     // User expanded to view

/**
 * Citation metadata from vector search
 */
export interface Citation {
  /** Document filename (e.g., "Employee_Handbook.pdf") */
  document: string
  /** Page number for PDF/DOCX (undefined for markdown/text) */
  page?: number
  /** Chunk index in vector store */
  chunkIndex: number
  /** Relevance score 0-100 from Qdrant */
  relevanceScore: number
  /** Optional URL to document viewer */
  url?: string
  /** Citation ID for reference */
  id: string
}

/**
 * Metadata attached to messages
 */
export interface MessageAnnotation {
  /** Citations from vector search */
  citations?: Citation[]
  /** Timestamp of message creation */
  timestamp: string
  /** Model used for generation */
  model: string
  /** Token usage if available */
  usage?: {
    prompt: number
    completion: number
    total: number
  }
  /** Reasoning/thinking process if available */
  reasoning?: string
}

/**
 * AI thinking/reasoning process
 */
export interface Reasoning {
  /** Unique identifier */
  id: string
  /** Thinking content (markdown) */
  content: string
  /** Duration in seconds */
  duration?: number
  /** Current status */
  status: ReasoningStatus
}

/**
 * Tool call for Microsoft Agent Framework
 */
export interface ToolCall {
  /** Tool/function name */
  name: string
  /** Parameters (JSON-serializable) */
  arguments: Record<string, unknown>
  /** Execution result if completed */
  result?: unknown
  /** Error message if failed */
  error?: string
  /** Execution state */
  state: "pending" | "executing" | "completed" | "error"
}

/**
 * Complete message structure
 */
export interface ChatMessage {
  /** Unique message identifier */
  id: string
  /** Message role */
  role: MessageRole
  /** Message content (markdown for assistant) */
  content: string
  /** Metadata annotations */
  annotations?: MessageAnnotation
  /** Message status */
  status: MessageStatus
  /** Timestamp (ISO 8601) */
  timestamp: string
  /** Associated tool calls */
  toolCalls?: ToolCall[]
}

/**
 * AI model configuration
 */
export interface AIModel {
  /** Unique model identifier */
  id: string
  /** Display name */
  name: string
  /** Provider/creator */
  provider: string
  /** Provider slug for logo lookup */
  providerSlug: string
  /** Available deployment providers */
  deploymentProviders?: string[]
  /** Context window size (tokens) */
  contextWindow?: number
  /** Maximum output tokens */
  maxOutputTokens?: number
}

/**
 * Data source file metadata
 */
export interface DataSourceFile {
  /** Unique file identifier */
  id: string
  /** Filename with extension */
  filename: string
  /** File type (pdf, docx, txt, md) */
  fileType: "pdf" | "docx" | "txt" | "md"
  /** File size in bytes */
  size: number
  /** Upload date (ISO 8601) */
  uploadedAt: string
  /** Number of chunks in vector store */
  chunkCount?: number
  /** Whether file is currently selected */
  isSelected: boolean
}

/**
 * Conversation with multiple turns
 */
export interface Conversation {
  /** Unique conversation identifier */
  id: string
  /** Display title (generated from first message) */
  title: string
  /** All messages in the conversation */
  messages: ChatMessage[]
  /** Created date */
  createdAt: string
  /** Last updated date */
  updatedAt: string
  /** Selected data sources for this conversation */
  dataSources: string[] // file IDs
}

/**
 * Single conversation turn (user + assistant pair)
 */
export interface ConversationTurn {
  /** Turn index in conversation */
  index: number
  /** User message */
  user: ChatMessage
  /** Assistant response */
  assistant: ChatMessage
  /** Additional context for this turn */
  context?: {
    /** Citations used */
    citations: Citation[]
    /** Reasoning if available */
    reasoning?: string
  }
}

/**
 * SSE streaming chunk format
 */
export interface StreamChunk {
  /** Chunk type */
  type: "token" | "citation" | "reasoning" | "tool_call" | "error" | "done"
  /** Content for token chunks */
  content?: string
  /** Citation data for citation chunks */
  citation?: Citation
  /** Reasoning content */
  reasoning?: string
  /** Tool call data */
  toolCall?: ToolCall
  /** Error message for error chunks */
  error?: string
  /** Sequence number for ordering */
  sequence: number
}

/**
 * Payload for sending a message
 */
export interface SendMessagePayload {
  /** User message text */
  message: string
  /** Selected data source file IDs */
  dataSources: string[]
  /** Selected model ID */
  model: string
  /** Conversation history for context */
  conversationHistory: ChatMessage[]
  /** Conversation ID (undefined for new conversation) */
  conversationId?: string
}

/**
 * Response from sending a message
 */
export interface SendMessageResponse {
  /** Created message ID */
  messageId: string
  /** Conversation ID (may be new) */
  conversationId: string
  /** Stream for reading SSE events */
  stream: ReadableStream<StreamChunk>
}

/**
 * Handler interface for AI chat operations
 * All methods are asynchronous to support future API integration
 */
export interface AIChatHandlers {
  /**
   * Send a message and receive streaming response
   * @param payload - Message payload with text, context, sources
   * @returns Promise resolving to stream response
   */
  sendMessage: (payload: SendMessagePayload) => Promise<SendMessageResponse>

  /**
   * Fetch available files list
   * @returns Promise resolving to array of available files
   */
  fetchFilesList: () => Promise<DataSourceFile[]>

  /**
   * Load conversation history by ID
   * @param conversationId - Conversation identifier
   * @returns Promise resolving to conversation or null
   */
  loadConversation: (conversationId: string) => Promise<Conversation | null>

  /**
   * Copy text to clipboard
   * @param text - Text to copy
   * @returns Promise resolving on success
   */
  copyToClipboard: (text: string) => Promise<void>

  /**
   * Handle model selection change
   * @param modelId - Selected model identifier
   * @returns Promise resolving on success
   */
  onModelChange: (modelId: string) => Promise<void>

  /**
   * Handle data source selection change
   * @param sourceIds - Array of selected source IDs
   * @returns Promise resolving on success
   */
  onDataSourceChange: (sourceIds: string[]) => Promise<void>

  /**
   * Regenerate the last response
   * @param messageId - Message to regenerate
   * @returns Promise resolving to new stream response
   */
  regenerateResponse: (messageId: string) => Promise<SendMessageResponse>

  /**
   * Stop ongoing streaming request
   * @param abortController - AbortController to signal cancellation
   */
  stopStreaming: (abortController: AbortController) => void

  /**
   * Handle citation click
   * @param citation - Clicked citation data
   */
  onCitationClick?: (citation: Citation) => void

  /**
   * Handle errors
   * @param error - Error object
   * @param context - Error context (where it occurred)
   */
  onError: (error: Error, context: string) => void
}

/**
 * UI customization configuration
 */
export interface UIConfig {
  /** Enable/disable features */
  features?: {
    /** Show model selector */
    showModelSelector?: boolean
    /** Show data source selector */
    showDataSourceSelector?: boolean
    /** Show reasoning sections */
    showReasoning?: boolean
    /** Show citations */
    showCitations?: boolean
    /** Show copy button */
    showCopyButton?: boolean
    /** Show regenerate button */
    showRegenerateButton?: boolean
    /** Show scroll to bottom button */
    showScrollButton?: boolean
  }

  /** Streaming behavior */
  streaming?: {
    /** Enable streaming */
    enabled?: boolean
    /** Delay before showing first token (ms) */
    firstTokenDelay?: number
    /** Delay between tokens (ms) - for testing */
    tokenDelay?: number
  }

  /** Conversation limits */
  conversation?: {
    /** Maximum messages in history */
    maxHistoryMessages?: number
    /** Auto-scroll behavior */
    autoScroll?: boolean
    /** Smooth scroll */
    smoothScroll?: boolean
  }

  /** Custom styling */
  styling?: {
    /** Custom CSS class name */
    className?: string
    /** Maximum height (px or CSS value) */
    maxHeight?: string | number
    /** Theme variant */
    variant?: "default" | "compact" | "spacious"
  }

  /** Responsive behavior */
  responsive?: {
    /** Breakpoint for mobile layout */
    mobileBreakpoint?: "sm" | "md" | "lg"
    /** Collapse header on mobile */
    collapseHeaderOnMobile?: boolean
    /** Full-screen on mobile */
    fullScreenOnMobile?: boolean
  }
}

/**
 * Default configuration values
 */
export const defaultUIConfig: UIConfig = {
  features: {
    showModelSelector: true,
    showDataSourceSelector: true,
    showReasoning: true,
    showCitations: true,
    showCopyButton: true,
    showRegenerateButton: true,
    showScrollButton: true
  },
  streaming: {
    enabled: true,
    firstTokenDelay: 0,
    tokenDelay: 0
  },
  conversation: {
    maxHistoryMessages: 100,
    autoScroll: true,
    smoothScroll: true
  },
  styling: {
    variant: "default"
  },
  responsive: {
    mobileBreakpoint: "md",
    collapseHeaderOnMobile: true,
    fullScreenOnMobile: false
  }
}
