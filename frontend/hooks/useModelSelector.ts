// hooks/useModelSelector.ts

import { useState, useMemo, useCallback } from "react"
import type { AIModel } from "@/types/chat"

export interface UseModelSelectorParams {
  /** Available models */
  models: AIModel[]
  /** Initial model ID */
  initialModelId?: string
  /** Model change handler from props */
  onModelChange?: (model: AIModel) => void
}

export interface UseModelSelectorReturn {
  selectedModel: AIModel | null
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  selectModel: (modelId: string) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredModels: AIModel[]
}

/**
 * Model selector state management
 */
export function useModelSelector(
  params: UseModelSelectorParams
): UseModelSelectorReturn {
  const { models, initialModelId, onModelChange } = params

  // Initialize selected model
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(() => {
    if (models.length === 0) return null
    if (initialModelId) {
      const found = models.find(m => m.id === initialModelId)
      return found ?? models[0] ?? null
    }
    return models[0] ?? null
  })

  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Filter models by search query
  const filteredModels = useMemo(() => {
    if (!searchQuery) return models

    const query = searchQuery.toLowerCase()
    return models.filter(
      model =>
        model.name.toLowerCase().includes(query) ||
        model.provider.toLowerCase().includes(query)
    )
  }, [models, searchQuery])

  // Select a model by ID
  const selectModel = useCallback(
    (modelId: string) => {
      const model = models.find(m => m.id === modelId)
      if (model) {
        setSelectedModel(model)
        onModelChange?.(model)
      }
    },
    [models, onModelChange]
  )

  return {
    selectedModel,
    isOpen,
    setIsOpen,
    selectModel,
    searchQuery,
    setSearchQuery,
    filteredModels
  }
}
