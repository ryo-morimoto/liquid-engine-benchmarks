/**
 * Lib Module - Public API
 *
 * Re-exports all library functionality from sub-modules.
 * Consumers should import from this index file or specific sub-modules.
 */

// Config module
export {
  filterLibrariesByLang,
  getRuntimeVersion,
  loadConfig,
  type BaselineConfig,
  type ConfigLang,
  type LebConfig,
  type LibraryConfig,
  type RuntimeConfig,
} from "./config";

// Adapter module
export {
  ADAPTERS,
  AdapterError,
  adapterExists,
  getAdapterConfig,
  listAdapters,
  runAdapter,
  type AdapterResult,
} from "./adapter";

// Data module (re-exported from src/db)
export {
  DataLoader,
  loadData,
  SCALE_LIMITS,
  type BenchmarkData,
  type CartItem,
  type Collection,
  type Image,
  type Post,
  type Product,
  type User,
  type Variant,
} from "../db";

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

// Scenario module
export {
  createScenarioLoader,
  isScenarioCategory,
  loadScenario,
  loadScenarios,
  ScenarioLoader,
  type ScenarioCategory,
  type ScenarioInfo,
} from "./scenario";

// Validator module
export {
  formatErrors,
  isValidAdapterInput,
  isValidAdapterOutput,
  validateAdapterInput,
  validateAdapterOutput,
  validateWithDetails,
  type ValidationResult,
} from "./validator";
