/**
 * Lib Module - Public API
 *
 * Re-exports all library functionality from sub-modules.
 * Consumers should import from this index file or specific sub-modules.
 */

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

// Data module
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
} from "./data";

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

// Template module
export {
  createTemplateLoader,
  isTemplateCategory,
  loadTemplate,
  loadTemplates,
  TemplateLoader,
  type TemplateCategory,
  type TemplateInfo,
} from "./template";

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
