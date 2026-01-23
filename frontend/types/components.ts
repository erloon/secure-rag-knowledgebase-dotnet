/**
 * Component type utilities for React optimization
 */

import type { MemoExoticComponent, ComponentType } from "react"

/**
 * Type-safe wrapper for React.memo'd components
 * Establishes pattern for component memoization in Phase 2+
 *
 * @example
 * ```tsx
 * export const MessageAdapter: MemoizedComponent<MessageAdapterProps> = memo(function MessageAdapter({ message }) {
 *   // ...
 * })
 * ```
 */
export type MemoizedComponent<T> = MemoExoticComponent<ComponentType<T>>
