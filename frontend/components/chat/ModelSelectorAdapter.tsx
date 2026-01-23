// components/chat/ModelSelectorAdapter.tsx

import { memo, useCallback } from "react"
import {
  ModelSelector,
  ModelSelectorTrigger,
  ModelSelectorContent,
  ModelSelectorInput,
  ModelSelectorList,
  ModelSelectorItem,
  ModelSelectorEmpty,
  ModelSelectorLogo,
} from "@/components/ai-elements/model-selector"
import { useModelSelector } from "@/hooks/useModelSelector"
import { useAIChatContext } from "@/contexts/AIChatContext"
import { normalizeProviderSlug } from "@/lib/ai-element-adapters"
import type { AIModel } from "@/types/chat"
import type { MemoizedComponent } from "@/types/components"

/**
 * Props for ModelSelectorAdapter component
 */
export interface ModelSelectorAdapterProps {
  /** Available models to select from */
  models: AIModel[]
}

/**
 * ModelSelectorAdapter - Bridges useModelSelector hook to AI Elements ModelSelector component.
 * Provides searchable dropdown for model selection with provider logos.
 *
 * Follows Phase 1.7 conventions:
 * - MemoizedComponent<T> type for React.memo
 * - useCallback for stable callbacks
 * - Context integration for shared state
 *
 * @example
 * ```tsx
 * <ModelSelectorAdapter models={availableModels} />
 * ```
 */
export const ModelSelectorAdapter: MemoizedComponent<ModelSelectorAdapterProps> = memo(function ModelSelectorAdapter({
  models,
}) {
  // Get context methods
  const { selectModel: contextSelectModel, selectedModel: contextSelectedModel } =
    useAIChatContext()

  // Use model selector hook for local state management
  const {
    isOpen,
    setIsOpen,
    selectModel,
    searchQuery,
    setSearchQuery,
    filteredModels,
  } = useModelSelector({
    models,
    initialModelId: contextSelectedModel?.id,
    onModelChange: contextSelectModel,
  })

  // Handle model selection - closes dropdown after selection
  const handleSelectModel = useCallback(
    (modelId: string) => {
      selectModel(modelId)
      setIsOpen(false)
    },
    [selectModel, setIsOpen]
  )

  // Determine the currently selected model (from context or first available)
  const selectedModel = contextSelectedModel ?? filteredModels[0] ?? null

  return (
    <ModelSelector open={isOpen} onOpenChange={setIsOpen}>
      <ModelSelectorTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {selectedModel ? (
            <>
              <ModelSelectorLogo provider={normalizeProviderSlug(selectedModel.providerSlug)} />
              <span className="truncate max-w-[150px]">{selectedModel.name}</span>
            </>
          ) : (
            <span>Select Model</span>
          )}
        </button>
      </ModelSelectorTrigger>

      <ModelSelectorContent>
        <ModelSelectorInput
          placeholder="Search models..."
          value={searchQuery}
          onValueChange={setSearchQuery}
        />

        <ModelSelectorList>
          {filteredModels.length === 0 ? (
            <ModelSelectorEmpty>No models found</ModelSelectorEmpty>
          ) : (
            filteredModels.map((model) => (
              <ModelSelectorItem
                key={model.id}
                value={model.id}
                onSelect={() => handleSelectModel(model.id)}
              >
                <ModelSelectorLogo provider={normalizeProviderSlug(model.providerSlug)} />
                <div className="flex flex-col items-start gap-1">
                  <span className="font-medium text-sm">{model.name}</span>
                  <span className="text-muted-foreground text-xs">{model.provider}</span>
                </div>
              </ModelSelectorItem>
            ))
          )}
        </ModelSelectorList>
      </ModelSelectorContent>
    </ModelSelector>
  )
})
