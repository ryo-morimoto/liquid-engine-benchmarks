/**
 * template loader unit tests
 */

import { describe, expect, test } from "bun:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createTemplateLoader,
  loadTemplate,
  loadTemplates,
  TemplateLoader,
} from "./loader";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, "../../../templates");

describe("TemplateLoader", () => {
  const loader = new TemplateLoader(TEMPLATES_DIR);

  describe("listCategories", () => {
    test("returns available categories", () => {
      const categories = loader.listCategories();

      expect(categories).toContain("primitive");
      expect(categories).toContain("ecommerce");
      expect(categories).toContain("blog");
    });

    test("returns only directories", () => {
      const categories = loader.listCategories();

      // Should not contain files
      expect(categories.every((c) => !c.includes("."))).toBe(true);
    });
  });

  describe("listCategory", () => {
    test("lists templates in primitive category", () => {
      const templates = loader.listCategory("primitive");

      expect(templates).toContain("variable");
      expect(templates).toContain("loop-simple");
      expect(templates).toContain("condition-simple");
    });

    test("lists templates in ecommerce category", () => {
      const templates = loader.listCategory("ecommerce");

      expect(templates).toContain("product");
      expect(templates).toContain("cart");
      expect(templates).toContain("collection");
    });

    test("returns names without .liquid extension", () => {
      const templates = loader.listCategory("primitive");

      expect(templates.every((t) => !t.includes(".liquid"))).toBe(true);
    });

    test("throws for non-existent category", () => {
      expect(() => loader.listCategory("nonexistent")).toThrow("Category not found: nonexistent");
    });
  });

  describe("load", () => {
    test("loads template content", async () => {
      const content = await loader.load("primitive", "variable");

      expect(content).toContain("{{");
      expect(typeof content).toBe("string");
    });

    test("throws for non-existent template", () => {
      expect(loader.load("primitive", "nonexistent")).rejects.toThrow(
        "Template not found: primitive/nonexistent"
      );
    });
  });

  describe("loadByPath", () => {
    test("loads template by path", async () => {
      const content = await loader.loadByPath("primitive/variable");

      expect(content).toContain("{{");
    });

    test("throws for invalid path format", () => {
      expect(loader.loadByPath("invalid")).rejects.toThrow("Invalid template path: invalid");
    });

    test("throws for non-existent path", () => {
      expect(loader.loadByPath("primitive/nonexistent")).rejects.toThrow(
        "Template not found: primitive/nonexistent"
      );
    });
  });

  describe("loadMany", () => {
    test("loads multiple templates in parallel", async () => {
      const paths = ["primitive/variable", "primitive/loop-simple"];
      const results = await loader.loadMany(paths);

      expect(results.size).toBe(2);
      expect(results.has("primitive/variable")).toBe(true);
      expect(results.has("primitive/loop-simple")).toBe(true);
      expect(results.get("primitive/variable")).toContain("{{");
    });

    test("returns empty map for empty input", async () => {
      const results = await loader.loadMany([]);

      expect(results.size).toBe(0);
    });

    test("throws if any template not found", () => {
      const paths = ["primitive/variable", "primitive/nonexistent"];

      expect(loader.loadMany(paths)).rejects.toThrow("Template not found: primitive/nonexistent");
    });
  });

  describe("exists", () => {
    test("returns true for existing template", () => {
      expect(loader.exists("primitive", "variable")).toBe(true);
    });

    test("returns false for non-existent template", () => {
      expect(loader.exists("primitive", "nonexistent")).toBe(false);
    });

    test("returns false for non-existent category", () => {
      expect(loader.exists("nonexistent", "variable")).toBe(false);
    });
  });

  describe("existsByPath", () => {
    test("returns true for existing path", () => {
      expect(loader.existsByPath("primitive/variable")).toBe(true);
    });

    test("returns false for non-existent path", () => {
      expect(loader.existsByPath("primitive/nonexistent")).toBe(false);
    });

    test("returns false for invalid path", () => {
      expect(loader.existsByPath("invalid")).toBe(false);
    });
  });

  describe("listAll", () => {
    test("returns all templates with metadata", () => {
      const templates = loader.listAll();

      expect(templates.length).toBeGreaterThan(0);

      const variable = templates.find((t) => t.path === "primitive/variable");
      expect(variable).toBeDefined();
      expect(variable?.category).toBe("primitive");
      expect(variable?.name).toBe("variable");
    });

    test("includes templates from multiple categories", () => {
      const templates = loader.listAll();

      const categories = new Set(templates.map((t) => t.category));
      expect(categories.size).toBeGreaterThan(1);
    });
  });
});

describe("createTemplateLoader", () => {
  test("creates loader with default directory", () => {
    const loader = createTemplateLoader();
    const categories = loader.listCategories();

    expect(categories.length).toBeGreaterThan(0);
  });

  test("creates loader with custom directory", () => {
    const loader = createTemplateLoader(TEMPLATES_DIR);
    const categories = loader.listCategories();

    expect(categories).toContain("primitive");
  });
});

describe("loadTemplate", () => {
  test("loads template by path", async () => {
    const content = await loadTemplate("primitive/variable", TEMPLATES_DIR);

    expect(content).toContain("{{");
  });

  test("throws for non-existent template", () => {
    expect(loadTemplate("primitive/nonexistent", TEMPLATES_DIR)).rejects.toThrow();
  });
});

describe("loadTemplates", () => {
  test("loads multiple templates in parallel", async () => {
    const paths = ["primitive/variable", "ecommerce/product"];
    const results = await loadTemplates(paths, TEMPLATES_DIR);

    expect(results.size).toBe(2);
    expect(results.get("primitive/variable")).toContain("{{");
    expect(results.get("ecommerce/product")).toContain("{{");
  });
});
