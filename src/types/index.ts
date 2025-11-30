/**
 * Types Module - Public API
 *
 * Re-exports all public types from sub-modules.
 * Consumers should import from this index file.
 */

// Benchmark configuration and result types
export type {
  BaselineConfig,
  BenchmarkEntry,
  BenchmarkMeta,
  BenchmarkResult,
  ConfigLang,
  LebConfig,
  LibraryConfig,
  LibraryName,
  RunAdapter,
  RunMetadata,
  RunResult,
  RuntimeVersion,
} from "./benchmark";

// Configuration types
export type { AdapterConfig, RunOptions } from "./config";
// Constants and type guards
export {
  ADAPTER_NAMES,
  type AdapterName,
  isAdapterName,
  isLang,
  isScale,
  LANGS,
  type Lang,
  RUNTIME_NAMES,
  type RuntimeName,
  SCALES,
  type Scale,
} from "./constants";
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
