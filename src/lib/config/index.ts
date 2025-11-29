/**
 * Config Module - Public API
 *
 * Provides configuration loading and utilities for leb.config.json.
 */

export {
  filterLibrariesByLang,
  getExcludedScenarios,
  getLibraryConfig,
  getRuntimeVersion,
  loadConfig,
} from "./loader";
export type {
  BaselineConfig,
  ConfigLang,
  LebConfig,
  LibraryConfig,
  RuntimeConfig,
  ScenarioExclusion,
} from "./types";
