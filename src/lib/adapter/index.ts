/**
 * Adapter Module - Public API
 *
 * Re-exports adapter-related functionality.
 */

export {
  ADAPTERS,
  AdapterError,
  adapterExists,
  getAdapterConfig,
  listAdapters,
  runAdapter,
  type AdapterResult,
} from "./runner";
