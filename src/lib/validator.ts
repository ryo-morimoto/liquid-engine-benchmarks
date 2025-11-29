/**
 * JSON Schema Validation Module
 *
 * Validates JSON data against schemas using Ajv.
 * Ensures adapter input/output consistency.
 *
 * Schemas are loaded lazily to allow CLI to run before schema generation.
 */

import { join } from "node:path";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import type { AdapterInput, AdapterOutput } from "../types";

/** Schema directory path */
const SCHEMA_DIR = join(import.meta.dir, "../../dist/schema");

/** Schema file names */
const SCHEMA_FILES = [
  "adapter-input.schema.json",
  "adapter-output.schema.json",
  "leb.config.schema.json",
  "result.schema.json",
] as const;

/** Cached Ajv instance (lazy-loaded) */
let ajvInstance: Ajv | null = null;

/**
 * Load a JSON schema file.
 * Throws if the schema file doesn't exist.
 */
async function loadSchema(filename: string): Promise<object> {
  const path = join(SCHEMA_DIR, filename);
  const file = Bun.file(path);

  if (!(await file.exists())) {
    throw new Error(
      `Schema file not found: ${path}\nRun 'bun src/run.ts prepare' to generate schemas.`
    );
  }

  return file.json();
}

/**
 * Get the Ajv instance, loading schemas lazily on first call.
 * Schemas are generated from TypeScript types via ts-json-schema-generator.
 */
async function getAjv(): Promise<Ajv> {
  if (ajvInstance) {
    return ajvInstance;
  }

  const ajv = new Ajv({
    allErrors: true,
    strict: true,
    strictSchema: true,
  });
  addFormats(ajv);

  // Load and register all schemas
  for (const file of SCHEMA_FILES) {
    const schema = await loadSchema(file);
    ajv.addSchema(schema);
  }

  ajvInstance = ajv;
  return ajv;
}

/**
 * Format validation errors into a readable string.
 */
export function formatErrors(errors: Ajv["errors"]): string {
  if (!errors) return "Unknown validation error";

  return errors
    .map((e) => {
      const path = e.instancePath || "(root)";
      return `${path}: ${e.message}`;
    })
    .join("\n");
}

/**
 * Validate AdapterInput.
 * Throws if invalid.
 */
export async function validateAdapterInput(data: unknown): Promise<AdapterInput> {
  const ajv = await getAjv();
  const validate = ajv.getSchema<AdapterInput>(
    "https://github.com/ryo-morimoto/liquid-engine-benchmarks/schema/adapter-input.schema.json"
  );

  if (!validate) {
    throw new Error("adapter-input.schema.json not found");
  }

  if (!validate(data)) {
    throw new Error(`Invalid AdapterInput:\n${formatErrors(validate.errors)}`);
  }

  return data;
}

/**
 * Validate AdapterOutput.
 * Throws if invalid.
 */
export async function validateAdapterOutput(data: unknown): Promise<AdapterOutput> {
  const ajv = await getAjv();
  const validate = ajv.getSchema<AdapterOutput>(
    "https://github.com/ryo-morimoto/liquid-engine-benchmarks/schema/adapter-output.schema.json"
  );

  if (!validate) {
    throw new Error("adapter-output.schema.json not found");
  }

  if (!validate(data)) {
    throw new Error(`Invalid AdapterOutput:\n${formatErrors(validate.errors)}`);
  }

  return data;
}

/**
 * Validate AdapterInput (returns boolean).
 */
export async function isValidAdapterInput(data: unknown): Promise<boolean> {
  try {
    await validateAdapterInput(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate AdapterOutput (returns boolean).
 */
export async function isValidAdapterOutput(data: unknown): Promise<boolean> {
  try {
    await validateAdapterOutput(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validation result with error details.
 */
export interface ValidationResult {
  valid: boolean;
  errors?: string;
}

/**
 * Validate data against a schema and return detailed results.
 */
export async function validateWithDetails(
  schemaId: string,
  data: unknown
): Promise<ValidationResult> {
  const ajv = await getAjv();
  const validate = ajv.getSchema(schemaId);

  if (!validate) {
    return { valid: false, errors: `Schema not found: ${schemaId}` };
  }

  const valid = validate(data);

  if (valid) {
    return { valid: true };
  }

  return {
    valid: false,
    errors: formatErrors(validate.errors),
  };
}
