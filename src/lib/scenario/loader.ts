/**
 * Scenario Loader Module
 *
 * Loads Liquid scenario files from the scenarios directory.
 * Provides utilities for listing and reading scenarios by category.
 * Uses Bun's native file API for async file operations.
 */

import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_SCENARIOS_DIR = join(__dirname, "../../../scenarios");

/**
 * Valid scenario categories (hierarchical path format).
 * - unit/tags: Individual tag tests (for, if, include, etc.)
 * - unit/filters: Individual filter tests (map, where, sort, etc.)
 * - composite: Combined feature tests
 * - partials: Shared partials for include/render
 */
const SCENARIO_CATEGORIES = ["unit/tags", "unit/filters", "composite", "partials"] as const;

/**
 * Scenario categories available in the scenarios directory.
 */
export type ScenarioCategory = (typeof SCENARIO_CATEGORIES)[number];

/**
 * Type guard for ScenarioCategory.
 */
export function isScenarioCategory(value: string): value is ScenarioCategory {
  return (SCENARIO_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Scenario metadata.
 */
export interface ScenarioInfo {
  /** Category (e.g., unit/tags, unit/filters) */
  category: ScenarioCategory;
  /** Scenario name without extension (e.g., for, map) */
  name: string;
  /** Full path to scenario (e.g., unit/tags/for) */
  path: string;
}

/**
 * Scenario Loader Class
 *
 * Loads and lists Liquid scenarios from the filesystem.
 * Supports hierarchical category paths (e.g., unit/tags, unit/filters).
 * All file reading operations are async using Bun.file().
 */
export class ScenarioLoader {
  private baseDir: string;

  constructor(baseDir: string = DEFAULT_SCENARIOS_DIR) {
    this.baseDir = baseDir;
  }

  /**
   * Load a template by category and name.
   * Returns the template source code.
   */
  async load(category: string, name: string): Promise<string> {
    const filePath = join(this.baseDir, category, `${name}.liquid`);

    if (!existsSync(filePath)) {
      throw new Error(`Template not found: ${category}/${name}`);
    }

    // Explicit await for better stack traces on errors
    return await Bun.file(filePath).text();
  }

  /**
   * Load a scenario by path (e.g., "unit/tags/for", "composite/for-with-if").
   * Supports both 2-level (composite/x) and 3-level (unit/tags/x) paths.
   */
  async loadByPath(scenarioPath: string): Promise<string> {
    const { category, name } = this.parsePath(scenarioPath);

    if (!category || !name) {
      throw new Error(
        `Invalid scenario path: ${scenarioPath}. Expected format: category/name (e.g., unit/tags/for)`
      );
    }

    return this.load(category, name);
  }

  /**
   * Parse a scenario path into category and name.
   * Handles hierarchical categories like "unit/tags" and flat ones like "composite".
   */
  private parsePath(scenarioPath: string): { category: string; name: string } {
    const parts = scenarioPath.split("/");

    // 3-level: unit/tags/for → category=unit/tags, name=for
    if (parts.length === 3) {
      return { category: `${parts[0]}/${parts[1]}`, name: parts[2] };
    }

    // 2-level: composite/for-with-if → category=composite, name=for-with-if
    if (parts.length === 2) {
      return { category: parts[0], name: parts[1] };
    }

    return { category: "", name: "" };
  }

  /**
   * Load multiple templates in parallel.
   * Uses Promise.all for efficient concurrent loading.
   */
  async loadMany(templatePaths: string[]): Promise<Map<string, string>> {
    const results = await Promise.all(
      templatePaths.map(async (path) => {
        const content = await this.loadByPath(path);
        return [path, content] as const;
      })
    );

    return new Map(results);
  }

  /**
   * List all templates in a category.
   * This operation is synchronous as it only reads directory entries.
   */
  listCategory(category: string): string[] {
    const categoryDir = join(this.baseDir, category);

    if (!existsSync(categoryDir)) {
      throw new Error(`Category not found: ${category}`);
    }

    const files = readdirSync(categoryDir);
    return files.filter((f) => f.endsWith(".liquid")).map((f) => f.replace(".liquid", ""));
  }

  /**
   * List all available categories.
   * Returns hierarchical categories (e.g., "unit/tags", "unit/filters", "composite").
   * This operation is synchronous as it only reads directory entries.
   */
  listCategories(): ScenarioCategory[] {
    // Return the predefined valid categories that exist in the filesystem
    return SCENARIO_CATEGORIES.filter((cat) => {
      const categoryDir = join(this.baseDir, cat);
      return existsSync(categoryDir);
    });
  }

  /**
   * List all scenarios with metadata.
   * This operation is synchronous as it only reads directory entries.
   */
  listAll(): ScenarioInfo[] {
    const categories = this.listCategories();
    const scenarios: ScenarioInfo[] = [];

    for (const category of categories) {
      const names = this.listCategory(category);
      for (const name of names) {
        scenarios.push({
          category,
          name,
          path: `${category}/${name}`,
        });
      }
    }

    return scenarios;
  }

  /**
   * Check if a template exists.
   * This operation is synchronous as it only checks file existence.
   */
  exists(category: string, name: string): boolean {
    const filePath = join(this.baseDir, category, `${name}.liquid`);
    return existsSync(filePath);
  }

  /**
   * Check if a scenario exists by path.
   * This operation is synchronous as it only checks file existence.
   */
  existsByPath(scenarioPath: string): boolean {
    const { category, name } = this.parsePath(scenarioPath);
    if (!category || !name) return false;
    return this.exists(category, name);
  }
}

/**
 * Create a scenario loader with the default scenarios directory.
 */
export function createScenarioLoader(baseDir?: string): ScenarioLoader {
  return new ScenarioLoader(baseDir);
}

/**
 * Load a scenario by path (convenience function).
 */
export async function loadScenario(scenarioPath: string, baseDir?: string): Promise<string> {
  const loader = new ScenarioLoader(baseDir);
  return loader.loadByPath(scenarioPath);
}

/**
 * Load multiple scenarios in parallel (convenience function).
 */
export async function loadScenarios(
  scenarioPaths: string[],
  baseDir?: string
): Promise<Map<string, string>> {
  const loader = new ScenarioLoader(baseDir);
  return loader.loadMany(scenarioPaths);
}

