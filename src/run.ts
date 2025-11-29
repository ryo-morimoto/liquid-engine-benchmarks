#!/usr/bin/env bun

/**
 * Liquid Engine Benchmark CLI
 *
 * Unified entry point for all CLI commands.
 *
 * Usage:
 *   bun src/run.ts <command> [options]
 *
 * Commands:
 *   bench   Run benchmark for a specific adapter
 *   setup   Generate dependency files from leb.config.json
 */

import { bench, setup } from "./cli";

const COMMANDS = {
  bench: bench.run,
  setup: setup.run,
} as const;

type Command = keyof typeof COMMANDS;

function printHelp(): void {
  console.log(`
Liquid Engine Benchmark CLI

Usage:
  bun src/run.ts <command> [options]

Commands:
  bench   Run benchmark for a specific adapter
  setup   Generate dependency files (composer.json, Gemfile)

Examples:
  bun src/run.ts bench -a keepsuit -t primitive/variable
  bun src/run.ts setup php
  bun src/run.ts setup all

Run 'bun src/run.ts <command> --help' for command-specific help.
`);
}

function isCommand(cmd: string): cmd is Command {
  return cmd in COMMANDS;
}

async function main(): Promise<void> {
  const args = Bun.argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
  }

  if (!isCommand(command)) {
    console.error(`Error: Unknown command "${command}"`);
    printHelp();
    process.exit(1);
  }

  const commandArgs = args.slice(1);
  await COMMANDS[command](commandArgs);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
