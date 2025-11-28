#!/usr/bin/env bun
/**
 * Validate JSON files against JSON Schema
 *
 * Schemas are generated from TypeScript types via ts-json-schema-generator.
 * Run `bun generate:schema` to regenerate schemas after type changes.
 *
 * Usage: bun scripts/validate-schema.ts <schema> <json-file>
 */

import Ajv from "ajv";
import addFormats from "ajv-formats";

const [schemaPath, jsonPath] = Bun.argv.slice(2);

if (!schemaPath || !jsonPath) {
  console.error("Usage: bun scripts/validate-schema.ts <schema> <json-file>");
  process.exit(1);
}

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const schema = await Bun.file(schemaPath).json();
const data = await Bun.file(jsonPath).json();

const validate = ajv.compile(schema);
const valid = validate(data);

if (!valid) {
  console.error("Validation failed:");
  console.error(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}

console.log(`✓ ${jsonPath} is valid`);
