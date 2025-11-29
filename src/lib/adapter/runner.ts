/**
 * Adapter Runner Module
 *
 * Executes benchmark adapters as subprocesses.
 * Sends AdapterInput via stdin, receives AdapterOutput via stdout.
 * Validates output against adapter-output.schema.json.
 */

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ADAPTER_NAMES,
  type AdapterConfig,
  type AdapterInput,
  type AdapterName,
  type AdapterOutput,
  isAdapterName,
} from "../../types";
import { validateAdapterOutput } from "../validator";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "../../..");

/**
 * Default timeout for adapter execution (milliseconds).
 */
const DEFAULT_TIMEOUT_MS = 300_000; // 5 minutes

/**
 * Adapter configurations.
 * Maps adapter names to their execution settings.
 */
export const ADAPTERS: Record<AdapterName, AdapterConfig> = {
  keepsuit: {
    name: "keepsuit",
    lang: "php",
    command: [
      "php",
      "-d",
      "opcache.enable_cli=1",
      "-d",
      "display_errors=stderr",
      join(PROJECT_ROOT, "src/adapters/php/keepsuit.php"),
    ],
  },
  kalimatas: {
    name: "kalimatas",
    lang: "php",
    command: [
      "php",
      "-d",
      "opcache.enable_cli=1",
      "-d",
      "display_errors=stderr",
      join(PROJECT_ROOT, "src/adapters/php/kalimatas.php"),
    ],
  },
  shopify: {
    name: "shopify",
    lang: "ruby",
    command: ["ruby", join(PROJECT_ROOT, "src/adapters/ruby/shopify.rb")],
    env: { RUBY_YJIT_ENABLE: "1" },
  },
};

/**
 * Error thrown when adapter execution fails.
 */
export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly adapterName: AdapterName,
    public readonly exitCode?: number,
    public readonly stderr?: string
  ) {
    super(message);
    this.name = "AdapterError";
  }
}

/**
 * Result of adapter execution.
 */
export interface AdapterResult {
  /** Validated adapter output */
  output: AdapterOutput;
  /** Execution time in milliseconds (subprocess overhead) */
  executionTimeMs: number;
}

/**
 * Run a benchmark adapter.
 *
 * Spawns the adapter as a subprocess, sends input via stdin,
 * and parses the JSON output from stdout.
 *
 * @param adapterName Name of the adapter to run
 * @param input AdapterInput to send
 * @param timeoutMs Timeout in milliseconds (default: 5 minutes)
 * @returns AdapterResult with validated output
 * @throws AdapterError if execution fails or output is invalid
 */
export async function runAdapter(
  adapterName: AdapterName,
  input: AdapterInput,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<AdapterResult> {
  const config = ADAPTERS[adapterName];

  if (!config) {
    throw new AdapterError(`Unknown adapter: ${adapterName}`, adapterName);
  }

  const startTime = performance.now();

  // Spawn subprocess with Bun
  const proc = Bun.spawn(config.command, {
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
    env: {
      ...process.env,
      ...config.env,
    },
  });

  // Write input to stdin
  const inputJson = JSON.stringify(input);
  proc.stdin.write(inputJson);
  await proc.stdin.end();

  // Set up timeout
  let timeoutId: Timer | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      proc.kill();
      reject(new AdapterError(`Adapter timed out after ${timeoutMs}ms`, adapterName));
    }, timeoutMs);
  });

  // Read stdout/stderr in parallel with waiting for exit to avoid deadlock
  const [stdout, stderr, exitCode] = await Promise.race([
    Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]),
    timeoutPromise,
  ]);

  // Clear timeout if process completed
  if (timeoutId) clearTimeout(timeoutId);

  const executionTimeMs = performance.now() - startTime;

  // Check exit code
  if (exitCode !== 0) {
    throw new AdapterError(
      `Adapter exited with code ${exitCode}: ${stderr}`,
      adapterName,
      exitCode,
      stderr
    );
  }

  // Parse JSON output
  let output: unknown;
  try {
    output = JSON.parse(stdout);
  } catch {
    throw new AdapterError(
      `Failed to parse adapter output as JSON: ${stdout.slice(0, 200)}`,
      adapterName,
      exitCode,
      stderr
    );
  }

  // Validate against schema
  try {
    await validateAdapterOutput(output);
  } catch (e) {
    throw new AdapterError(
      `Adapter output validation failed: ${e instanceof Error ? e.message : String(e)}`,
      adapterName,
      exitCode,
      stderr
    );
  }

  return {
    output: output as AdapterOutput,
    executionTimeMs,
  };
}

/**
 * Get adapter configuration by name.
 *
 * @param name Adapter name
 * @returns AdapterConfig or undefined if not found
 */
export function getAdapterConfig(name: AdapterName): AdapterConfig | undefined {
  return ADAPTERS[name];
}

/**
 * List all available adapter names.
 * Returns a copy of the const tuple to prevent external mutation.
 *
 * @returns Array of adapter names
 */
export function listAdapters(): readonly AdapterName[] {
  return ADAPTER_NAMES;
}

/**
 * Check if an adapter exists (type guard).
 * Delegates to isAdapterName from types/adapter.ts.
 *
 * @param name Adapter name to check
 * @returns true if adapter exists
 */
export function adapterExists(name: string): name is AdapterName {
  return isAdapterName(name);
}
