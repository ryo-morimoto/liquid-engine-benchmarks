/**
 * List CLI Command
 *
 * Lists available adapters or scenarios.
 * Outputs one item per line for easy shell composition.
 *
 * Usage:
 *   leb list adapters              # List all adapters
 *   leb list scenarios             # List all scenarios
 *   leb list scenarios -c unit/tags  # List scenarios in category
 */

import { parseArgs } from "node:util";
import { createScenarioLoader, listAdapters } from "../lib";

type ListTarget = "adapters" | "scenarios";

/**
 * CLI options for list command.
 */
interface ListOptions {
  target: ListTarget;
  category?: string;
}

/**
 * Parse command-line arguments for list command.
 * @param args - CLI arguments (after 'list' subcommand)
 */
export function parseArgs_(args: string[]): ListOptions {
  // Extract positional target
  const positional: string[] = [];
  const flagArgs: string[] = [];
  let expectingValue = false;

  for (const arg of args) {
    if (expectingValue) {
      flagArgs.push(arg);
      expectingValue = false;
    } else if (arg === "-h" || arg === "--help") {
      printHelp();
      process.exit(0);
    } else if (arg.startsWith("-")) {
      flagArgs.push(arg);
      if (arg === "-c" || arg === "--category") {
        expectingValue = true;
      }
    } else {
      positional.push(arg);
    }
  }

  const { values } = parseArgs({
    args: flagArgs,
    options: {
      category: { type: "string", short: "c" },
    },
    strict: true,
    allowPositionals: false,
  });

  const [target] = positional;

  if (!target) {
    console.error("Error: <target> is required");
    console.error("");
    printHelp();
    process.exit(1);
  }

  if (target !== "adapters" && target !== "scenarios") {
    console.error(`Error: Unknown target "${target}"`);
    console.error("Valid targets: adapters, scenarios");
    process.exit(1);
  }

  return {
    target,
    category: values.category,
  };
}

/**
 * Print help message for list command.
 */
export function printHelp(): void {
  console.log(`
list - List available adapters or scenarios

Usage:
  leb list <target> [options]

Targets:
  adapters     List all available adapters
  scenarios    List all available scenarios

Options:
  -c, --category <cat>   Filter scenarios by category (e.g., unit/tags)
  -h, --help             Show this help

Examples:
  leb list adapters
  leb list scenarios
  leb list scenarios -c unit/tags
  leb list scenarios -c composite

Shell composition:
  # Run benchmark for all scenarios with a specific adapter
  leb list scenarios | xargs -I{} leb bench keepsuit {}

  # Run all adapters against one scenario
  leb list adapters | xargs -I{} leb bench {} unit/tags/for
`);
}

/**
 * Run list command.
 * Outputs one item per line to stdout.
 * @param args - CLI arguments (after 'list' subcommand)
 */
export function run(args: string[]): void {
  const options = parseArgs_(args);

  if (options.target === "adapters") {
    const adapters = listAdapters();
    for (const adapter of adapters) {
      console.log(adapter);
    }
    return;
  }

  // List scenarios
  const loader = createScenarioLoader();
  const allScenarios = loader.listAll();

  // Filter out partials (not benchmarkable)
  let scenarios = allScenarios.filter((s) => s.category !== "partials");

  // Apply category filter if specified
  if (options.category) {
    scenarios = scenarios.filter(
      (s) => s.category === options.category || s.category.startsWith(`${options.category}/`)
    );

    if (scenarios.length === 0) {
      console.error(`Warning: No scenarios found in category "${options.category}"`);
      process.exit(0);
    }
  }

  // Output one path per line
  for (const scenario of scenarios) {
    console.log(scenario.path);
  }
}
