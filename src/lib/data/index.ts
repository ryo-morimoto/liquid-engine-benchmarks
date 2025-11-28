/**
 * Data Module - Public API
 *
 * Re-exports data loading functionality.
 */

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
} from "./loader";
