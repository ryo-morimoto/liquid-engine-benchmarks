/**
 * Const Definitions and Derived Types
 *
 * Single Source of Truth for runtime constants and their derived types.
 * Uses const tuples and mapped types for type-safe value validation.
 */

// ============================================================================
// Utility Types (type-fest inspired)
// ============================================================================

/**
 * Extracts element type from a readonly array or tuple.
 * Similar to type-fest's `ArrayElement`.
 *
 * @example
 * const arr = ["a", "b", "c"] as const;
 * type Elem = ArrayElement<typeof arr>; // "a" | "b" | "c"
 */
type ArrayElement<T extends readonly unknown[]> = T extends readonly (infer E)[] ? E : never;

// ============================================================================
// Const Tuples (Single Source of Truth)
// ============================================================================

/**
 * Supported programming languages as const tuple.
 * This is the runtime and compile-time source of truth for language values.
 */
export const LANGS = ["php", "ruby", "go", "rust", "javascript"] as const;

/**
 * Benchmark adapter names as const tuple.
 * This is the runtime and compile-time source of truth for adapter names.
 */
export const ADAPTER_NAMES = ["keepsuit", "kalimatas", "shopify"] as const;

/**
 * Supported runtime environments as const tuple.
 * Subset of LANGS that have implemented adapters.
 */
export const RUNTIME_NAMES = ["php", "ruby"] as const;

/**
 * Data scales as const tuple.
 * This is the runtime and compile-time source of truth for scale values.
 */
export const SCALES = ["small", "medium", "large", "2xl"] as const;

// ============================================================================
// Derived Types (from const tuples)
// ============================================================================

/**
 * Supported programming languages.
 * Derived from LANGS const tuple using ArrayElement.
 */
export type Lang = ArrayElement<typeof LANGS>;

/**
 * Benchmark adapter names.
 * Derived from ADAPTER_NAMES const tuple using ArrayElement.
 */
export type AdapterName = ArrayElement<typeof ADAPTER_NAMES>;

/**
 * Data scale for benchmark datasets.
 * Derived from SCALES const tuple using ArrayElement.
 */
export type Scale = ArrayElement<typeof SCALES>;

/**
 * Runtime environment names.
 * Derived from RUNTIME_NAMES const tuple using ArrayElement.
 */
export type RuntimeName = ArrayElement<typeof RUNTIME_NAMES>;

// ============================================================================
// Type Guards (for runtime validation)
// ============================================================================

/**
 * Type guard for Lang.
 * Validates that a string is a valid programming language.
 */
export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

/**
 * Type guard for AdapterName.
 * Validates that a string is a valid adapter name.
 */
export function isAdapterName(value: string): value is AdapterName {
  return (ADAPTER_NAMES as readonly string[]).includes(value);
}

/**
 * Type guard for Scale.
 * Validates that a string is a valid scale value.
 */
export function isScale(value: string): value is Scale {
  return (SCALES as readonly string[]).includes(value);
}
