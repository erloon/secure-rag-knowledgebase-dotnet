// __tests__/utils/test-helpers.ts

import type {
  ChatMessage,
  AIModel,
  DataSourceFile,
  Citation,
  AIChatHandlers,
  StreamChunk,
  SendMessageResponse,
  MessageRole,
  MessageStatus
} from "@/types/chat"

/**
 * Create a mock chat message with optional overrides
 */
export function createMockChatMessage(overrides?: Partial<ChatMessage>): ChatMessage {
  return {
    id: overrides?.id ?? crypto.randomUUID(),
    role: overrides?.role ?? ("user" as MessageRole),
    content: overrides?.content ?? "Test message",
    status: overrides?.status ?? ("completed" as MessageStatus),
    timestamp: overrides?.timestamp ?? new Date().toISOString(),
    annotations: overrides?.annotations ?? {
      timestamp: new Date().toISOString(),
      model: "gpt-4o"
    },
    ...overrides
  }
}

/**
 * Create a mock AI model with optional overrides
 */
export function createMockAIModel(overrides?: Partial<AIModel>): AIModel {
  return {
    id: overrides?.id ?? crypto.randomUUID(),
    name: overrides?.name ?? "GPT-4o",
    provider: overrides?.provider ?? "OpenAI",
    providerSlug: overrides?.providerSlug ?? "openai",
    contextWindow: overrides?.contextWindow ?? 128000,
    maxOutputTokens: overrides?.maxOutputTokens ?? 4096,
    ...overrides
  }
}

/**
 * Create multiple mock AI models
 */
export function createMockAIModels(count: number = 3): AIModel[] {
  return Array.from({ length: count }, (_, i) =>
    createMockAIModel({
      id: `model-${i + 1}`,
      name: `Model ${i + 1}`,
      provider: ["OpenAI", "Anthropic", "Google"][i] ?? "OpenAI",
      providerSlug: ["openai", "anthropic", "google"][i] ?? "openai"
    })
  )
}

/**
 * Create a mock data source file with optional overrides
 */
export function createMockDataSourceFile(overrides?: Partial<DataSourceFile>): DataSourceFile {
  return {
    id: overrides?.id ?? crypto.randomUUID(),
    filename: overrides?.filename ?? "test.pdf",
    fileType: overrides?.fileType ?? "pdf",
    size: overrides?.size ?? 1024000,
    uploadedAt: overrides?.uploadedAt ?? new Date().toISOString(),
    chunkCount: overrides?.chunkCount ?? 100,
    isSelected: overrides?.isSelected ?? false,
    ...overrides
  }
}

/**
 * Create multiple mock data source files
 */
export function createMockDataSourceFiles(count: number = 3): DataSourceFile[] {
  const fileTypes: Array<"pdf" | "docx" | "txt" | "md"> = ["pdf", "docx", "txt", "md"]
  return Array.from({ length: count }, (_, i) =>
    createMockDataSourceFile({
      id: `file-${i + 1}`,
      filename: `document-${i + 1}.${fileTypes[i % fileTypes.length]}`,
      fileType: fileTypes[i % fileTypes.length]
    })
  )
}

/**
 * Create a mock citation with optional overrides
 */
export function createMockCitation(overrides?: Partial<Citation>): Citation {
  return {
    id: overrides?.id ?? crypto.randomUUID(),
    document: overrides?.document ?? "test.pdf",
    page: overrides?.page ?? 1,
    chunkIndex: overrides?.chunkIndex ?? 0,
    relevanceScore: overrides?.relevanceScore ?? 95,
    url: overrides?.url,
    ...overrides
  }
}

/**
 * Create mock handlers for testing
 */
export function createMockHandlers(overrides?: Partial<AIChatHandlers>): AIChatHandlers {
  return {
    sendMessage: overrides?.sendMessage ?? jest.fn().mockResolvedValue({
      messageId: crypto.randomUUID(),
      conversationId: crypto.randomUUID(),
      stream: new ReadableStream()
    }),

    fetchFilesList: overrides?.fetchFilesList ?? jest.fn().mockResolvedValue([]),

    loadConversation: overrides?.loadConversation ?? jest.fn().mockResolvedValue(null),

    copyToClipboard: overrides?.copyToClipboard ?? jest.fn().mockResolvedValue(undefined),

    onModelChange: overrides?.onModelChange ?? jest.fn().mockResolvedValue(undefined),

    onDataSourceChange: overrides?.onDataSourceChange ?? jest.fn().mockResolvedValue(undefined),

    regenerateResponse: overrides?.regenerateResponse ?? jest.fn().mockResolvedValue({
      messageId: crypto.randomUUID(),
      conversationId: crypto.randomUUID(),
      stream: new ReadableStream()
    }),

    stopStreaming: overrides?.stopStreaming ?? jest.fn(),

    onCitationClick: overrides?.onCitationClick ?? jest.fn(),

    onError: overrides?.onError ?? jest.fn()
  }
}

/**
 * Create a mock stream from chunks
 */
export function createMockStream(chunks: StreamChunk[]): ReadableStream<StreamChunk> {
  return new ReadableStream<StreamChunk>({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk)
        await new Promise(resolve => setTimeout(resolve, 10))
      }
      controller.close()
    }
  })
}

/**
 * Create a mock stream response
 */
export function createMockStreamResponse(
  chunks: StreamChunk[],
  overrides?: Partial<SendMessageResponse>
): SendMessageResponse {
  return {
    messageId: overrides?.messageId ?? crypto.randomUUID(),
    conversationId: overrides?.conversationId ?? crypto.randomUUID(),
    stream: overrides?.stream ?? createMockStream(chunks)
  }
}

/**
 * Create mock stream chunks for testing
 */
export function createMockStreamChunks(options?: {
  tokens?: string[]
  citations?: Citation[]
  reasoning?: string
  error?: string
}): StreamChunk[] {
  const chunks: StreamChunk[] = []
  let sequence = 0

  // Add tokens
  if (options?.tokens) {
    for (const token of options.tokens) {
      chunks.push({ type: "token", content: token, sequence: sequence++ })
    }
  }

  // Add citations
  if (options?.citations) {
    for (const citation of options.citations) {
      chunks.push({ type: "citation", citation, sequence: sequence++ })
    }
  }

  // Add reasoning
  if (options?.reasoning) {
    chunks.push({ type: "reasoning", reasoning: options.reasoning, sequence: sequence++ })
  }

  // Add error
  if (options?.error) {
    chunks.push({ type: "error", error: options.error, sequence: sequence++ })
  }

  // Add done marker
  chunks.push({ type: "done", sequence: sequence++ })

  return chunks
}

/**
 * Wait for async state update with timeout
 */
export async function waitForState<T>(
  fn: () => T,
  timeout: number = 1000
): Promise<T> {
  const startTime = Date.now()
  while (Date.now() - startTime < timeout) {
    try {
      const result = fn()
      if (result !== undefined && result !== null) {
        return result
      }
    } catch {
      // Keep trying
    }
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  throw new Error(`Timeout waiting for state after ${timeout}ms`)
}

/**
 * Create a readable stream that can be controlled
 */
export function createControlledStream(): {
  stream: ReadableStream<StreamChunk>
  controller: ReadableStreamDefaultController<StreamChunk>
} {
  let controllerRef: ReadableStreamDefaultController<StreamChunk> | null = null

  const stream = new ReadableStream<StreamChunk>({
    start(controller) {
      controllerRef = controller
    }
  })

  if (!controllerRef) {
    throw new Error("Failed to create stream controller")
  }

  return { stream, controller: controllerRef }
}

/**
 * Mock crypto.randomUUID for testing
 */
export function mockCryptoUUID(): void {
  let uuidCounter = 0
  global.crypto = {
    ...global.crypto,
    randomUUID: () => `test-uuid-${uuidCounter++}`
  } as Crypto
}

/**
 * Restore original crypto.randomUUID
 */
export function restoreCryptoUUID(): void {
  // No-op in most test environments, but useful for completeness
}

/**
 * Wait for all async operations to complete
 */
export async function flushPromises(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, 0)
  })
}

/**
 * Create a mock abort controller
 */
export function createMockAbortController(): {
  controller: AbortController
  abortSpy: jest.Mock
} {
  const abortSpy = jest.fn()
  const controller = new AbortController()
  const originalAbort = controller.abort.bind(controller)
  controller.abort = jest.fn((reason?: any) => {
    abortSpy(reason)
    return originalAbort(reason)
  }) as any
  return { controller, abortSpy }
}
