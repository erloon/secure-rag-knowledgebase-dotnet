// hooks/useDataSourceSelector.ts

import { useState, useMemo, useCallback } from "react"
import type { DataSourceFile } from "@/types/chat"

export interface UseDataSourceSelectorParams {
  /** Available files */
  availableFiles: DataSourceFile[]
  /** Initially selected file IDs */
  initialSelectedIds?: string[]
  /** Selection change handler from props */
  onSelectionChange?: (selectedIds: string[]) => void
}

export interface UseDataSourceSelectorReturn {
  selectedFiles: DataSourceFile[]
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  toggleSource: (sourceId: string) => void
  isSelected: (sourceId: string) => boolean
  selectedCount: number
}

/**
 * Data source selector state management
 */
export function useDataSourceSelector(
  params: UseDataSourceSelectorParams
): UseDataSourceSelectorReturn {
  const { availableFiles, initialSelectedIds = [], onSelectionChange } = params

  // Initialize selected file IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(initialSelectedIds)
  )

  const [isOpen, setIsOpen] = useState(false)

  // Get selected file objects from IDs
  const selectedFiles = useMemo(() => {
    return availableFiles.filter(file => selectedIds.has(file.id))
  }, [availableFiles, selectedIds])

  const selectedCount = selectedIds.size

  // Check if a source is selected
  const isSelected = useCallback(
    (sourceId: string): boolean => {
      return selectedIds.has(sourceId)
    },
    [selectedIds]
  )

  // Toggle a source selection
  const toggleSource = useCallback(
    (sourceId: string) => {
      // Only allow toggling valid source IDs
      const isValidSource = availableFiles.some(file => file.id === sourceId)
      if (!isValidSource) {
        return
      }

      setSelectedIds(prev => {
        const newSet = new Set(prev)

        if (newSet.has(sourceId)) {
          newSet.delete(sourceId)
        } else {
          newSet.add(sourceId)
        }

        // Convert to sorted array for callback
        const sortedIds = Array.from(newSet).sort()
        onSelectionChange?.(sortedIds)

        return newSet
      })
    },
    [availableFiles, onSelectionChange]
  )

  return {
    selectedFiles,
    isOpen,
    setIsOpen,
    toggleSource,
    isSelected,
    selectedCount
  }
}
