/**
 * Config Module - Public API
 *
 * Provides configuration loading and utilities for leb.config.json.
 * Types are exported from src/types for Single Source of Truth.
 */

// Re-export types from src/types for backward compatibility
export type {
  BaselineConfig,
  ConfigLang,
  LebConfig,
  LibraryConfig,
} from "../../types";
export {
  filterLibrariesByLang,
  getExcludedScenarios,
  getLibraryConfig,
  getRuntimeVersion,
  loadConfig,
} from "./loader";
