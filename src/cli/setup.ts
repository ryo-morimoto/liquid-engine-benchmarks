/**
 * Setup CLI Command
 *
 * Prepares the benchmark environment:
 * - Generates dependency files (composer.json, Gemfile)
 * - Seeds the benchmark database
 *
 * Usage:
 *   leb setup          # Run all setup (php + ruby + db)
 *   leb setup php      # Generate composer.json only
 *   leb setup ruby     # Generate Gemfile only
 *
 * For database seeding only, run directly:
 *   bun src/db/seed.ts
 */

import { join } from "node:path";
import {
  filterLibrariesByLang,
  getRuntimeVersion,
  loadConfig,
  type ConfigLang,
  type LebConfig,
} from "../lib";

/**
 * Setup target options.
 * - "all": run all setup tasks (default when no args)
 * - "php": generate composer.json only
 * - "ruby": generate Gemfile only
 */
type SetupTarget = ConfigLang | "all";

const VALID_TARGETS: ConfigLang[] = ["php", "ruby"];

const SEED_SCRIPT = join(import.meta.dir, "../db/seed.ts");

/**
 * Parse setup command arguments.
 * No arguments means "all" (run everything).
 * @param args - CLI arguments (after 'setup' subcommand)
 */
export function parseArgs_(args: string[]): SetupTarget {
  const target = args[0];

  // Handle help flag
  if (target === "--help" || target === "-h") {
    printHelp();
    process.exit(0);
  }

  // No arguments → run all setup
  if (!target) {
    return "all";
  }

  if (!isValidTarget(target)) {
    console.error(`Error: Invalid target "${target}"`);
    console.error(`Valid targets: ${VALID_TARGETS.join(", ")}`);
    process.exit(1);
  }

  return target;
}

function isValidTarget(target: string): target is ConfigLang {
  return VALID_TARGETS.includes(target as ConfigLang);
}

/**
 * Print help message for setup command.
 */
export function printHelp(): void {
  console.log(`
Setup Command

Prepares the benchmark environment.

Usage:
  leb setup [target]

Targets:
  (none)  Run all setup (php + ruby + db)
  php     Generate composer.json only
  ruby    Generate Gemfile only

Examples:
  leb setup              # Full setup
  leb setup php          # PHP dependencies only
  leb prepare            # Database only
`);
}

/**
 * Generate composer.json content from config.
 */
export function generateComposerJson(config: LebConfig): string {
  const phpLibs = filterLibrariesByLang(config.libraries, "php");
  const phpVersion = getRuntimeVersion(config, "php");

  const require: Record<string, string> = {
    php: `>=${phpVersion}`,
  };

  for (const lib of phpLibs) {
    require[lib.package] = "*";
  }

  const composerJson = {
    name: "liquid-engine-benchmarks/adapters",
    description: "PHP Liquid template engine adapters for benchmarking",
    type: "project",
    license: "MIT",
    require,
    config: {
      "optimize-autoloader": true,
      "sort-packages": true,
    },
  };

  return JSON.stringify(composerJson, null, 2);
}

/**
 * Generate Gemfile content from config.
 */
export function generateGemfile(config: LebConfig): string {
  const rubyLibs = filterLibrariesByLang(config.libraries, "ruby");

  const lines = [
    "# frozen_string_literal: true",
    "# Auto-generated from leb.config.json",
    "",
    'source "https://rubygems.org"',
    "",
  ];

  for (const lib of rubyLibs) {
    lines.push(`gem "${lib.package}"`);
  }

  return lines.join("\n") + "\n";
}

/**
 * Write file only if content has changed.
 * @returns true if file was written, false if unchanged
 */
async function writeIfChanged(path: string, content: string): Promise<boolean> {
  const file = Bun.file(path);
  const exists = await file.exists();

  if (exists) {
    const current = await file.text();
    if (current === content) {
      return false;
    }
  }

  await Bun.write(path, content);
  return true;
}

/**
 * Setup PHP dependencies - generates composer.json.
 */
async function setupPhp(config: LebConfig): Promise<void> {
  const content = generateComposerJson(config);
  const written = await writeIfChanged("composer.json", content);

  if (written) {
    console.log("Generated composer.json");
  } else {
    console.log("composer.json is up to date");
  }
}

/**
 * Setup Ruby dependencies - generates Gemfile.
 */
async function setupRuby(config: LebConfig): Promise<void> {
  const content = generateGemfile(config);
  const written = await writeIfChanged("Gemfile", content);

  if (written) {
    console.log("Generated Gemfile");
  } else {
    console.log("Gemfile is up to date");
  }
}

/**
 * Setup database - seeds benchmark data.
 * Delegates to src/db/seed.ts for the actual seeding logic.
 */
async function setupDb(): Promise<void> {
  const result = await Bun.$`bun ${SEED_SCRIPT}`.quiet();
  console.log(result.text());

  if (result.exitCode !== 0) {
    throw new Error("Database seeding failed");
  }
}

/**
 * Run setup command.
 * @param args - CLI arguments (after 'setup' subcommand)
 */
export async function run(args: string[]): Promise<void> {
  const target = parseArgs_(args);
  const config = await loadConfig();

  switch (target) {
    case "php":
      await setupPhp(config);
      break;
    case "ruby":
      await setupRuby(config);
      break;
    case "all":
      await setupPhp(config);
      await setupRuby(config);
      await setupDb();
      break;
  }

  console.log("Setup complete");
}
