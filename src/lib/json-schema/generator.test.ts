/**
 * Unit tests for JSON Schema Generator
 *
 * Tests schema generation from TypeScript types.
 * Verifies that generated schemas have correct structure and metadata.
 */

import { beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { generateSchemas } from "./generator";

/** Test output directory (uses dist/schema in project root) */
const SCHEMA_DIR = join(import.meta.dir, "../../../dist/schema");

/** Expected schema files to be generated */
const EXPECTED_SCHEMAS = [
  "adapter-input.schema.json",
  "adapter-output.schema.json",
  "leb.config.schema.json",
  "result.schema.json",
] as const;

/** Base $id URL for schema validation */
const BASE_ID = "https://github.com/ryo-morimoto/liquid-engine-benchmarks/schema";

describe("generateSchemas", () => {
  /**
   * Run schema generation once before all tests.
   * This ensures schemas exist for verification.
   */
  beforeAll(async () => {
    await generateSchemas();
  });

  describe("file generation", () => {
    test("creates all expected schema files", async () => {
      for (const filename of EXPECTED_SCHEMAS) {
        const file = Bun.file(join(SCHEMA_DIR, filename));
        expect(await file.exists()).toBe(true);
      }
    });

    test("schema files contain valid JSON", async () => {
      for (const filename of EXPECTED_SCHEMAS) {
        const file = Bun.file(join(SCHEMA_DIR, filename));
        const content = await file.text();

        expect(() => JSON.parse(content)).not.toThrow();
      }
    });
  });

  describe("schema metadata", () => {
    test("each schema has $schema field", async () => {
      for (const filename of EXPECTED_SCHEMAS) {
        const file = Bun.file(join(SCHEMA_DIR, filename));
        const schema = await file.json();

        expect(schema.$schema).toBe("http://json-schema.org/draft-07/schema#");
      }
    });

    test("each schema has correct $id field", async () => {
      for (const filename of EXPECTED_SCHEMAS) {
        const file = Bun.file(join(SCHEMA_DIR, filename));
        const schema = await file.json();

        expect(schema.$id).toBe(`${BASE_ID}/${filename}`);
      }
    });

    test("each schema has type field", async () => {
      for (const filename of EXPECTED_SCHEMAS) {
        const file = Bun.file(join(SCHEMA_DIR, filename));
        const schema = await file.json();

        expect(schema.type).toBe("object");
      }
    });
  });

  describe("AdapterInput schema structure", () => {
    test("has required properties", async () => {
      const file = Bun.file(join(SCHEMA_DIR, "adapter-input.schema.json"));
      const schema = await file.json();

      expect(schema.required).toContain("template");
      expect(schema.required).toContain("data");
      expect(schema.required).toContain("iterations");
      expect(schema.required).toContain("warmup");
    });

    test("has correct property types", async () => {
      const file = Bun.file(join(SCHEMA_DIR, "adapter-input.schema.json"));
      const schema = await file.json();

      expect(schema.properties.template.type).toBe("string");
      expect(schema.properties.data.type).toBe("object");
      // TypeScript number maps to JSON Schema "number" (not "integer")
      expect(schema.properties.iterations.type).toBe("number");
      expect(schema.properties.warmup.type).toBe("number");
    });

    test("has iterations constraints", async () => {
      const file = Bun.file(join(SCHEMA_DIR, "adapter-input.schema.json"));
      const schema = await file.json();

      expect(schema.properties.iterations.minimum).toBe(1);
      expect(schema.properties.iterations.maximum).toBe(10000);
    });
  });

  describe("AdapterOutput schema structure", () => {
    test("has required properties", async () => {
      const file = Bun.file(join(SCHEMA_DIR, "adapter-output.schema.json"));
      const schema = await file.json();

      expect(schema.required).toContain("library");
      expect(schema.required).toContain("version");
      expect(schema.required).toContain("lang");
      expect(schema.required).toContain("timings");
    });

    test("has timings definition with nested structure", async () => {
      const file = Bun.file(join(SCHEMA_DIR, "adapter-output.schema.json"));
      const schema = await file.json();

      // timings uses $ref to RawTimings definition
      expect(schema.properties.timings.$ref).toBe("#/definitions/RawTimings");

      // Verify the definition exists and has correct structure
      const rawTimings = schema.definitions.RawTimings;
      expect(rawTimings.type).toBe("object");
      expect(rawTimings.properties.parse_ms).toBeDefined();
      expect(rawTimings.properties.render_ms).toBeDefined();
    });

    test("lang definition is enum with supported values", async () => {
      const file = Bun.file(join(SCHEMA_DIR, "adapter-output.schema.json"));
      const schema = await file.json();

      // lang uses $ref to Lang definition
      expect(schema.properties.lang.$ref).toBe("#/definitions/Lang");

      // Verify the definition has enum values
      const lang = schema.definitions.Lang;
      expect(lang.enum).toContain("php");
      expect(lang.enum).toContain("ruby");
      expect(lang.enum).toContain("go");
      expect(lang.enum).toContain("rust");
      expect(lang.enum).toContain("javascript");
    });
  });

  describe("LebConfig schema structure", () => {
    test("has required config properties", async () => {
      const file = Bun.file(join(SCHEMA_DIR, "leb.config.schema.json"));
      const schema = await file.json();

      // LebConfig requires runtimes, baseline, and libraries
      expect(schema.required).toContain("runtimes");
      expect(schema.required).toContain("baseline");
      expect(schema.required).toContain("libraries");
    });

    test("has runtimes and libraries properties", async () => {
      const file = Bun.file(join(SCHEMA_DIR, "leb.config.schema.json"));
      const schema = await file.json();

      expect(schema.properties.runtimes).toBeDefined();
      expect(schema.properties.libraries).toBeDefined();
      expect(schema.properties.baseline).toBeDefined();
    });
  });

  describe("BenchmarkResult schema structure", () => {
    test("has required result properties", async () => {
      const file = Bun.file(join(SCHEMA_DIR, "result.schema.json"));
      const schema = await file.json();

      // BenchmarkResult has meta and results at top level
      expect(schema.required).toContain("meta");
      expect(schema.required).toContain("results");
    });

    test("has BenchmarkEntry definition with library info", async () => {
      const file = Bun.file(join(SCHEMA_DIR, "result.schema.json"));
      const schema = await file.json();

      // Verify BenchmarkEntry definition exists
      const entry = schema.definitions.BenchmarkEntry;
      expect(entry).toBeDefined();
      expect(entry.required).toContain("library");
      expect(entry.required).toContain("version");
      expect(entry.required).toContain("lang");
      expect(entry.required).toContain("timings");
    });
  });
});
