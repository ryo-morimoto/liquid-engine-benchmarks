/**
 * Scenario Loader Unit Tests
 *
 * Tests for the ScenarioLoader class which loads Liquid scenario files
 * from the scenarios directory with hierarchical category support.
 */

import { describe, expect, test } from "bun:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createScenarioLoader, loadScenario, loadScenarios, ScenarioLoader } from "./loader";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCENARIOS_DIR = join(__dirname, "../../../scenarios");

describe("ScenarioLoader", () => {
  const loader = new ScenarioLoader(SCENARIOS_DIR);

  describe("listCategories", () => {
    test("returns available categories", () => {
      const categories = loader.listCategories();

      expect(categories).toContain("unit/tags");
      expect(categories).toContain("unit/filters");
      expect(categories).toContain("composite");
    });

    test("returns hierarchical categories", () => {
      const categories = loader.listCategories();

      // Should contain hierarchical paths
      const unitCategories = categories.filter((c) => c.startsWith("unit/"));
      expect(unitCategories.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("listCategory", () => {
    test("lists scenarios in unit/tags category", () => {
      const scenarios = loader.listCategory("unit/tags");

      expect(scenarios).toContain("for");
      expect(scenarios).toContain("if-simple");
      expect(scenarios).toContain("assign");
    });

    test("lists scenarios in unit/filters category", () => {
      const scenarios = loader.listCategory("unit/filters");

      expect(scenarios).toContain("map");
      expect(scenarios).toContain("where");
      expect(scenarios).toContain("sort");
    });

    test("lists scenarios in composite category", () => {
      const scenarios = loader.listCategory("composite");

      expect(scenarios).toContain("for-with-if");
      expect(scenarios).toContain("filter-chain-in-loop");
    });

    test("returns names without .liquid extension", () => {
      const scenarios = loader.listCategory("unit/tags");

      expect(scenarios.every((s) => !s.includes(".liquid"))).toBe(true);
    });

    test("throws for non-existent category", () => {
      expect(() => loader.listCategory("nonexistent")).toThrow("Category not found: nonexistent");
    });
  });

  describe("load", () => {
    test("loads scenario content from unit/tags", async () => {
      const content = await loader.load("unit/tags", "for");

      expect(content).toContain("{%");
      expect(typeof content).toBe("string");
    });

    test("loads scenario content from unit/filters", async () => {
      const content = await loader.load("unit/filters", "map");

      expect(content).toContain("{{");
      expect(typeof content).toBe("string");
    });

    test("throws for non-existent scenario", () => {
      expect(loader.load("unit/tags", "nonexistent")).rejects.toThrow(
        "Template not found: unit/tags/nonexistent"
      );
    });
  });

  describe("loadByPath", () => {
    test("loads scenario by 3-level path (unit/tags/for)", async () => {
      const content = await loader.loadByPath("unit/tags/for");

      expect(content).toContain("{%");
    });

    test("loads scenario by 3-level path (unit/filters/map)", async () => {
      const content = await loader.loadByPath("unit/filters/map");

      expect(content).toContain("{{");
    });

    test("loads scenario by 2-level path (composite/for-with-if)", async () => {
      const content = await loader.loadByPath("composite/for-with-if");

      expect(content).toContain("{%");
    });

    test("throws for invalid path format", () => {
      expect(loader.loadByPath("invalid")).rejects.toThrow("Invalid scenario path: invalid");
    });

    test("throws for non-existent path", () => {
      expect(loader.loadByPath("unit/tags/nonexistent")).rejects.toThrow(
        "Template not found: unit/tags/nonexistent"
      );
    });
  });

  describe("loadMany", () => {
    test("loads multiple scenarios in parallel", async () => {
      const paths = ["unit/tags/for", "unit/filters/map"];
      const results = await loader.loadMany(paths);

      expect(results.size).toBe(2);
      expect(results.has("unit/tags/for")).toBe(true);
      expect(results.has("unit/filters/map")).toBe(true);
      expect(results.get("unit/tags/for")).toContain("{%");
    });

    test("loads mixed 2-level and 3-level paths", async () => {
      const paths = ["unit/tags/for", "composite/for-with-if"];
      const results = await loader.loadMany(paths);

      expect(results.size).toBe(2);
      expect(results.has("unit/tags/for")).toBe(true);
      expect(results.has("composite/for-with-if")).toBe(true);
    });

    test("returns empty map for empty input", async () => {
      const results = await loader.loadMany([]);

      expect(results.size).toBe(0);
    });

    test("throws if any scenario not found", () => {
      const paths = ["unit/tags/for", "unit/tags/nonexistent"];

      expect(loader.loadMany(paths)).rejects.toThrow("Template not found: unit/tags/nonexistent");
    });
  });

  describe("exists", () => {
    test("returns true for existing scenario", () => {
      expect(loader.exists("unit/tags", "for")).toBe(true);
    });

    test("returns true for existing scenario in unit/filters", () => {
      expect(loader.exists("unit/filters", "map")).toBe(true);
    });

    test("returns false for non-existent scenario", () => {
      expect(loader.exists("unit/tags", "nonexistent")).toBe(false);
    });

    test("returns false for non-existent category", () => {
      expect(loader.exists("nonexistent", "for")).toBe(false);
    });
  });

  describe("existsByPath", () => {
    test("returns true for existing 3-level path", () => {
      expect(loader.existsByPath("unit/tags/for")).toBe(true);
    });

    test("returns true for existing 2-level path", () => {
      expect(loader.existsByPath("composite/for-with-if")).toBe(true);
    });

    test("returns false for non-existent path", () => {
      expect(loader.existsByPath("unit/tags/nonexistent")).toBe(false);
    });

    test("returns false for invalid path", () => {
      expect(loader.existsByPath("invalid")).toBe(false);
    });
  });

  describe("listAll", () => {
    test("returns all scenarios with metadata", () => {
      const scenarios = loader.listAll();

      expect(scenarios.length).toBeGreaterThan(0);

      const forLoop = scenarios.find((s) => s.path === "unit/tags/for");
      expect(forLoop).toBeDefined();
      expect(forLoop?.category).toBe("unit/tags");
      expect(forLoop?.name).toBe("for");
    });

    test("includes scenarios from multiple categories", () => {
      const scenarios = loader.listAll();

      const categories = new Set(scenarios.map((s) => s.category));
      expect(categories.has("unit/tags")).toBe(true);
      expect(categories.has("unit/filters")).toBe(true);
      expect(categories.has("composite")).toBe(true);
    });
  });
});

describe("createScenarioLoader", () => {
  test("creates loader with default directory", () => {
    const loader = createScenarioLoader();
    const categories = loader.listCategories();

    expect(categories.length).toBeGreaterThan(0);
  });

  test("creates loader with custom directory", () => {
    const loader = createScenarioLoader(SCENARIOS_DIR);
    const categories = loader.listCategories();

    expect(categories).toContain("unit/tags");
  });
});

describe("loadScenario", () => {
  test("loads scenario by path", async () => {
    const content = await loadScenario("unit/tags/for", SCENARIOS_DIR);

    expect(content).toContain("{%");
  });

  test("throws for non-existent scenario", () => {
    expect(loadScenario("unit/tags/nonexistent", SCENARIOS_DIR)).rejects.toThrow();
  });
});

describe("loadScenarios", () => {
  test("loads multiple scenarios in parallel", async () => {
    const paths = ["unit/tags/for", "unit/filters/map"];
    const results = await loadScenarios(paths, SCENARIOS_DIR);

    expect(results.size).toBe(2);
    expect(results.get("unit/tags/for")).toContain("{%");
    expect(results.get("unit/filters/map")).toContain("{{");
  });
});
