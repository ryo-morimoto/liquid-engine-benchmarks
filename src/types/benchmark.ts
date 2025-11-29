/**
 * Benchmark Configuration and Result Types
 *
 * Types for leb.config.json configuration and benchmark result output.
 * These types are the Single Source of Truth for JSON Schema generation.
 */

import type { Lang, Scale } from "./constants";
import type { SemVer, TimingMetrics } from "./schema";

// Re-export SemVer for convenience
export type { SemVer } from "./schema";

// ============================================================================
// Benchmark Configuration (bench.json)
// ============================================================================

/**
 * Runtime version string (e.g., "8.3" or "8.3.0").
 * @pattern ^[0-9]+\.[0-9]+(\.[0-9]+)?$
 */
export type RuntimeVersion = string;

/**
 * Library name in lowercase with hyphens (e.g., "php-liquid").
 * @pattern ^[a-z][a-z0-9-]*$
 */
export type LibraryName = string;

/**
 * Baseline library configuration.
 * Specifies which library/version to use as the performance baseline.
 */
export interface BaselineConfig {
  /** Library name (must match a name in libraries) */
  library: string;
  /** Version to use as baseline */
  version: SemVer;
}

/**
 * Scenario exclusion rule.
 * Can be a simple string (excludes for all versions) or an object with version constraint.
 */
export type ScenarioExclusion =
  | string
  | {
      /** Scenario path to exclude */
      scenario: string;
      /** Library version for which this exclusion applies */
      version: SemVer;
    };

/**
 * Library configuration for benchmarking.
 * Defines a target library with its package info and versions to test.
 */
export interface LibraryConfig {
  /** Programming language */
  lang: Lang;
  /** Short name for the library (used in adapter selection) */
  name: LibraryName;
  /** Package name for the package manager */
  package: string;
  /** Versions to benchmark */
  versions: SemVer[];
  /** Scenarios to exclude (not supported by this library) */
  excludeScenarios?: ScenarioExclusion[];
}

/**
 * Benchmark configuration file structure.
 * Corresponds to leb.config.json.
 */
export interface LebConfig {
  /** JSON Schema reference for editor support */
  $schema?: string;
  /** Runtime versions for each language */
  runtimes: Partial<Record<Lang, RuntimeVersion>>;
  /** Baseline library for comparison */
  baseline: BaselineConfig;
  /** Target libraries to benchmark */
  libraries: LibraryConfig[];
}

// ============================================================================
// Benchmark Result Output
// ============================================================================

/**
 * Single benchmark result entry for a library version.
 */
export interface BenchmarkEntry {
  /** Library name */
  library: LibraryName;
  /** Library version */
  version: SemVer;
  /** Programming language */
  lang: Lang;
  /** Timing measurements */
  timings: TimingMetrics;
  /** Performance ratio compared to baseline (1.0 = same as baseline) */
  baseline_ratio?: number;
}

/**
 * Benchmark execution metadata.
 */
export interface BenchmarkMeta {
  /** ISO 8601 timestamp when benchmark was executed */
  timestamp: string;
  /** Number of iterations per benchmark run */
  iterations: number;
  /** Template file or identifier used for benchmarking */
  template: string;
  /** Number of warmup iterations before measurement */
  warmup?: number;
}

/**
 * Complete benchmark result output.
 * Corresponds to result.schema.json.
 */
export interface BenchmarkResult {
  /** Metadata about the benchmark execution */
  meta: BenchmarkMeta;
  /** Benchmark results for each library/version combination */
  results: BenchmarkEntry[];
}

// ============================================================================
// Single Run Result (output from run.ts)
// ============================================================================

/**
 * Metadata for a single benchmark run.
 */
export interface RunMetadata {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Template path (e.g., "primitive/variable") */
  template: string;
  /** Data scale used */
  scale: Scale;
  /** Number of iterations */
  iterations: number;
  /** Number of warmup iterations */
  warmup: number;
}

/**
 * Adapter information in run result.
 */
export interface RunAdapter {
  /** Adapter name */
  name: string;
  /** Library identifier */
  library: string;
  /** Library version */
  version: string;
  /** Programming language */
  lang: Lang;
  /** Runtime version */
  runtime_version?: string;
}

/**
 * Output from a single benchmark run (run.ts output).
 */
export interface RunResult {
  /** Run metadata */
  metadata: RunMetadata;
  /** Adapter information */
  adapter: RunAdapter;
  /** Calculated metrics */
  metrics: TimingMetrics;
}
