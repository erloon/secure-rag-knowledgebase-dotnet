/**
 * Component type utilities for React optimization
 */

import type {
  MemoExoticComponent,
  NamedExoticComponent,
  ComponentType,
  PropsWithoutRef,
  RefAttributes
} from "react"

/**
 * Type-safe wrapper for React.memo'd components
 * Establishes pattern for component memoization in Phase 2+
 *
 * Accepts both MemoExoticComponent and NamedExoticComponent to support
 * both memo(Component) and memo(function Component() {}) patterns.
 *
 * @example
 * ```tsx
 * export const MessageAdapter: MemoizedComponent<MessageAdapterProps> = memo(function MessageAdapter({ message }) {
 *   // ...
 * })
 * ```
 */
export type MemoizedComponent<T> =
  | MemoExoticComponent<ComponentType<T>>
  | NamedExoticComponent<PropsWithoutRef<T> & RefAttributes<unknown>>
