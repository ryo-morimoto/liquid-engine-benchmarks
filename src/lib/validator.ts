/**
 * JSON Schema Validation Module
 *
 * Validates JSON data against schemas using Ajv.
 * Ensures adapter input/output consistency.
 */

import Ajv from "ajv";
import addFormats from "ajv-formats";
import adapterInputSchema from "../../dist/schema/adapter-input.schema.json";
import adapterOutputSchema from "../../dist/schema/adapter-output.schema.json";
import lebConfigSchema from "../../dist/schema/leb.config.schema.json";
import resultSchema from "../../dist/schema/result.schema.json";
import type { AdapterInput, AdapterOutput } from "../types";

/**
 * Create an Ajv instance with all schemas registered.
 * Schemas are generated from TypeScript types via ts-json-schema-generator.
 */
function createAjv(): Ajv {
  const ajv = new Ajv({
    allErrors: true,
    strict: true,
    strictSchema: true,
  });
  addFormats(ajv);

  // Register schemas for $ref resolution
  ajv.addSchema(adapterInputSchema);
  ajv.addSchema(adapterOutputSchema);
  ajv.addSchema(lebConfigSchema);
  ajv.addSchema(resultSchema);

  return ajv;
}

// Singleton Ajv instance
const ajv = createAjv();

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
export function validateAdapterInput(data: unknown): asserts data is AdapterInput {
  const validate = ajv.getSchema<AdapterInput>(
    "https://github.com/ryo-morimoto/liquid-engine-benchmarks/schema/adapter-input.schema.json"
  );

  if (!validate) {
    throw new Error("adapter-input.schema.json not found");
  }

  if (!validate(data)) {
    throw new Error(`Invalid AdapterInput:\n${formatErrors(validate.errors)}`);
  }
}

/**
 * Validate AdapterOutput.
 * Throws if invalid.
 */
export function validateAdapterOutput(data: unknown): asserts data is AdapterOutput {
  const validate = ajv.getSchema<AdapterOutput>(
    "https://github.com/ryo-morimoto/liquid-engine-benchmarks/schema/adapter-output.schema.json"
  );

  if (!validate) {
    throw new Error("adapter-output.schema.json not found");
  }

  if (!validate(data)) {
    throw new Error(`Invalid AdapterOutput:\n${formatErrors(validate.errors)}`);
  }
}

/**
 * Validate AdapterInput (returns boolean).
 */
export function isValidAdapterInput(data: unknown): data is AdapterInput {
  try {
    validateAdapterInput(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate AdapterOutput (returns boolean).
 */
export function isValidAdapterOutput(data: unknown): data is AdapterOutput {
  try {
    validateAdapterOutput(data);
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
export function validateWithDetails(schemaId: string, data: unknown): ValidationResult {
  const validate = ajv.getSchema(schemaId);

  if (!validate) {
    return { valid: false, errors: `Schema not found: ${schemaId}` };
  }

  const valid = validate(data);
  return {
    valid: Boolean(valid),
    errors: valid ? undefined : formatErrors(validate.errors),
  };
}
