#!/usr/bin/env bun
/**
 * Generate JSON Schema from TypeScript types
 *
 * Uses ts-json-schema-generator to generate JSON Schema files
 * from TypeScript type definitions in src/types/.
 *
 * Usage:
 *   bun scripts/generate-schema.ts
 */

import { createGenerator, type Config } from "ts-json-schema-generator";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const TYPES_DIR = join(PROJECT_ROOT, "src/types");
const SCHEMA_DIR = join(PROJECT_ROOT, "dist/schema");

/**
 * Schema generation configuration.
 * Maps type names to output file names.
 */
const SCHEMAS = [
  { type: "AdapterInput", file: "adapter-input.schema.json" },
  { type: "AdapterOutput", file: "adapter-output.schema.json" },
  { type: "LebConfig", file: "leb.config.schema.json" },
  { type: "BenchmarkResult", file: "result.schema.json" },
] as const;

/**
 * Base $id URL for schema references.
 */
const BASE_ID = "https://github.com/ryo-morimoto/liquid-engine-benchmarks/schema";

/**
 * Generate a JSON Schema for a specific type.
 */
function generateSchema(typeName: string): object {
  const config: Config = {
    path: join(TYPES_DIR, "index.ts"),
    tsconfig: join(PROJECT_ROOT, "tsconfig.json"),
    type: typeName,
    skipTypeCheck: true,
    topRef: false,
    expose: "export",
    jsDoc: "extended",
    sortProps: true,
    strictTuples: true,
    encodeRefs: false,
  };

  const generator = createGenerator(config);
  return generator.createSchema(typeName);
}

/**
 * Add $id and clean up schema.
 */
function postProcessSchema(schema: object, filename: string): object {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: `${BASE_ID}/${filename}`,
    ...schema,
  };
}

/**
 * Main entry point.
 */
async function main(): Promise<void> {
  console.log("Generating JSON Schemas from TypeScript types...\n");

  for (const { type, file } of SCHEMAS) {
    try {
      console.log(`  Generating ${file} from ${type}...`);
      const schema = generateSchema(type);
      const processed = postProcessSchema(schema, file);
      const outputPath = join(SCHEMA_DIR, file);
      await Bun.write(outputPath, JSON.stringify(processed, null, 2) + "\n");
      console.log(`  ✓ ${file}`);
    } catch (error) {
      console.error(`  ✗ Failed to generate ${file}:`, error);
      process.exit(1);
    }
  }

  console.log("\nDone!");
}

// Run main function with proper error handling
main().catch((error: Error) => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});
