/**
 * Lib Module - Public API
 *
 * Re-exports all library functionality from sub-modules.
 * Consumers should import from this index file or specific sub-modules.
 */

// Data module (re-exported from src/db)
export {
  type BenchmarkData,
  type CartItem,
  type Collection,
  DataLoader,
  type Image,
  loadData,
  type Post,
  type Product,
  SCALE_LIMITS,
  type User,
  type Variant,
} from "../db";

// Adapter module
export {
  ADAPTERS,
  AdapterError,
  type AdapterResult,
  adapterExists,
  getAdapterConfig,
  listAdapters,
  runAdapter,
} from "./adapter";
// Config module
export {
  type BaselineConfig,
  type ConfigLang,
  filterLibrariesByLang,
  getExcludedScenarios,
  getLibraryConfig,
  getRuntimeVersion,
  type LebConfig,
  type LibraryConfig,
  loadConfig,
} from "./config";
// Environment check module
export {
  type CheckResult,
  checkAdapter,
  checkAdapters,
  checkAllAdapters,
  ensureAdapterReady,
} from "./env-check";
// Errors module
export { CliError, type CliErrorDetails, ErrorCode, Errors } from "./errors";
// Scenario module
export {
  createScenarioLoader,
  isScenarioCategory,
  loadScenario,
  loadScenarios,
  type ScenarioCategory,
  type ScenarioInfo,
  ScenarioLoader,
} from "./scenario";
// Snapshot module
export {
  updateSnapshot,
  type VerifyResult,
  verifySnapshot,
} from "./snapshot";
// Stats module
export {
  addArrays,
  calculateMetrics,
  max,
  mean,
  median,
  min,
  stddev,
} from "./stats";
// Validator module
export {
  formatErrors,
  isValidAdapterInput,
  isValidAdapterOutput,
  type ValidationResult,
  validateAdapterInput,
  validateAdapterOutput,
  validateWithDetails,
} from "./validator";
