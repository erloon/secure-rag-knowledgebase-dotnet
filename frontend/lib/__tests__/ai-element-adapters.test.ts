import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals"
import {
  toAIElementMessage,
  citationsToUrls,
  normalizeProviderSlug
} from "../ai-element-adapters"
import type { ChatMessage, Citation } from "@/types/chat"

// Mock helpers
function createMockChatMessage(
  overrides: Partial<ChatMessage> = {}
): ChatMessage {
  return {
    id: "msg-1",
    role: "user",
    content: "Test message",
    status: "completed",
    timestamp: new Date().toISOString(),
    ...overrides
  }
}

function createMockCitation(
  overrides: Partial<Citation> = {}
): Citation {
  return {
    id: "cit-1",
    document: "test.pdf",
    chunkIndex: 0,
    relevanceScore: 90,
    ...overrides
  }
}

describe("toAIElementMessage", () => {
  it("should convert basic user message to AIElementMessage", () => {
    const message = createMockChatMessage({
      role: "user",
      content: "Hello, AI!"
    })

    const result = toAIElementMessage(message)

    expect(result.id).toBe("msg-1")
    expect(result.role).toBe("user")
    expect(result.parts).toHaveLength(1)
    expect(result.parts?.[0]).toEqual({
      type: "text",
      text: "Hello, AI!",
      state: "done"
    })
  })

  it("should include reasoning part when available", () => {
    const message = createMockChatMessage({
      role: "assistant",
      content: "The answer is 42.",
      annotations: {
        timestamp: new Date().toISOString(),
        model: "gpt-4o",
        reasoning: "Let me calculate this step by step..."
      }
    })

    const result = toAIElementMessage(message)

    expect(result.parts).toHaveLength(2)
    expect(result.parts?.[0].type).toBe("text")
    expect(result.parts?.[1]).toEqual({
      type: "reasoning",
      text: "Let me calculate this step by step...",
      state: "done"
    })
  })

  it("should include citation parts when URLs are available", () => {
    const message = createMockChatMessage({
      role: "assistant",
      content: "According to the handbook...",
      annotations: {
        timestamp: new Date().toISOString(),
        model: "gpt-4o",
        citations: [
          createMockCitation({
            document: "Employee_Handbook.pdf",
            page: 12,
            url: "https://example.com/handbook?page=12"
          })
        ]
      }
    })

    const result = toAIElementMessage(message)

    expect(result.parts).toHaveLength(2) // text + citation
    expect(result.parts?.[1]).toEqual({
      type: "source-url",
      sourceId: "cit-1",
      url: "https://example.com/handbook?page=12",
      title: "Employee_Handbook.pdf"
    })
  })

  it("should skip citations without URLs", () => {
    const message = createMockChatMessage({
      role: "assistant",
      content: "Based on the documents...",
      annotations: {
        timestamp: new Date().toISOString(),
        model: "gpt-4o",
        citations: [
          createMockCitation({ url: "https://example.com/doc" }),
          createMockCitation({ url: undefined })
        ]
      }
    })

    const result = toAIElementMessage(message)

    expect(result.parts).toHaveLength(2) // text + 1 citation (with URL)
  })

  it("should handle message with no annotations", () => {
    const message = createMockChatMessage({
      role: "user",
      content: "Test",
      annotations: undefined
    })

    const result = toAIElementMessage(message)

    expect(result.parts).toHaveLength(1)
    expect(result.parts?.[0].type).toBe("text")
  })

  it("should set streaming state when message status is streaming", () => {
    const message = createMockChatMessage({
      role: "assistant",
      status: "streaming",
      content: "Thinking..."
    })

    const result = toAIElementMessage(message)

    expect(result.parts?.[0]).toEqual({
      type: "text",
      text: "Thinking...",
      state: "streaming"
    })
  })
})

describe("citationsToUrls", () => {
  it("should return empty array for undefined citations", () => {
    const result = citationsToUrls(undefined)
    expect(result).toEqual([])
  })

  it("should return empty array for empty citations array", () => {
    const result = citationsToUrls([])
    expect(result).toEqual([])
  })

  it("should use citation.url when available", () => {
    const citations = [
      createMockCitation({
        document: "Handbook.pdf",
        url: "https://example.com/handbook"
      })
    ]

    const result = citationsToUrls(citations)

    expect(result).toEqual(["https://example.com/handbook"])
  })

  it("should construct file:// URL when citation.url is missing", () => {
    const citations = [
      createMockCitation({
        document: "Policy.docx",
        page: 5
      })
    ]

    const result = citationsToUrls(citations)

    expect(result).toEqual(["file://Policy.docx#page=5"])
  })

  it("should construct file:// URL without page when page is missing", () => {
    const citations = [
      createMockCitation({
        id: "cit-123",
        document: "README.md"
      })
    ]

    const result = citationsToUrls(citations)

    expect(result).toEqual(["file://README.md#citation-cit-123"])
  })

  it("should handle mixed citations (with and without URLs)", () => {
    const citations = [
      createMockCitation({
        document: "Doc1.pdf",
        url: "https://example.com/doc1"
      }),
      createMockCitation({
        document: "Doc2.pdf",
        page: 10
      }),
      createMockCitation({
        id: "cit-456",
        document: "Doc3.md"
      })
    ]

    const result = citationsToUrls(citations)

    expect(result).toEqual([
      "https://example.com/doc1",
      "file://Doc2.pdf#page=10",
      "file://Doc3.md#citation-cit-456"
    ])
  })
})

describe("normalizeProviderSlug", () => {
  const originalWarn = console.warn
  const mockWarn = jest.fn()

  beforeEach(() => {
    mockWarn.mockClear()
    console.warn = mockWarn as any
  })

  afterEach(() => {
    console.warn = originalWarn
  })

  it("should return known provider slug as-is", () => {
    const result = normalizeProviderSlug("openai")
    expect(result).toBe("openai")
    expect(mockWarn).not.toHaveBeenCalled()
  })

  it("should return unknown provider slug as-is with warning in dev", () => {
    // Set NODE_ENV to development for this test
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = "development"

    const result = normalizeProviderSlug("unknown-provider")
    expect(result).toBe("unknown-provider")
    expect(mockWarn).toHaveBeenCalledWith(
      expect.stringContaining("Unknown provider slug")
    )

    process.env.NODE_ENV = originalEnv
  })

  it("should handle provider with hyphens", () => {
    const result = normalizeProviderSlug("google-vertex-anthropic")
    expect(result).toBe("google-vertex-anthropic")
  })

  it("should handle empty string", () => {
    const result = normalizeProviderSlug("")
    expect(result).toBe("")
  })

  it("should not mutate input string", () => {
    const input = "  openai  "
    const result = normalizeProviderSlug(input)
    expect(result).toBe(input) // No trimming
  })
})
