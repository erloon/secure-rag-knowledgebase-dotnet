import type { AIElementMessage } from "@/types/ai-elements"
import type { ChatMessage, Citation } from "@/types/chat"

/**
 * Convert ChatMessage to AIElementMessage for AI Elements components.
 * Extracts content, citations, and reasoning into proper parts structure.
 *
 * @param message - Our custom ChatMessage type
 * @returns Partial AIElementMessage compatible with AI Elements components
 */
export function toAIElementMessage(
  message: ChatMessage
): Partial<AIElementMessage> {
  const parts: AIElementMessagePart[] = []

  // 1. Add text content part
  parts.push({
    type: "text",
    text: message.content,
    state: message.status === "streaming" ? "streaming" : "done"
  })

  // 2. Add reasoning part if available
  if (message.annotations?.reasoning) {
    parts.push({
      type: "reasoning",
      text: message.annotations.reasoning,
      state: "done"
    })
  }

  // 3. Add citation parts if available (only those with URLs)
  if (message.annotations?.citations) {
    for (const citation of message.annotations.citations) {
      if (citation.url) {
        parts.push({
          type: "source-url",
          sourceId: citation.id,
          url: citation.url,
          title: citation.document
        })
      }
    }
  }

  return {
    id: message.id,
    role: message.role,
    parts,
    metadata: message.annotations as Record<string, unknown> | undefined
  }
}

/**
 * Convert Citation array to URL array for InlineCitation component.
 * Uses file:// protocol format when citation.url is missing.
 *
 * @param citations - Array of citation objects
 * @returns Array of URL strings
 */
export function citationsToUrls(citations: Citation[]): string[] {
  if (!citations || citations.length === 0) {
    return []
  }

  return citations.map((citation) => {
    // If citation has a URL, use it directly
    if (citation.url) {
      return citation.url
    }

    // Otherwise, construct a file:// URL format
    // Format: file://${document}#page=${page} or file://${document}#citation-${id}
    const fragment = citation.page
      ? `page=${citation.page}`
      : `citation-${citation.id}`

    return `file://${citation.document}#${fragment}`
  })
}

/**
 * Normalize provider slug for ModelSelectorLogo component.
 * The component accepts any string via (string & {}) fallback,
 * so this function returns the slug as-is with optional dev warning.
 *
 * @param slug - Provider slug string
 * @returns The same slug (valid for ModelSelectorLogo)
 */
export function normalizeProviderSlug(slug: string): string {
  // Optional: Log warning in development if provider is not recognized
  const VALID_PROVIDERS = [
    "openai", "anthropic", "google", "mistral", "xai", "groq",
    "azure", "amazon-bedrock", "cohere", "perplexity", "deepseek",
    "openrouter", "togetherai", "fireworks-ai", "huggingface",
    "moonshotai", "alibaba", "nvidia", "upstage", "vultr",
    "github-copilot", "vercel", "nebius", "venice", "chutes",
    "cortecs", "github-models", "baseten", "opencode", "fastrouter",
    "google-vertex", "cloudflare-workers-ai", "inception", "wandb",
    "zhipuai", "zenmux", "v0", "iflowcn", "synthetic", "deepinfra",
    "submodel", "zai", "inference", "requesty", "morph", "lmstudio",
    "aihubmix", "modelscope", "llama", "scaleway", "cerebras",
    // Additional provider variants from shadcn components
    "moonshotai-cn", "lucidquery", "zai-coding-plan", "alibaba-cn",
    "google-vertex-anthropic", "zhipuai-coding-plan"
  ] as const

  if (
    process.env.NODE_ENV === "development" &&
    !VALID_PROVIDERS.includes(slug as any)
  ) {
    console.warn(
      `[ai-element-adapters] Unknown provider slug: "${slug}". Logo may not display correctly.`
    )
  }

  return slug
}

/**
 * Type alias for AI Element message parts
 */
export type AIElementMessagePart = NonNullable<AIElementMessage["parts"]>[number]
