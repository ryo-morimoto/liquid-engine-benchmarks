#!/usr/bin/env bun

/**
 * Liquid Engine Benchmark CLI (leb)
 *
 * Entry point for benchmark commands.
 * Follows Unix philosophy: small commands that do one thing well.
 *
 * Usage:
 *   leb <command> [args] [options]
 *
 * Commands:
 *   bench     Run benchmarks (all or single)
 *   list      List adapters or scenarios
 *   prepare   Seed benchmark database
 *   setup     Prepare environment (dependencies + database)
 */

import { bench, list, prepare, setup } from "./cli";

/**
 * Command registry maps command names to their handler functions.
 */
const COMMANDS = {
  bench: bench.run,
  list: list.run,
  prepare: prepare.run,
  setup: setup.run,
} as const;

type Command = keyof typeof COMMANDS;

/**
 * Print main help message.
 * Lists available commands and common usage patterns.
 */
function printHelp(): void {
  console.log(`
leb - Liquid Engine Benchmark CLI

Usage:
  leb <command> [args] [options]

Commands:
  bench     Run benchmarks (all or single)
  list      List adapters or scenarios
  prepare   Seed benchmark database
  setup     Prepare environment (dependencies + database)

Examples:
  # Full setup (generates files + seeds database)
  leb setup

  # Database only
  leb prepare

  # Run all benchmarks
  leb bench

  # Run single benchmark
  leb bench keepsuit unit/tags/for

  # List and query
  leb list adapters
  leb list scenarios -c unit/tags

Run 'leb <command> --help' for command-specific help.
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
