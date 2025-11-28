#!/usr/bin/env bun
/**
 * Validate YAML files against JSON Schema
 * Automatically loads base.schema.json for external $ref resolution
 * Usage: bun scripts/ajv.ts <schema> <yaml-file>
 */

import Ajv from "ajv";
import addFormats from "ajv-formats";
import { parse } from "yaml";
import { dirname, join } from "path";

const [schemaPath, yamlPath] = Bun.argv.slice(2);

if (!schemaPath || !yamlPath) {
  console.error("Usage: bun scripts/ajv.ts <schema> <yaml-file>");
  process.exit(1);
}

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Load base schema for external $ref resolution
const schemaDir = dirname(schemaPath);
const baseSchemaPath = join(schemaDir, "base.schema.json");
const baseSchemaFile = Bun.file(baseSchemaPath);

if (await baseSchemaFile.exists()) {
  const baseSchema = await baseSchemaFile.json();
  ajv.addSchema(baseSchema, "base.schema.json");
}

const schema = await Bun.file(schemaPath).json();
const yaml = parse(await Bun.file(yamlPath).text());

const validate = ajv.compile(schema);
const valid = validate(yaml);

if (!valid) {
  console.error("Validation failed:");
  console.error(JSON.stringify(validate.errors, null, 2));
  process.exit(1);
}

console.log(`✓ ${yamlPath} is valid`);
