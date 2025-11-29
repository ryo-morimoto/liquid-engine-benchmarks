/**
 * Configuration Loader
 *
 * Loads and validates leb.config.json from project root.
 */

import type { ConfigLang, LebConfig, LibraryConfig } from "./types";

const CONFIG_FILE = "leb.config.json";

/**
 * Load leb.config.json from project root.
 * @returns Parsed configuration object
 * @throws Error if file not found or invalid JSON
 */
export async function loadConfig(): Promise<LebConfig> {
  const file = Bun.file(CONFIG_FILE);
  const exists = await file.exists();

  if (!exists) {
    throw new Error(`Configuration file not found: ${CONFIG_FILE}`);
  }

  const content = await file.text();
  const config = JSON.parse(content) as LebConfig;

  validateConfig(config);

  return config;
}

/**
 * Validate configuration structure.
 * @throws Error if configuration is invalid
 */
function validateConfig(config: LebConfig): void {
  if (!config.runtimes) {
    throw new Error("Missing 'runtimes' in configuration");
  }

  if (!config.libraries || !Array.isArray(config.libraries)) {
    throw new Error("Missing or invalid 'libraries' in configuration");
  }
}

/**
 * Filter libraries by programming language.
 * @param libraries - Array of library configurations
 * @param lang - Target language to filter by
 * @returns Libraries matching the specified language
 */
export function filterLibrariesByLang(
  libraries: LibraryConfig[],
  lang: ConfigLang
): LibraryConfig[] {
  return libraries.filter((lib) => lib.lang === lang);
}

/**
 * Get runtime version for a specific language.
 * @param config - Configuration object
 * @param lang - Target language
 * @returns Version string (e.g., "8.3" for PHP, "3.3" for Ruby)
 */
export function getRuntimeVersion(config: LebConfig, lang: ConfigLang): string {
  return config.runtimes[lang];
}

/**
 * Get library configuration by adapter name.
 * @param config - Configuration object
 * @param adapterName - Adapter name (e.g., "keepsuit", "shopify")
 * @returns Library configuration or undefined if not found
 */
export function getLibraryConfig(
  config: LebConfig,
  adapterName: string
): LibraryConfig | undefined {
  return config.libraries.find((lib) => lib.name === adapterName);
}

/**
 * Get excluded scenarios for an adapter and specific library version.
 * @param config - Configuration object
 * @param adapterName - Adapter name
 * @param version - Library version (optional, if not provided returns all exclusions)
 * @returns Set of excluded scenario paths for efficient lookup
 */
export function getExcludedScenarios(
  config: LebConfig,
  adapterName: string,
  version?: string
): Set<string> {
  const library = getLibraryConfig(config, adapterName);
  const exclusions = library?.excludeScenarios ?? [];

  const scenarios = new Set<string>();

  for (const exclusion of exclusions) {
    if (typeof exclusion === "string") {
      // String exclusion applies to all versions
      scenarios.add(exclusion);
    } else {
      // Object exclusion: check if version matches
      if (!version || exclusion.version === version) {
        scenarios.add(exclusion.scenario);
      }
    }
  }

  return scenarios;
}
