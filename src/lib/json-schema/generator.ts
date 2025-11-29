/**
 * JSON Schema Generator
 *
 * Generates JSON Schema files from TypeScript type definitions.
 * Uses ts-json-schema-generator to convert types in src/types/ to JSON Schema.
 *
 * Output:
 *   dist/schema/*.schema.json
 */

import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { type Config, createGenerator } from "ts-json-schema-generator";

/** Project root directory */
const PROJECT_ROOT = join(import.meta.dir, "../../..");

/** Source types directory */
const TYPES_DIR = join(PROJECT_ROOT, "src/types");

/** Output schema directory */
const SCHEMA_DIR = join(PROJECT_ROOT, "dist/schema");

/**
 * Schema generation configuration.
 * Maps TypeScript type names to output file names.
 */
const SCHEMAS = [
  { type: "AdapterInput", file: "adapter-input.schema.json" },
  { type: "AdapterOutput", file: "adapter-output.schema.json" },
  { type: "LebConfig", file: "leb.config.schema.json" },
  { type: "BenchmarkResult", file: "result.schema.json" },
] as const;

/** Base $id URL for schema references */
const BASE_ID = "https://github.com/ryo-morimoto/liquid-engine-benchmarks/schema";

/**
 * Generate a JSON Schema for a specific TypeScript type.
 *
 * @param typeName - The name of the type to generate schema for
 * @returns The generated JSON Schema object
 */
function generateSchemaForType(typeName: string): object {
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
 * Post-process schema to add $id and $schema fields.
 *
 * @param schema - The raw generated schema
 * @param filename - The output filename for $id generation
 * @returns The processed schema with metadata
 */
function postProcessSchema(schema: object, filename: string): object {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: `${BASE_ID}/${filename}`,
    ...schema,
  };
}

/**
 * Generate all JSON Schema files from TypeScript types.
 *
 * Creates dist/schema/ directory if needed and generates:
 * - adapter-input.schema.json
 * - adapter-output.schema.json
 * - leb.config.schema.json
 * - result.schema.json
 */
export async function generateSchemas(): Promise<void> {
  console.log("Generating JSON Schemas...");

  // Ensure output directory exists
  await mkdir(SCHEMA_DIR, { recursive: true });

  for (const { type, file } of SCHEMAS) {
    try {
      const schema = generateSchemaForType(type);
      const processed = postProcessSchema(schema, file);
      const outputPath = join(SCHEMA_DIR, file);
      await Bun.write(outputPath, `${JSON.stringify(processed, null, 2)}\n`);
      console.log(`  ✓ ${file}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ Failed to generate ${file}: ${message}`);
      throw error;
    }
  }
}
