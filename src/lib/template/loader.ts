/**
 * Template Loader Module
 *
 * Loads Liquid template files from the templates directory.
 * Provides utilities for listing and reading templates by category.
 * Uses Bun's native file API for async file operations.
 */

import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_TEMPLATES_DIR = join(__dirname, "../../../templates");

/**
 * Valid template categories.
 */
const VALID_CATEGORIES = ["primitive", "ecommerce", "blog", "email", "cms", "stress"] as const;

/**
 * Template categories available in the templates directory.
 */
export type TemplateCategory = (typeof VALID_CATEGORIES)[number];

/**
 * Type guard for TemplateCategory.
 */
export function isTemplateCategory(value: string): value is TemplateCategory {
  return (VALID_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Template metadata.
 */
export interface TemplateInfo {
  /** Category (e.g., primitive, ecommerce) */
  category: TemplateCategory;
  /** Template name without extension (e.g., variable, product) */
  name: string;
  /** Full path to template (e.g., primitive/variable) */
  path: string;
}

/**
 * Template Loader Class
 *
 * Loads and lists Liquid templates from the filesystem.
 * All file reading operations are async using Bun.file().
 */
export class TemplateLoader {
  private baseDir: string;

  constructor(baseDir: string = DEFAULT_TEMPLATES_DIR) {
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
   * Load a template by path (e.g., "primitive/variable").
   */
  async loadByPath(templatePath: string): Promise<string> {
    const [category, name] = templatePath.split("/");

    if (!category || !name) {
      throw new Error(`Invalid template path: ${templatePath}. Expected format: category/name`);
    }

    return this.load(category, name);
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
   * This operation is synchronous as it only reads directory entries.
   */
  listCategories(): string[] {
    const entries = readdirSync(this.baseDir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  }

  /**
   * List all templates with metadata.
   * This operation is synchronous as it only reads directory entries.
   */
  listAll(): TemplateInfo[] {
    const categories = this.listCategories();
    const templates: TemplateInfo[] = [];

    for (const category of categories) {
      // Skip unknown categories
      if (!isTemplateCategory(category)) {
        continue;
      }
      const names = this.listCategory(category);
      for (const name of names) {
        templates.push({
          category,
          name,
          path: `${category}/${name}`,
        });
      }
    }

    return templates;
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
   * Check if a template exists by path.
   * This operation is synchronous as it only checks file existence.
   */
  existsByPath(templatePath: string): boolean {
    const [category, name] = templatePath.split("/");
    if (!category || !name) return false;
    return this.exists(category, name);
  }
}

/**
 * Create a template loader with the default templates directory.
 */
export function createTemplateLoader(baseDir?: string): TemplateLoader {
  return new TemplateLoader(baseDir);
}

/**
 * Load a template by path (convenience function).
 */
export async function loadTemplate(templatePath: string, baseDir?: string): Promise<string> {
  const loader = new TemplateLoader(baseDir);
  return loader.loadByPath(templatePath);
}

/**
 * Load multiple templates in parallel (convenience function).
 */
export async function loadTemplates(
  templatePaths: string[],
  baseDir?: string
): Promise<Map<string, string>> {
  const loader = new TemplateLoader(baseDir);
  return loader.loadMany(templatePaths);
}
