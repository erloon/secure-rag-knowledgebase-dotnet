// components/chat/DataSourceSelector.tsx

import { memo, useCallback, useMemo } from "react"
import { File, Plus, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useDataSourceSelector } from "@/hooks/useDataSourceSelector"
import { useAIChatContext } from "@/contexts/AIChatContext"
import type { DataSourceFile } from "@/types/chat"
import type { MemoizedComponent } from "@/types/components"
import type { ReactNode } from "react"

/**
 * Props for DataSourceSelector component
 */
export interface DataSourceSelectorProps {
  /** Available files to select from */
  availableFiles: DataSourceFile[]
  /** Optional custom trigger element */
  trigger?: ReactNode
}

/**
 * Format file size for display
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * DataSourceSelector - Custom file selection component with Dialog UI.
 * Displays available files with checkboxes and shows selected count badge.
 *
 * Follows Phase 1.7 conventions:
 * - MemoizedComponent<T> type for React.memo
 * - useCallback for stable callbacks
 * - useMemo for computed values
 * - Context integration for shared state
 *
 * @example
 * ```tsx
 * <DataSourceSelector availableFiles={files} />
 * ```
 */
export const DataSourceSelector: MemoizedComponent<DataSourceSelectorProps> = memo(function DataSourceSelector({
  availableFiles,
  trigger,
}) {
  const { toggleSource: contextToggleSource, selectedSources } = useAIChatContext()

  // Use data source selector hook for local state management
  const {
    isOpen,
    setIsOpen,
    toggleSource,
    isSelected,
    selectedCount,
  } = useDataSourceSelector({
    availableFiles,
    initialSelectedIds: selectedSources.map((s) => s.id),
    onSelectionChange: (ids) => {
      // Sync with context is handled in handleToggle below
    },
  })

  // Handle toggle - sync with both local state and context
  const handleToggle = useCallback(
    (sourceId: string) => {
      toggleSource(sourceId)
      contextToggleSource(sourceId)
    },
    [toggleSource, contextToggleSource]
  )

  // Default trigger button with badge count
  const defaultTrigger = (
    <button
      type="button"
      className="relative inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
    >
      <Plus className="size-4" />
      <span>Data Sources</span>
      {selectedCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
          {selectedCount}
        </span>
      )}
    </button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col gap-4">
          {/* Header with title and count */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Select Data Sources</h2>
            <span className="text-muted-foreground text-sm">
              {selectedCount} selected
            </span>
          </div>

          {/* Scrollable file list */}
          <ScrollArea className="h-64">
            {availableFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <File className="text-muted-foreground mb-2 size-8" />
                <p className="text-muted-foreground text-sm">No files available</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {availableFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent/50"
                    onClick={() => handleToggle(file.id)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleToggle(file.id)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <Checkbox
                      checked={isSelected(file.id)}
                      onChange={() => handleToggle(file.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${file.filename}`}
                    />

                    <File className="text-muted-foreground size-4" />

                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-medium">{file.filename}</span>
                      <div className="text-muted-foreground text-xs">
                        {file.chunkCount ?? 0} chunks • {formatFileSize(file.size)}
                      </div>
                    </div>

                    {isSelected(file.id) && (
                      <Check className="text-primary size-4" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer with action hint */}
          <div className="text-muted-foreground text-xs">
            Click on a file to toggle selection. Selected files will be used as context for your questions.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})
