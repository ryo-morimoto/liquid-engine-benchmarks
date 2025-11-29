/**
 * Run-All CLI Command
 *
 * 全アダプター × 全シナリオのベンチマークを実行し、
 * 結果を results/ ディレクトリに保存する。
 *
 * Usage:
 *   bun src/run.ts run-all                    # 全実行（標準設定）
 *   bun src/run.ts run-all -o results/        # 結果を保存
 *   bun src/run.ts run-all --quick            # 高速実行（少ないイテレーション）
 *   bun src/run.ts run-all --category unit/tags  # カテゴリ指定
 */

import { parseArgs } from "node:util";
import {
  addArrays,
  calculateMetrics,
  createScenarioLoader,
  listAdapters,
  loadData,
  runAdapter,
  type AdapterName,
  type Scale,
  type ScenarioInfo,
} from "../lib";
import {
  isScale,
  SCALES,
  type TimingMetrics,
} from "../types";

/**
 * CLI options for run-all command.
 */
interface RunAllOptions {
  output?: string;
  scale: Scale;
  iterations: number;
  warmup: number;
  adapters?: AdapterName[];
  category?: string;
  parallel: number;
}

/**
 * Benchmark profile presets.
 */
const PROFILES = {
  quick: { iterations: 10, warmup: 2 },
  standard: { iterations: 100, warmup: 10 },
  precise: { iterations: 500, warmup: 20 },
} as const;

type ProfileName = keyof typeof PROFILES;

/**
 * Single benchmark result.
 */
interface BenchmarkResult {
  scenario: string;
  adapter: string;
  library: string;
  version: string;
  lang: string;
  runtime_version: string;
  metrics: TimingMetrics;
  error?: string;
}

/**
 * Run-all output format.
 */
interface RunAllOutput {
  metadata: {
    timestamp: string;
    scale: Scale;
    iterations: number;
    warmup: number;
    total_scenarios: number;
    total_adapters: number;
    successful: number;
    failed: number;
    duration_ms: number;
  };
  results: BenchmarkResult[];
  errors: Array<{ scenario: string; adapter: string; error: string }>;
}

/**
 * Parse command-line arguments for run-all command.
 */
export function parseArgs_(args: string[]): RunAllOptions {
  const { values } = parseArgs({
    args,
    options: {
      output: { type: "string", short: "o" },
      scale: { type: "string", short: "s" },
      iterations: { type: "string", short: "i" },
      warmup: { type: "string", short: "w" },
      adapter: { type: "string", short: "a", multiple: true },
      category: { type: "string", short: "c" },
      parallel: { type: "string", short: "p" },
      quick: { type: "boolean" },
      precise: { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
    strict: true,
  });

  if (values.help) {
    printHelp();
    process.exit(0);
  }

  // Determine profile
  let profile: ProfileName = "standard";
  if (values.quick) profile = "quick";
  if (values.precise) profile = "precise";

  // Merge profile defaults with explicit options
  const iterations = values.iterations
    ? parseInt(values.iterations, 10)
    : PROFILES[profile].iterations;
  const warmup = values.warmup
    ? parseInt(values.warmup, 10)
    : PROFILES[profile].warmup;

  // Validate scale
  const scaleInput = values.scale || "medium";
  if (!isScale(scaleInput)) {
    console.error(`Error: Invalid scale "${values.scale}"`);
    console.error(`Valid scales: ${SCALES.join(", ")}`);
    process.exit(1);
  }

  // Parse parallel count
  const parallel = values.parallel ? parseInt(values.parallel, 10) : 1;
  if (Number.isNaN(parallel) || parallel < 1 || parallel > 10) {
    console.error("Error: --parallel must be between 1 and 10");
    process.exit(1);
  }

  // Validate adapters if specified
  const availableAdapters = listAdapters();
  const adapters = values.adapter?.map((a) => {
    if (!availableAdapters.includes(a as AdapterName)) {
      console.error(`Error: Unknown adapter "${a}"`);
      console.error(`Available: ${availableAdapters.join(", ")}`);
      process.exit(1);
    }
    return a as AdapterName;
  });

  return {
    output: values.output,
    scale: scaleInput,
    iterations,
    warmup,
    adapters,
    category: values.category,
    parallel,
  };
}

/**
 * Print help message for run-all command.
 */
export function printHelp(): void {
  console.log(`
Run-All Benchmark Command

全アダプター × 全シナリオのベンチマークを実行します。

Usage:
  bun src/run.ts run-all [options]

Options:
  -o, --output <dir>       結果の出力先ディレクトリ (default: stdout)
  -s, --scale <size>       データスケール: small, medium, large, 2xl (default: medium)
  -i, --iterations <n>     測定イテレーション数 (default: profile依存)
  -w, --warmup <n>         ウォームアップ回数 (default: profile依存)
  -a, --adapter <name>     実行するアダプター (複数指定可能)
  -c, --category <cat>     シナリオカテゴリ (e.g., unit/tags, composite)
  -p, --parallel <n>       並列実行数 (default: 1, max: 10)
  --quick                  高速プロファイル (iterations=10, warmup=2)
  --precise                高精度プロファイル (iterations=500, warmup=20)
  -h, --help               このヘルプを表示

Profiles:
  (default)   standard: iterations=100, warmup=10
  --quick     quick:    iterations=10,  warmup=2
  --precise   precise:  iterations=500, warmup=20

Examples:
  bun src/run.ts run-all
  bun src/run.ts run-all -o results/
  bun src/run.ts run-all --quick -a keepsuit
  bun src/run.ts run-all -c unit/tags -s large
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
 * Filter scenarios by category if specified.
 */
function filterScenarios(scenarios: ScenarioInfo[], category?: string): ScenarioInfo[] {
  if (!category) return scenarios;

  // partials はベンチマーク対象外
  const filterable = scenarios.filter((s) => s.category !== "partials");
  return filterable.filter((s) => s.category === category || s.category.startsWith(category));
}

/**
 * Generate timestamp string for filenames.
 */
function generateTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[-:]/g, "").replace("T", "_").slice(0, 15);
}

/**
 * Run a single benchmark.
 */
async function runSingleBenchmark(
  adapterName: AdapterName,
  scenarioPath: string,
  template: string,
  data: unknown,
  iterations: number,
  warmup: number
): Promise<BenchmarkResult> {
  const input = {
    template,
    data,
    iterations,
    warmup,
  };

  try {
    const result = await runAdapter(adapterName, input);

    const metrics = calculateTimingMetrics(
      result.output.timings.parse_ms,
      result.output.timings.render_ms
    );

    return {
      scenario: scenarioPath,
      adapter: adapterName,
      library: result.output.library,
      version: result.output.version,
      lang: result.output.lang,
      runtime_version: result.output.runtime_version,
      metrics,
    };
  } catch (e) {
    return {
      scenario: scenarioPath,
      adapter: adapterName,
      library: "unknown",
      version: "unknown",
      lang: "unknown",
      runtime_version: "unknown",
      metrics: {
        parse: { mean: 0, std: 0, min: 0, max: 0, median: 0 },
        render: { mean: 0, std: 0, min: 0, max: 0, median: 0 },
        total: { mean: 0, std: 0, min: 0, max: 0, median: 0 },
      },
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Run run-all command.
 */
export async function run(args: string[]): Promise<void> {
  const options = parseArgs_(args);
  const scenarioLoader = createScenarioLoader();

  // List scenarios and filter
  const allScenarios = scenarioLoader.listAll();
  const scenarios = filterScenarios(allScenarios, options.category);
  const benchmarkScenarios = scenarios.filter((s) => s.category !== "partials");

  // Determine adapters
  const adapters = options.adapters || listAdapters();

  const totalBenchmarks = benchmarkScenarios.length * adapters.length;

  console.error("Run-All Benchmark");
  console.error("─".repeat(40));
  console.error(`  Scale:       ${options.scale}`);
  console.error(`  Iterations:  ${options.iterations}`);
  console.error(`  Warmup:      ${options.warmup}`);
  console.error(`  Adapters:    ${adapters.join(", ")}`);
  console.error(`  Scenarios:   ${benchmarkScenarios.length}`);
  console.error(`  Total:       ${totalBenchmarks} benchmarks`);
  if (options.output) {
    console.error(`  Output:      ${options.output}`);
  }
  console.error("─".repeat(40));
  console.error("");

  // Load data
  console.error(`Loading data (scale: ${options.scale})...`);
  const data = loadData(options.scale);

  // Preload all templates
  console.error("Loading templates...");
  const templates = await scenarioLoader.loadMany(
    benchmarkScenarios.map((s) => s.path)
  );

  const startTime = Date.now();
  const results: BenchmarkResult[] = [];
  const errors: Array<{ scenario: string; adapter: string; error: string }> = [];

  let completed = 0;

  // Run benchmarks
  for (const scenario of benchmarkScenarios) {
    const template = templates.get(scenario.path);
    if (!template) continue;

    for (const adapter of adapters) {
      completed++;
      const progress = `[${completed}/${totalBenchmarks}]`;

      console.error(`${progress} ${adapter}/${scenario.path}...`);

      const result = await runSingleBenchmark(
        adapter,
        scenario.path,
        template,
        data,
        options.iterations,
        options.warmup
      );

      results.push(result);

      if (result.error) {
        errors.push({
          scenario: scenario.path,
          adapter,
          error: result.error,
        });
        console.error(`  ✗ ${result.error.slice(0, 60)}...`);
      } else {
        console.error(`  ✓ ${result.metrics.total.mean.toFixed(3)}ms`);
      }
    }
  }

  const durationMs = Date.now() - startTime;

  // Build output
  const output: RunAllOutput = {
    metadata: {
      timestamp: new Date().toISOString(),
      scale: options.scale,
      iterations: options.iterations,
      warmup: options.warmup,
      total_scenarios: benchmarkScenarios.length,
      total_adapters: adapters.length,
      successful: results.filter((r) => !r.error).length,
      failed: errors.length,
      duration_ms: durationMs,
    },
    results: results.filter((r) => !r.error),
    errors,
  };

  console.error("");
  console.error("─".repeat(40));
  console.error(`Completed in ${(durationMs / 1000).toFixed(1)}s`);
  console.error(`  Successful: ${output.metadata.successful}`);
  console.error(`  Failed:     ${output.metadata.failed}`);

  const outputJson = JSON.stringify(output, null, 2);

  // Write output
  if (options.output) {
    const timestamp = generateTimestamp();
    const outputPath = options.output.endsWith("/")
      ? `${options.output}run_${timestamp}.json`
      : options.output;

    await Bun.write(outputPath, outputJson);
    console.error(`  Output:     ${outputPath}`);
  } else {
    console.log(outputJson);
  }
}
