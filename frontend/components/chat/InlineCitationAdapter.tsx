"use client"

import { citationsToUrls } from "@/lib/ai-element-adapters"
import type { Citation } from "@/types/chat"
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardTrigger,
  InlineCitationCardBody,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselItem,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselPrev,
  InlineCitationCarouselNext,
  InlineCitationSource,
  type InlineCitationSourceProps,
} from "@/components/ai-elements/inline-citation"
import { cn } from "@/lib/utils"
import { FileTextIcon } from "lucide-react"

/**
 * Props for InlineCitationAdapter component
 */
export interface InlineCitationAdapterProps {
  /** Array of citations to display */
  citations: Citation[]
  /** Optional CSS className */
  className?: string
  /** Custom trigger badge variant */
  variant?: "default" | "compact"
}

/**
 * Default citation relevance score threshold (0-100)
 */
const DEFAULT_RELEVANCE_THRESHOLD = 70

/**
 * Format relevance score as percentage
 */
function formatRelevanceScore(score: number): string {
  return `${Math.round(score)}%`
}

/**
 * Get citation description with metadata
 */
function getCitationDescription(citation: Citation): string {
  const parts: string[] = []

  if (citation.page) {
    parts.push(`Page ${citation.page}`)
  }

  if (citation.chunkIndex !== undefined) {
    parts.push(`Chunk ${citation.chunkIndex}`)
  }

  if (citation.relevanceScore !== undefined) {
    parts.push(`Relevance: ${formatRelevanceScore(citation.relevanceScore)}`)
  }

  return parts.length > 0 ? parts.join(" • ") : "No additional metadata"
}

/**
 * Adapter component that bridges our custom Citation[] type
 * to the shadcn AI Elements InlineCitation components.
 *
 * This component displays citations as:
 * - Compact badge showing "document.pdf +N" for multiple citations
 * - Hover card with carousel of citation details
 * - Navigation between multiple citations
 * - Document metadata (page, chunk, relevance score)
 *
 * @example
 * ```tsx
 * <InlineCitationAdapter
 *   citations={message.annotations?.citations || []}
 *   variant="compact"
 * />
 * ```
 */
export function InlineCitationAdapter({
  citations,
  className,
  variant = "default"
}: InlineCitationAdapterProps) {
  // Handle edge case: empty citations
  if (!citations || citations.length === 0) {
    return null
  }

  // Convert citations to URL array for AI Elements
  const urls = citationsToUrls(citations)

  // Single citation: simple display
  if (citations.length === 1) {
    const citation = citations[0]!
    return (
      <InlineCitation className={cn("inline-flex", className)}>
        <InlineCitationCard>
          <InlineCitationCardTrigger
            sources={urls}
            className={cn(
              "cursor-pointer",
              variant === "compact" && "text-xs px-1.5"
            )}
          >
            {citation.document}
          </InlineCitationCardTrigger>
          <InlineCitationCardBody>
            <InlineCitationSource
              title={citation.document}
              url={urls[0]}
              description={getCitationDescription(citation)}
            />
          </InlineCitationCardBody>
        </InlineCitationCard>
      </InlineCitation>
    )
  }

  // Multiple citations: carousel display
  return (
    <InlineCitation className={cn("inline-flex", className)}>
      <InlineCitationCard>
        <InlineCitationCardTrigger
          sources={urls}
          className={cn(
            "cursor-pointer",
            variant === "compact" && "text-xs px-1.5"
          )}
        >
          {citations[0]!.document} +{citations.length - 1}
        </InlineCitationCardTrigger>
        <InlineCitationCardBody>
          <InlineCitationCarousel>
            <InlineCitationCarouselHeader>
              <span className="px-3 py-1 text-xs font-medium">Sources</span>
              <InlineCitationCarouselIndex />
              <div className="flex gap-1">
                <InlineCitationCarouselPrev />
                <InlineCitationCarouselNext />
              </div>
            </InlineCitationCarouselHeader>
            <InlineCitationCarouselContent>
              {citations.map((citation, index) => (
                <InlineCitationCarouselItem key={citation.id || index}>
                  <CitationItem citation={citation} url={urls[index]!} />
                </InlineCitationCarouselItem>
              ))}
            </InlineCitationCarouselContent>
          </InlineCitationCarousel>
        </InlineCitationCardBody>
      </InlineCitationCard>
    </InlineCitation>
  )
}

/**
 * Individual citation display with metadata
 */
function CitationItem({
  citation,
  url
}: {
  citation: Citation
  url: string
}): React.ReactElement {
  const hasHighRelevance =
    citation.relevanceScore !== undefined &&
    citation.relevanceScore >= DEFAULT_RELEVANCE_THRESHOLD

  return (
    <InlineCitationSource
      title={citation.document}
      url={url}
      description={getCitationDescription(citation)}
      className={cn(
        "flex items-start gap-2",
        hasHighRelevance && "border-l-2 border-green-500 pl-2"
      )}
    >
      <FileTextIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{citation.document}</span>
          {citation.relevanceScore !== undefined && (
            <span
              className={cn(
                "text-xs rounded-full px-2 py-0.5",
                hasHighRelevance
                  ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
              )}
            >
              {formatRelevanceScore(citation.relevanceScore)}
            </span>
          )}
        </div>
        <p className="truncate break-all text-muted-foreground text-xs">
          {url}
        </p>
        {citation.page && (
          <p className="text-muted-foreground text-xs">
            Page {citation.page}
          </p>
        )}
        {citation.chunkIndex !== undefined && (
          <p className="text-muted-foreground text-xs">
            Chunk index: {citation.chunkIndex}
          </p>
        )}
      </div>
    </InlineCitationSource>
  )
}

/**
 * Export default component
 */
export default InlineCitationAdapter
