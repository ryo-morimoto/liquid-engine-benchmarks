/**
 * Adapter Module - Public API
 *
 * Re-exports adapter-related functionality.
 */

export {
  ADAPTERS,
  AdapterError,
  type AdapterResult,
  adapterExists,
  getAdapterConfig,
  listAdapters,
  runAdapter,
} from "./runner";
