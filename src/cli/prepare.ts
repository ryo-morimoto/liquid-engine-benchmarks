/**
 * Prepare CLI Command
 *
 * Prepares the project for use:
 * 1. Generates JSON Schema files from TypeScript types
 * 2. Seeds the benchmark database with test data
 *
 * Usage:
 *   leb prepare
 */

import { join } from "node:path";
import { generateSchemas } from "../lib/json-schema/generator";

const SEED_SCRIPT = join(import.meta.dir, "../db/seed.ts");

/**
 * Print help message for prepare command.
 */
export function printHelp(): void {
  console.log(`
Prepare Command

Prepares the project for use:
1. Generates JSON Schema files (.generated/schema/)
2. Seeds the benchmark database (.generated/benchmark.db)

Usage:
  leb prepare

Output:
  .generated/schema/*.schema.json
  .generated/benchmark.db
`);
}

/**
 * Run prepare command.
 * Generates schemas and seeds the benchmark database.
 *
 * @param args - CLI arguments (after 'prepare' subcommand)
 */
export async function run(args: string[]): Promise<void> {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  // Step 1: Generate JSON Schemas
  await generateSchemas();

  // Step 2: Seed database
  const result = await Bun.$`bun ${SEED_SCRIPT}`.quiet();
  console.log(result.text());

  if (result.exitCode !== 0) {
    process.exit(result.exitCode);
  }
}
