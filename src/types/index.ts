/**
 * Types Module - Public API
 *
 * Re-exports all public types from sub-modules.
 * Consumers should import from this index file.
 */

// Constants and type guards
export {
  ADAPTER_NAMES,
  LANGS,
  SCALES,
  isAdapterName,
  isLang,
  isScale,
  type AdapterName,
  type Lang,
  type Scale,
} from "./constants";

// Configuration types
export type { AdapterConfig, RunOptions } from "./config";

// Adapter I/O types
export type {
  AdapterInput,
  AdapterOutput,
  PhaseMetrics,
  RawTimings,
  SemVer,
  TimingMetrics,
  TimingValue,
} from "./schema";

// Benchmark configuration and result types
export type {
  BaselineConfig,
  LebConfig,
  BenchmarkEntry,
  BenchmarkMeta,
  BenchmarkResult,
  LibraryConfig,
  LibraryName,
  RunAdapter,
  RunMetadata,
  RunResult,
  RuntimeVersion,
} from "./benchmark";
