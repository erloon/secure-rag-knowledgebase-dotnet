// __tests__/utils/test-helpers.test.ts

import { describe, it, expect, beforeEach, jest } from "@jest/globals"
import {
  createMockChatMessage,
  createMockAIModel,
  createMockAIModels,
  createMockDataSourceFile,
  createMockDataSourceFiles,
  createMockCitation,
  createMockHandlers,
  createMockStream,
  createMockStreamResponse,
  createMockStreamChunks,
  waitForState,
  createControlledStream,
  mockCryptoUUID,
  createMockAbortController
} from "./mock-helpers"
import type { StreamChunk } from "@/types/chat"

describe("Test Helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("createMockChatMessage", () => {
    it("should create a chat message with defaults", () => {
      const message = createMockChatMessage()

      expect(message.id).toBeDefined()
      expect(message.role).toBe("user")
      expect(message.content).toBe("Test message")
      expect(message.status).toBe("completed")
      expect(message.timestamp).toBeDefined()
      expect(message.annotations).toBeDefined()
    })

    it("should override defaults with provided values", () => {
      const message = createMockChatMessage({
        role: "assistant",
        content: "Custom content"
      })

      expect(message.role).toBe("assistant")
      expect(message.content).toBe("Custom content")
    })
  })

  describe("createMockAIModel", () => {
    it("should create an AI model with defaults", () => {
      const model = createMockAIModel()

      expect(model.id).toBeDefined()
      expect(model.name).toBe("GPT-4o")
      expect(model.provider).toBe("OpenAI")
      expect(model.providerSlug).toBe("openai")
      expect(model.contextWindow).toBe(128000)
      expect(model.maxOutputTokens).toBe(4096)
    })

    it("should override defaults with provided values", () => {
      const model = createMockAIModel({
        name: "Claude",
        provider: "Anthropic"
      })

      expect(model.name).toBe("Claude")
      expect(model.provider).toBe("Anthropic")
    })
  })

  describe("createMockAIModels", () => {
    it("should create multiple AI models", () => {
      const models = createMockAIModels(3)

      expect(models).toHaveLength(3)
      expect(models[0]?.name).toBe("Model 1")
      expect(models[1]?.name).toBe("Model 2")
      expect(models[2]?.name).toBe("Model 3")
    })

    it("should use default count of 3", () => {
      const models = createMockAIModels()
      expect(models).toHaveLength(3)
    })
  })

  describe("createMockDataSourceFile", () => {
    it("should create a data source file with defaults", () => {
      const file = createMockDataSourceFile()

      expect(file.id).toBeDefined()
      expect(file.filename).toBe("test.pdf")
      expect(file.fileType).toBe("pdf")
      expect(file.size).toBe(1024000)
      expect(file.uploadedAt).toBeDefined()
      expect(file.chunkCount).toBe(100)
      expect(file.isSelected).toBe(false)
    })

    it("should override defaults with provided values", () => {
      const file = createMockDataSourceFile({
        filename: "custom.docx",
        fileType: "docx",
        isSelected: true
      })

      expect(file.filename).toBe("custom.docx")
      expect(file.fileType).toBe("docx")
      expect(file.isSelected).toBe(true)
    })
  })

  describe("createMockDataSourceFiles", () => {
    it("should create multiple data source files", () => {
      const files = createMockDataSourceFiles(3)

      expect(files).toHaveLength(3)
      expect(files[0]?.filename).toBe("document-1.pdf")
      expect(files[1]?.filename).toBe("document-2.docx")
      expect(files[2]?.filename).toBe("document-3.txt")
    })

    it("should use default count of 3", () => {
      const files = createMockDataSourceFiles()
      expect(files).toHaveLength(3)
    })
  })

  describe("createMockCitation", () => {
    it("should create a citation with defaults", () => {
      const citation = createMockCitation()

      expect(citation.id).toBeDefined()
      expect(citation.document).toBe("test.pdf")
      expect(citation.page).toBe(1)
      expect(citation.chunkIndex).toBe(0)
      expect(citation.relevanceScore).toBe(95)
    })

    it("should override defaults with provided values", () => {
      const citation = createMockCitation({
        document: "custom.pdf",
        relevanceScore: 80
      })

      expect(citation.document).toBe("custom.pdf")
      expect(citation.relevanceScore).toBe(80)
    })
  })

  describe("createMockHandlers", () => {
    it("should create mock handlers with all methods", () => {
      const handlers = createMockHandlers()

      expect(handlers.sendMessage).toBeDefined()
      expect(handlers.fetchFilesList).toBeDefined()
      expect(handlers.loadConversation).toBeDefined()
      expect(handlers.copyToClipboard).toBeDefined()
      expect(handlers.onModelChange).toBeDefined()
      expect(handlers.onDataSourceChange).toBeDefined()
      expect(handlers.regenerateResponse).toBeDefined()
      expect(handlers.stopStreaming).toBeDefined()
      expect(handlers.onCitationClick).toBeDefined()
      expect(handlers.onError).toBeDefined()
    })

    it("should override specific handlers", () => {
      const customSendMessage = jest.fn()
      const handlers = createMockHandlers({ sendMessage: customSendMessage })

      expect(handlers.sendMessage).toBe(customSendMessage)
      expect(handlers.fetchFilesList).toBeDefined()
    })
  })

  describe("createMockStream", () => {
    it("should create a readable stream from chunks", async () => {
      const chunks: StreamChunk[] = [
        { type: "token", content: "Hello", sequence: 0 },
        { type: "token", content: " world", sequence: 1 },
        { type: "done", sequence: 2 }
      ]

      const stream = createMockStream(chunks)
      const reader = stream.getReader()
      const results: StreamChunk[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (value) results.push(value)
      }

      expect(results).toHaveLength(3)
      expect(results[0]?.content).toBe("Hello")
      expect(results[1]?.content).toBe(" world")
    })
  })

  describe("createMockStreamResponse", () => {
    it("should create a stream response with defaults", () => {
      const chunks: StreamChunk[] = [{ type: "token", content: "Test", sequence: 0 }]
      const response = createMockStreamResponse(chunks)

      expect(response.messageId).toBeDefined()
      expect(response.conversationId).toBeDefined()
      expect(response.stream).toBeDefined()
    })

    it("should override defaults with provided values", () => {
      const chunks: StreamChunk[] = [{ type: "token", content: "Test", sequence: 0 }]
      const response = createMockStreamResponse(chunks, {
        messageId: "custom-msg-id",
        conversationId: "custom-conv-id"
      })

      expect(response.messageId).toBe("custom-msg-id")
      expect(response.conversationId).toBe("custom-conv-id")
    })
  })

  describe("createMockStreamChunks", () => {
    it("should create token chunks", () => {
      const chunks = createMockStreamChunks({
        tokens: ["Hello", " world"]
      })

      expect(chunks).toHaveLength(3) // 2 tokens + done marker
      expect(chunks[0]?.type).toBe("token")
      expect(chunks[0]?.content).toBe("Hello")
      expect(chunks[1]?.type).toBe("token")
      expect(chunks[1]?.content).toBe(" world")
      expect(chunks[2]?.type).toBe("done")
    })

    it("should create citation chunks", () => {
      const citation = createMockCitation()
      const chunks = createMockStreamChunks({ citations: [citation] })

      expect(chunks).toHaveLength(2) // 1 citation + done marker
      expect(chunks[0]?.type).toBe("citation")
      expect(chunks[0]?.citation).toEqual(citation)
    })

    it("should create reasoning chunks", () => {
      const chunks = createMockStreamChunks({ reasoning: "Thinking..." })

      expect(chunks).toHaveLength(2) // 1 reasoning + done marker
      expect(chunks[0]?.type).toBe("reasoning")
      expect(chunks[0]?.reasoning).toBe("Thinking...")
    })

    it("should create error chunks", () => {
      const chunks = createMockStreamChunks({ error: "Something went wrong" })

      expect(chunks).toHaveLength(2) // 1 error + done marker
      expect(chunks[0]?.type).toBe("error")
      expect(chunks[0]?.error).toBe("Something went wrong")
    })

    it("should create mixed chunks", () => {
      const citation = createMockCitation()
      const chunks = createMockStreamChunks({
        tokens: ["Hello"],
        citations: [citation],
        reasoning: "Thinking..."
      })

      expect(chunks).toHaveLength(4) // 1 token + 1 citation + 1 reasoning + done marker
      expect(chunks[0]?.type).toBe("token")
      expect(chunks[1]?.type).toBe("citation")
      expect(chunks[2]?.type).toBe("reasoning")
      expect(chunks[3]?.type).toBe("done")
    })
  })

  describe("waitForState", () => {
    it("should wait for state to become truthy", async () => {
      let state = false
      setTimeout(() => { state = true }, 10)

      const result = await waitForState(() => state, 200)
      expect(result).toBe(true)
    })

    it("should timeout if state never becomes truthy", async () => {
      await expect(waitForState(() => false, 50)).rejects.toThrow("Timeout waiting for state")
    })
  })

  describe("createControlledStream", () => {
    it("should create a stream with controller", () => {
      const { stream, controller } = createControlledStream()

      expect(stream).toBeDefined()
      expect(controller).toBeDefined()
      expect(controller.enqueue).toBeDefined()
      expect(controller.close).toBeDefined()
    })

    it("should allow manual control of stream", async () => {
      const { stream, controller } = createControlledStream()

      controller.enqueue({ type: "token", content: "Test", sequence: 0 })
      controller.close()

      const reader = stream.getReader()
      const { value } = await reader.read()

      expect(value?.content).toBe("Test")
    })
  })

  describe("mockCryptoUUID", () => {
    it("should mock crypto.randomUUID", () => {
      const originalUUID = crypto.randomUUID

      mockCryptoUUID()

      const uuid1 = crypto.randomUUID()
      const uuid2 = crypto.randomUUID()

      expect(uuid1).toBe("test-uuid-0")
      expect(uuid2).toBe("test-uuid-1")

      // Restore original
      global.crypto = { ...global.crypto, randomUUID: originalUUID } as Crypto
    })
  })

  describe("createMockAbortController", () => {
    it("should create an abort controller with spy", () => {
      const { controller, abortSpy } = createMockAbortController()

      expect(controller).toBeDefined()
      expect(abortSpy).toBeDefined()
      expect(typeof controller.abort).toBe("function")
    })

    it("should call abort spy when abort is called", () => {
      const { controller, abortSpy } = createMockAbortController()

      controller.abort()

      expect(abortSpy).toHaveBeenCalled()
    })
  })
})
