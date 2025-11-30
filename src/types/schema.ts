/**
 * JSON Schema Derived Types
 *
 * TypeScript types corresponding to JSON Schema definitions.
 * These types represent the data structures for adapter I/O and benchmark results.
 *
 * JSDoc annotations are used for JSON Schema generation constraints.
 */

import type { Lang } from "./constants";

// ============================================================================
// Adapter I/O Types (adapter-input.schema.json, adapter-output.schema.json)
// ============================================================================

/**
 * Input to benchmark adapters.
 * Sent via stdin as JSON.
 */
export interface AdapterInput {
  /**
   * Liquid template source code to benchmark
   * @minLength 1
   */
  template: string;
  /** Template variables passed to render() */
  data: Record<string, unknown>;
  /**
   * Number of measurement iterations
   * @minimum 1
   * @maximum 10000
   */
  iterations: number;
  /**
   * Number of warmup iterations (not measured)
   * @minimum 0
   * @maximum 1000
   */
  warmup: number;
}

/**
 * Raw timing measurements.
 * Holds timing values for each iteration as arrays.
 */
export interface RawTimings {
  /**
   * Parse time for each iteration (milliseconds)
   * @minItems 1
   */
  parse_ms: TimingValue[];
  /**
   * Render time for each iteration (milliseconds)
   * @minItems 1
   */
  render_ms: TimingValue[];
}

/**
 * Timing value in milliseconds.
 * @minimum 0
 */
export type TimingValue = number;

/**
 * Semantic version string (e.g., "1.2.3").
 * @pattern ^[0-9]+\.[0-9]+\.[0-9]+$
 */
export type SemVer = string;

/**
 * Output from benchmark adapters.
 * Written to stdout as JSON.
 */
export interface AdapterOutput {
  /**
   * Library identifier (e.g., keepsuit/php-liquid)
   * @minLength 1
   */
  library: string;
  /** Library version (semver format) */
  version: SemVer;
  /** Programming language */
  lang: Lang;
  /** Runtime version (e.g., 8.3.0) */
  runtime_version?: string;
  /** Raw timing measurements */
  timings: RawTimings;
  /**
   * Rendered template output.
   * Used for snapshot testing to verify output consistency across implementations.
   */
  rendered_output?: string;
}

// ============================================================================
// Result Types (result.schema.json)
// ============================================================================

/**
 * Phase metrics after statistical calculation.
 * Corresponds to result.schema.json#/definitions/phaseMetrics.
 */
export interface PhaseMetrics {
  /** Mean value (milliseconds) */
  mean_ms: number;
  /** Standard deviation (milliseconds) */
  stddev_ms: number;
  /** Minimum value (milliseconds) */
  min_ms: number;
  /** Maximum value (milliseconds) */
  max_ms: number;
  /** Median value (milliseconds) */
  median_ms: number;
}

/**
 * Timing metrics after statistical calculation.
 * Corresponds to result.schema.json#/definitions/timingMetrics.
 */
export interface TimingMetrics {
  parse: PhaseMetrics;
  render: PhaseMetrics;
  total: PhaseMetrics;
}
