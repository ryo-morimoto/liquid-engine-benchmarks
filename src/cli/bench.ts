/**
 * Benchmark CLI Command
 *
 * Runs benchmarks for adapters and scenarios.
 * Follows Unix philosophy: positional args for required inputs, flags for options.
 * Outputs JSON to stdout for easy piping and composition.
 *
 * Usage:
 *   leb bench                          # Run all adapters × all scenarios
 *   leb bench <adapter> <scenario>     # Run a single benchmark
 */

import { parseArgs } from "node:util";
import {
  adapterExists,
  addArrays,
  calculateMetrics,
  CliError,
  createScenarioLoader,
  ensureAdapterReady,
  Errors,
  getExcludedScenarios,
  listAdapters,
  loadConfig,
  loadData,
  loadScenario,
  runAdapter,
  ScenarioLoader,
} from "../lib";
import {
  ADAPTER_NAMES,
  isScale,
  SCALES,
  type AdapterName,
  type Scale,
  type TimingMetrics,
} from "../types";

/**
 * Output format for benchmark results.
 * - json: Raw JSON output (default for single mode)
 * - table: Comparison table with baseline ratios (default for all mode)
 */
type OutputFormat = "json" | "table";

/**
 * CLI options for single benchmark mode.
 * adapter and scenario are positional args, rest are optional flags.
 */
interface SingleBenchOptions {
  mode: "single";
  adapter: AdapterName;
  scenario: string;
  scale: Scale;
  iterations: number;
  warmup: number;
  output?: string;
  format: OutputFormat;
  quiet: boolean;
}

/**
 * CLI options for running all benchmarks.
 * Runs all adapters × all scenarios and saves to results/.
 */
interface AllBenchOptions {
  mode: "all";
  scale: Scale;
  iterations: number;
  warmup: number;
  format: OutputFormat;
  quiet: boolean;
}

type BenchOptions = SingleBenchOptions | AllBenchOptions;

/**
 * Default configuration values for benchmark execution.
 */
const DEFAULTS = {
  iterations: 100,
  warmup: 10,
  scale: "medium" satisfies Scale,
};

/**
 * Valid output formats.
 */
const OUTPUT_FORMATS = ["json", "table"] as const;

function isOutputFormat(s: string): s is OutputFormat {
  return OUTPUT_FORMATS.includes(s as OutputFormat);
}

/**
 * Parse flags common to both modes.
 * Returns parsed options and any positional arguments.
 */
function parseCommonFlags(args: string[]): {
  positional: string[];
  scale: Scale;
  iterations: number;
  warmup: number;
  output?: string;
  format?: OutputFormat;
  quiet: boolean;
} {
  // Separate positional arguments from flags
  const allPositional: string[] = [];
  const allFlags: string[] = [];
  let expectingValue = false;

  for (const arg of args) {
    if (expectingValue) {
      allFlags.push(arg);
      expectingValue = false;
    } else if (arg === "-h" || arg === "--help") {
      printHelp();
      process.exit(0);
    } else if (arg.startsWith("-")) {
      allFlags.push(arg);
      // Flags that expect a value (not including -q/--quiet which is boolean)
      if (
        arg === "-s" ||
        arg === "-i" ||
        arg === "-w" ||
        arg === "-o" ||
        arg === "-f" ||
        arg === "--scale" ||
        arg === "--iterations" ||
        arg === "--warmup" ||
        arg === "--output" ||
        arg === "--format"
      ) {
        expectingValue = true;
      }
    } else {
      allPositional.push(arg);
    }
  }

  // Parse flags
  const { values } = parseArgs({
    args: allFlags,
    options: {
      scale: { type: "string", short: "s" },
      iterations: { type: "string", short: "i" },
      warmup: { type: "string", short: "w" },
      output: { type: "string", short: "o" },
      format: { type: "string", short: "f" },
      quiet: { type: "boolean", short: "q" },
    },
    strict: true,
    allowPositionals: false,
  });

  // Validate scale
  const scaleInput = values.scale || DEFAULTS.scale;
  if (!isScale(scaleInput)) {
    console.error(`Error: Invalid scale "${values.scale}"`);
    console.error(`Valid scales: ${SCALES.join(", ")}`);
    process.exit(1);
  }

  // Validate format
  let format: OutputFormat | undefined;
  if (values.format) {
    if (!isOutputFormat(values.format)) {
      console.error(`Error: Invalid format "${values.format}"`);
      console.error(`Valid formats: ${OUTPUT_FORMATS.join(", ")}`);
      process.exit(1);
    }
    format = values.format;
  }

  // Parse numeric options
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

  return {
    positional: allPositional,
    scale: scaleInput,
    iterations,
    warmup,
    output: values.output,
    format,
    quiet: values.quiet ?? false,
  };
}

/**
 * Parse command-line arguments for bench command.
 * Returns "all" mode when no positional args, or "single" mode with adapter/scenario.
 * @param args - CLI arguments (after 'bench' subcommand)
 */
export function parseArgs_(args: string[]): BenchOptions {
  const { positional, scale, iterations, warmup, output, format, quiet } = parseCommonFlags(args);

  // No positional arguments → "all" mode (run all adapters × all scenarios)
  // Default format for all mode is "table" (comparison table)
  if (positional.length === 0) {
    return {
      mode: "all",
      scale,
      iterations,
      warmup,
      format: format ?? "table",
      quiet,
    };
  }

  // Validate positional arguments for single mode
  const [adapter, scenario] = positional;

  if (!scenario) {
    console.error("Error: <adapter> and <scenario> are required for single mode");
    console.error("       Run without arguments for all mode");
    console.error("");
    printHelp();
    process.exit(1);
  }

  if (!adapterExists(adapter)) {
    console.error(`Error: Unknown adapter "${adapter}"`);
    console.error(`Available: ${listAdapters().join(", ")}`);
    process.exit(1);
  }

  // Default format for single mode is "json"
  return {
    mode: "single",
    adapter: adapter as AdapterName,
    scenario,
    scale,
    iterations,
    warmup,
    output,
    format: format ?? "json",
    quiet,
  };
}

/**
 * Print help message for bench command.
 */
export function printHelp(): void {
  console.log(`
bench - Run benchmarks

Usage:
  leb bench                          # Run all adapters × all scenarios (table output)
  leb bench <adapter> <scenario>     # Run a single benchmark (json output)

Arguments (single mode):
  <adapter>    Adapter name (keepsuit, kalimatas, shopify)
  <scenario>   Scenario path (e.g., unit/tags/for, composite/for-with-if)

Options:
  -s, --scale <size>       Data scale: small, medium, large, 2xl (default: medium)
  -i, --iterations <n>     Number of measured iterations (default: 100)
  -w, --warmup <n>         Number of warmup iterations (default: 10)
  -o, --output <file>      Output file path (single mode only)
  -f, --format <type>      Output format: table, json (default: table for all, json for single)
  -q, --quiet              Suppress progress output
  -h, --help               Show this help

Output Formats:
  table    Comparison table with baseline ratios (shopify as baseline)
  json     Raw JSON output for programmatic use

Examples:
  # Run all benchmarks with comparison table (default)
  leb bench

  # Run all benchmarks with JSON output
  leb bench -f json > results.json

  # Run single benchmark
  leb bench keepsuit unit/tags/for
  leb bench shopify composite/for-with-if -s large
  leb bench kalimatas unit/filters/map -i 500 -w 20

  # Suppress progress output for scripting
  leb bench -q keepsuit unit/tags/for > result.json
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
 * Output error in appropriate format.
 */
function outputError(error: CliError, format: OutputFormat): void {
  if (format === "json") {
    console.log(JSON.stringify(error.toJSON(), null, 2));
  } else {
    console.error(error.toHuman());
  }
}

// ============================================================================
// Table Output Formatter
// ============================================================================

/**
 * Format time in milliseconds for display.
 */
function formatTime(ms: number): string {
  if (ms === 0) return "-";
  if (ms < 0.01) return `${(ms * 1000).toFixed(1)}μs`;
  if (ms < 1) return `${ms.toFixed(2)}ms`;
  return `${ms.toFixed(1)}ms`;
}

/**
 * Format ratio for display.
 * 1.00x = same as baseline, 1.50x = 50% slower, 0.80x = 20% faster
 */
function formatRatio(ratio: number): string {
  if (ratio === 0) return "-";
  return `${ratio.toFixed(2)}x`;
}

/**
 * Output comparison table to stdout.
 * Shows scenario × adapter with baseline ratios.
 */
function outputTable(
  results: BenchResult[],
  adapters: readonly AdapterName[],
  baseline: AdapterName
): void {
  // Filter to only adapters that have results
  const adaptersWithResults = new Set(results.map((r) => r.adapter));
  const activeAdapters = adapters.filter((a) => adaptersWithResults.has(a));

  if (activeAdapters.length === 0) {
    console.log("\nNo benchmark results to display.\n");
    return;
  }

  // Determine actual baseline (use first available if configured baseline has no results)
  const actualBaseline = adaptersWithResults.has(baseline) ? baseline : activeAdapters[0];

  // Group results by scenario
  const byScenario = new Map<string, Map<AdapterName, BenchResult>>();
  for (const r of results) {
    if (!byScenario.has(r.scenario)) {
      byScenario.set(r.scenario, new Map());
    }
    byScenario.get(r.scenario)!.set(r.adapter, r);
  }

  // Sort scenarios
  const scenarios = [...byScenario.keys()].sort();

  // Calculate column widths
  const scenarioWidth = Math.max(25, ...scenarios.map((s) => s.length));
  const colWidth = 18;

  // Header row
  const header = [
    "Scenario".padEnd(scenarioWidth),
    ...activeAdapters.map((a) => (a === actualBaseline ? `${a} (base)` : a).padStart(colWidth)),
  ].join(" | ");

  const separator = [
    "-".repeat(scenarioWidth),
    ...activeAdapters.map(() => "-".repeat(colWidth)),
  ].join("-|-");

  console.log("");
  console.log(header);
  console.log(separator);

  // Data rows
  for (const scenario of scenarios) {
    const scenarioResults = byScenario.get(scenario)!;
    const baselineResult = scenarioResults.get(actualBaseline);
    const baselineMs = baselineResult?.success ? baselineResult.metrics?.total.mean_ms ?? 0 : 0;

    const cols = activeAdapters.map((adapter) => {
      const result = scenarioResults.get(adapter);

      if (!result) return "-".padStart(colWidth);
      if (!result.success) return "ERR".padStart(colWidth);

      const meanMs = result.metrics?.total.mean_ms ?? 0;

      if (adapter === actualBaseline) {
        return formatTime(meanMs).padStart(colWidth);
      }

      // Show time and ratio vs baseline
      const ratio = baselineMs > 0 ? meanMs / baselineMs : 0;
      const cell = ratio > 0 ? `${formatTime(meanMs)} (${formatRatio(ratio)})` : formatTime(meanMs);
      return cell.padStart(colWidth);
    });

    console.log([scenario.padEnd(scenarioWidth), ...cols].join(" | "));
  }

  console.log("");
}

/**
 * Single benchmark result with adapter/scenario info.
 */
interface BenchResult {
  success: boolean;
  adapter: AdapterName;
  scenario: string;
  metrics?: TimingMetrics;
  library?: string;
  version?: string;
  lang?: string;
  runtime_version?: string;
  error?: string;
}

/**
 * Run a single benchmark.
 * Core logic shared between single and all modes.
 * @param showProgress - If true, output progress to stderr
 */
async function runSingleBenchmark(
  adapter: AdapterName,
  scenario: string,
  scale: Scale,
  iterations: number,
  warmup: number,
  showProgress: boolean = true
): Promise<BenchResult> {
  // Progress output to stderr
  if (showProgress) {
    console.error(`  ${adapter} × ${scenario}`);
  }

  const template = await loadScenario(scenario);
  const data = loadData(scale);

  const input = {
    template,
    data,
    iterations,
    warmup,
  };

  try {
    const result = await runAdapter(adapter, input);

    const metrics = calculateTimingMetrics(
      result.output.timings.parse_ms,
      result.output.timings.render_ms
    );

    return {
      success: true,
      adapter,
      scenario,
      metrics,
      library: result.output.library,
      version: result.output.version,
      lang: result.output.lang,
      runtime_version: result.output.runtime_version,
    };
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    return {
      success: false,
      adapter,
      scenario,
      error: errorMsg,
    };
  }
}

/**
 * Run all benchmarks (all adapters × all scenarios).
 * Outputs comparison table (default) or JSON based on --format option.
 */
async function runAll(options: AllBenchOptions): Promise<void> {
  // Load config for scenario exclusions and baseline
  const config = await loadConfig();
  const baseline = config.baseline.library as AdapterName;

  // Get all scenarios (excluding partials)
  const loader = createScenarioLoader();
  const allScenarios = loader.listAll().filter((s) => s.category !== "partials");

  // Order adapters: baseline first, then others
  const adapters = [baseline, ...ADAPTER_NAMES.filter((a) => a !== baseline)] as const;

  // Helper for conditional progress output
  const log = options.quiet ? () => {} : (msg: string) => console.error(msg);

  log(`bench: running all benchmarks`);
  log(`  adapters: ${adapters.join(", ")}`);
  log(`  baseline: ${baseline}`);
  log(`  scenarios: ${allScenarios.length}`);
  log(`  scale=${options.scale} iterations=${options.iterations} warmup=${options.warmup}`);
  log(`  format: ${options.format}`);
  log("");

  const results: BenchResult[] = [];
  let completed = 0;
  let failed = 0;
  let skipped = 0;

  // Run benchmarks sequentially to avoid resource contention
  for (const adapter of adapters) {
    // Get excluded scenarios for this adapter
    const excludedScenarios = getExcludedScenarios(config, adapter);

    // Filter scenarios for this adapter
    const adapterScenarios = allScenarios.filter((s) => !excludedScenarios.has(s.path));

    // Check adapter readiness
    try {
      await ensureAdapterReady(adapter);
    } catch (e) {
      log(`  [skip] ${adapter}: ${e instanceof Error ? e.message : String(e)}`);
      // Skip this adapter entirely - don't add to results
      skipped += adapterScenarios.length;
      continue;
    }

    // Log skipped scenarios
    if (excludedScenarios.size > 0) {
      log(`  ${adapter}: skipping ${excludedScenarios.size} unsupported scenarios`);
      skipped += excludedScenarios.size;
    }

    for (const scenario of adapterScenarios) {
      const result = await runSingleBenchmark(
        adapter,
        scenario.path,
        options.scale,
        options.iterations,
        options.warmup,
        !options.quiet // show progress unless quiet mode
      );
      results.push(result);

      if (result.success) {
        completed++;
      } else {
        failed++;
        log(`    [fail] ${result.error}`);
      }
    }
  }

  const totalBenchmarks = completed + failed;

  log("");
  log(`bench: completed ${completed}/${totalBenchmarks}, failed ${failed}, skipped ${skipped}`);

  // Output based on format
  if (options.format === "json") {
    const output = {
      metadata: {
        timestamp: new Date().toISOString(),
        scale: options.scale,
        iterations: options.iterations,
        warmup: options.warmup,
        baseline,
        total: totalBenchmarks,
        completed,
        failed,
        skipped,
      },
      results: results.map((r) => ({
        success: r.success,
        adapter: r.adapter,
        scenario: r.scenario,
        ...(r.metrics && { metrics: r.metrics }),
        ...(r.library && { library: r.library }),
        ...(r.version && { version: r.version }),
        ...(r.lang && { lang: r.lang }),
        ...(r.runtime_version && { runtime_version: r.runtime_version }),
        ...(r.error && { error: r.error }),
      })),
    };
    console.log(JSON.stringify(output, null, 2));
  } else {
    // table format (default)
    outputTable(results, adapters, baseline);
  }
}

/**
 * Run a single benchmark (single mode).
 * Outputs JSON (default) or table format.
 */
async function runSingle(options: SingleBenchOptions): Promise<void> {
  const isJson = options.format === "json";

  // Helper for conditional progress output
  const log = options.quiet ? () => {} : (msg: string) => console.error(msg);

  // Pre-check: Verify environment is ready
  try {
    await ensureAdapterReady(options.adapter);
  } catch (e) {
    if (e instanceof CliError) {
      outputError(e, options.format);
      process.exit(1);
    }
    throw e;
  }

  // Verify scenario exists
  const loader = new ScenarioLoader();
  if (!loader.existsByPath(options.scenario)) {
    outputError(Errors.scenarioNotFound(options.scenario), options.format);
    process.exit(1);
  }

  // Progress output to stderr
  log(`bench: ${options.adapter} ${options.scenario}`);
  log(`  scale=${options.scale} iterations=${options.iterations} warmup=${options.warmup}`);

  const startTime = Date.now();
  const result = await runSingleBenchmark(
    options.adapter,
    options.scenario,
    options.scale,
    options.iterations,
    options.warmup,
    false // progress already shown above
  );

  if (!result.success) {
    if (result.error?.includes("timed out")) {
      outputError(Errors.adapterTimeout(options.adapter, 300000), options.format);
    } else if (result.error?.includes("exited with code")) {
      const exitMatch = result.error.match(/code (\d+)/);
      const exitCode = exitMatch ? parseInt(exitMatch[1], 10) : 1;
      outputError(Errors.adapterCrashed(options.adapter, exitCode, result.error), options.format);
    } else {
      console.error(`Error: ${result.error}`);
    }
    process.exit(1);
  }

  const totalTimeMs = Date.now() - startTime;
  log(`  completed in ${totalTimeMs}ms`);

  // Output structure follows result.schema.json
  const output = {
    success: true,
    metadata: {
      timestamp: new Date().toISOString(),
      scenario: options.scenario,
      scale: options.scale,
      iterations: options.iterations,
      warmup: options.warmup,
    },
    adapter: {
      name: options.adapter,
      library: result.library,
      version: result.version,
      lang: result.lang,
      runtime_version: result.runtime_version,
    },
    metrics: result.metrics,
  };

  if (isJson) {
    const outputJson = JSON.stringify(output, null, 2);
    if (options.output) {
      await Bun.write(options.output, outputJson);
      log(`  output: ${options.output}`);
    } else {
      console.log(outputJson);
    }
  } else {
    // Table format for single benchmark
    const metrics = result.metrics!;
    console.log("");
    console.log(`${options.adapter} × ${options.scenario}`);
    console.log("-".repeat(50));
    console.log(`  Parse:  ${formatTime(metrics.parse.mean_ms)} (±${formatTime(metrics.parse.stddev_ms)})`);
    console.log(`  Render: ${formatTime(metrics.render.mean_ms)} (±${formatTime(metrics.render.stddev_ms)})`);
    console.log(`  Total:  ${formatTime(metrics.total.mean_ms)} (±${formatTime(metrics.total.stddev_ms)})`);
    console.log("");
  }
}

/**
 * Run bench command.
 * Dispatches to single or all mode based on arguments.
 * @param args - CLI arguments (after 'bench' subcommand)
 */
export async function run(args: string[]): Promise<void> {
  const options = parseArgs_(args);

  if (options.mode === "all") {
    await runAll(options);
  } else {
    await runSingle(options);
  }
}
