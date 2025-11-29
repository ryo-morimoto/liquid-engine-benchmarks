/**
 * Prepare CLI Command
 *
 * Seeds the benchmark database with test data.
 * Uses a fixed seed for reproducible data generation.
 *
 * Usage:
 *   leb prepare
 */

import { join } from "node:path";

const SEED_SCRIPT = join(import.meta.dir, "../db/seed.ts");

/**
 * Print help message for prepare command.
 */
export function printHelp(): void {
  console.log(`
Prepare Command

Seeds the benchmark database with test data.
Uses a fixed seed (42) for reproducible data generation.

Usage:
  leb prepare

Output:
  data/benchmark.db
`);
}

/**
 * Run prepare command - seeds the benchmark database.
 * @param args - CLI arguments (after 'prepare' subcommand)
 */
export async function run(args: string[]): Promise<void> {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }

  const result = await Bun.$`bun ${SEED_SCRIPT}`.quiet();
  console.log(result.text());

  if (result.exitCode !== 0) {
    process.exit(result.exitCode);
  }
}
