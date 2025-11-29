/**
 * Benchmark CLI Command
 *
 * Runs benchmark for a specific adapter and template.
 * Outputs results in result.schema.json format.
 *
 * Usage:
 *   bun src/run.ts bench --adapter keepsuit --template primitive/variable
 */

import { parseArgs } from "node:util";
import {
  adapterExists,
  addArrays,
  calculateMetrics,
  listAdapters,
  loadData,
  loadTemplate,
  runAdapter,
} from "../lib";
import {
  isScale,
  SCALES,
  type AdapterName,
  type Scale,
  type TimingMetrics,
} from "../types";

/**
 * CLI options for bench command.
 */
interface BenchOptions {
  adapter: AdapterName;
  template: string;
  scale: Scale;
  iterations: number;
  warmup: number;
  output?: string;
}

/**
 * Default configuration values.
 */
const DEFAULTS = {
  iterations: 100,
  warmup: 10,
  scale: "medium" satisfies Scale,
};

/**
 * Parse command-line arguments for bench command.
 * @param args - CLI arguments (after 'bench' subcommand)
 */
export function parseArgs_(args: string[]): BenchOptions {
  const { values } = parseArgs({
    args,
    options: {
      adapter: { type: "string", short: "a" },
      template: { type: "string", short: "t" },
      scale: { type: "string", short: "s" },
      iterations: { type: "string", short: "i" },
      warmup: { type: "string", short: "w" },
      output: { type: "string", short: "o" },
      help: { type: "boolean", short: "h" },
    },
    strict: true,
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  if (!values.adapter) {
    console.error("Error: --adapter is required");
    printHelp();
    process.exit(1);
  }

  if (!values.template) {
    console.error("Error: --template is required");
    printHelp();
    process.exit(1);
  }

  if (!adapterExists(values.adapter)) {
    console.error(`Error: Unknown adapter "${values.adapter}"`);
    console.error(`Available adapters: ${listAdapters().join(", ")}`);
    process.exit(1);
  }

  const scaleInput = values.scale || DEFAULTS.scale;
  if (!isScale(scaleInput)) {
    console.error(`Error: Invalid scale "${values.scale}"`);
    console.error(`Valid scales: ${SCALES.join(", ")}`);
    process.exit(1);
  }
  const scale = scaleInput;

  const iterations = values.iterations ? parseInt(values.iterations, 10) : DEFAULTS.iterations;
  const warmup = values.warmup ? parseInt(values.warmup, 10) : DEFAULTS.warmup;

  if (Number.isNaN(iterations) || iterations < 1 || iterations > 10000) {
    console.error("Error: --iterations must be between 1 and 10000");
    process.exit(1);
  }

  if (Number.isNaN(warmup) || warmup < 0 || warmup > 1000) {
    console.error("Error: --warmup must be between 0 and 1000");
    process.exit(1);
  }

  const result: BenchOptions = {
    adapter: values.adapter as AdapterName,
    template: values.template,
    scale,
    iterations,
    warmup,
  };

  if (values.output !== undefined) {
    result.output = values.output;
  }

  return result;
}

/**
 * Print help message for bench command.
 */
export function printHelp(): void {
  console.log(`
Benchmark Command

Usage:
  bun src/run.ts bench [options]

Required Options:
  -a, --adapter <name>     Adapter to use (keepsuit, kalimatas, shopify)
  -t, --template <path>    Template path (e.g., primitive/variable)

Options:
  -s, --scale <size>       Data scale: small, medium, large, 2xl (default: medium)
  -i, --iterations <n>     Number of measured iterations (default: 100)
  -w, --warmup <n>         Number of warmup iterations (default: 10)
  -o, --output <file>      Output file path (default: stdout)
  -h, --help               Show this help message

Examples:
  bun src/run.ts bench -a keepsuit -t primitive/variable
  bun src/run.ts bench -a shopify -t ecommerce/product -s large -i 500
`);
}

/**
 * Calculate timing metrics from raw timing arrays.
 */
function calculateTimingMetrics(parseMs: number[], renderMs: number[]): TimingMetrics {
  const totalMs = addArrays(parseMs, renderMs);

  return {
    parse: calculateMetrics(parseMs),
    render: calculateMetrics(renderMs),
    total: calculateMetrics(totalMs),
  };
}

/**
 * Run bench command.
 * @param args - CLI arguments (after 'bench' subcommand)
 */
export async function run(args: string[]): Promise<void> {
  const options = parseArgs_(args);

  console.error(`Running benchmark:`);
  console.error(`  Adapter:    ${options.adapter}`);
  console.error(`  Template:   ${options.template}`);
  console.error(`  Scale:      ${options.scale}`);
  console.error(`  Iterations: ${options.iterations}`);
  console.error(`  Warmup:     ${options.warmup}`);
  console.error("");

  console.error(`Loading template: ${options.template}...`);
  const template = await loadTemplate(options.template);

  console.error(`Loading data (scale: ${options.scale})...`);
  const data = loadData(options.scale);

  const input = {
    template,
    data,
    iterations: options.iterations,
    warmup: options.warmup,
  };

  console.error(`Running adapter: ${options.adapter}...`);
  const startTime = Date.now();
  const result = await runAdapter(options.adapter, input);
  const totalTimeMs = Date.now() - startTime;

  console.error(`Adapter completed in ${totalTimeMs}ms`);
  console.error("");

  const metrics = calculateTimingMetrics(
    result.output.timings.parse_ms,
    result.output.timings.render_ms
  );

  const output = {
    metadata: {
      timestamp: new Date().toISOString(),
      template: options.template,
      scale: options.scale,
      iterations: options.iterations,
      warmup: options.warmup,
    },
    adapter: {
      name: options.adapter,
      library: result.output.library,
      version: result.output.version,
      lang: result.output.lang,
      runtime_version: result.output.runtime_version,
    },
    metrics,
  };

  const outputJson = JSON.stringify(output, null, 2);

  if (options.output) {
    await Bun.write(options.output, outputJson);
    console.error(`Result written to: ${options.output}`);
  } else {
    console.log(outputJson);
  }
}
