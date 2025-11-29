/**
 * Setup CLI Command
 *
 * Generates dependency files (composer.json, Gemfile) from leb.config.json
 * and optionally installs dependencies.
 *
 * Usage:
 *   bun src/run.ts setup php     # Generate composer.json
 *   bun src/run.ts setup ruby    # Generate Gemfile
 *   bun src/run.ts setup all     # Generate both
 */

import {
  filterLibrariesByLang,
  getRuntimeVersion,
  loadConfig,
  type ConfigLang,
  type LebConfig,
  type LibraryConfig,
} from "../lib";

type SetupTarget = ConfigLang | "all";

const VALID_TARGETS: SetupTarget[] = ["php", "ruby", "all"];

/**
 * Parse setup command arguments.
 * @param args - CLI arguments (after 'setup' subcommand)
 */
export function parseArgs_(args: string[]): SetupTarget {
  const target = args[0];

  if (!target || target === "--help" || target === "-h") {
    printHelp();
    process.exit(0);
  }

  if (!isValidTarget(target)) {
    console.error(`Error: Invalid target "${target}"`);
    console.error(`Valid targets: ${VALID_TARGETS.join(", ")}`);
    process.exit(1);
  }

  return target;
}

function isValidTarget(target: string): target is SetupTarget {
  return VALID_TARGETS.includes(target as SetupTarget);
}

/**
 * Print help message for setup command.
 */
export function printHelp(): void {
  console.log(`
Setup Command

Generates dependency files from leb.config.json.

Usage:
  bun src/run.ts setup <target>

Targets:
  php     Generate composer.json
  ruby    Generate Gemfile
  all     Generate both

Examples:
  bun src/run.ts setup php
  bun src/run.ts setup ruby
  bun src/run.ts setup all
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
 * Setup PHP dependencies.
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
 * Setup Ruby dependencies.
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
      break;
  }

  console.log("Setup complete");
}
