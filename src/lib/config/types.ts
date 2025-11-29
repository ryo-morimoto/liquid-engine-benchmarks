/**
 * Configuration Types
 *
 * Type definitions for leb.config.json schema.
 */

/**
 * Supported programming languages.
 */
export type ConfigLang = "php" | "ruby";

/**
 * Runtime version configuration.
 */
export interface RuntimeConfig {
  php: string;
  ruby: string;
}

/**
 * Baseline library configuration.
 */
export interface BaselineConfig {
  library: string;
  version: string;
}

/**
 * Library configuration entry.
 */
export interface LibraryConfig {
  lang: ConfigLang;
  name: string;
  package: string;
  versions: string[];
}

/**
 * Root configuration schema for leb.config.json.
 */
export interface LebConfig {
  $schema?: string;
  runtimes: RuntimeConfig;
  baseline: BaselineConfig;
  libraries: LibraryConfig[];
}
