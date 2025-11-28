/**
 * Configuration Types
 *
 * Types for adapter configuration and CLI options.
 * Used by adapter-runner.ts and run.ts.
 */

import type { AdapterName, Lang, Scale } from "./constants";

/**
 * Adapter configuration.
 * Defines how to execute a benchmark adapter subprocess.
 */
export interface AdapterConfig {
  /** Adapter name */
  name: AdapterName;
  /** Programming language */
  lang: Lang;
  /** Execution command */
  command: string[];
  /** Environment variables (optional) */
  env?: Record<string, string>;
}

/**
 * CLI options.
 * Parsed command-line arguments for the benchmark runner.
 */
export interface RunOptions {
  /** Adapter to use */
  adapter: AdapterName;
  /** Template path (e.g., primitive/variable) */
  template: string;
  /** Data scale */
  scale: Scale;
  /** Number of measurement iterations */
  iterations: number;
  /** Number of warmup iterations */
  warmup: number;
  /** Output file path (defaults to stdout if omitted) */
  output?: string;
}
