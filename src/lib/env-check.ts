/**
 * Environment Checker Module
 *
 * Pre-validates runtime environment before benchmark execution.
 * Uses feature-test approach: execute runtime directly, parse output.
 *
 * Philosophy (Autoconf-inspired):
 * - Test features, not versions when possible
 * - Execute directly rather than searching PATH manually
 * - Provide actionable error messages
 */

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { type AdapterName, ADAPTER_NAMES, type RuntimeName } from "../types";
import { CliError, Errors } from "./errors";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "../..");

/**
 * Runtime configuration for each adapter.
 */
const ADAPTER_RUNTIME: Record<AdapterName, RuntimeName> = {
  keepsuit: "php",
  kalimatas: "php",
  shopify: "ruby",
};

/**
 * Minimum required versions (major.minor).
 */
const REQUIRED_VERSIONS: Record<RuntimeName, string> = {
  php: "8.3",
  ruby: "3.3",
};

/**
 * Adapter script paths relative to project root.
 */
const ADAPTER_SCRIPTS: Record<AdapterName, string> = {
  keepsuit: "src/adapters/php/keepsuit.php",
  kalimatas: "src/adapters/php/kalimatas.php",
  shopify: "src/adapters/ruby/shopify.rb",
};

/**
 * Check result for a single adapter.
 */
export interface CheckResult {
  adapter: AdapterName;
  ok: boolean;
  error?: CliError;
}

/**
 * Runtime execution result.
 */
interface RuntimeInfo {
  available: boolean;
  version: string | null;
  path: string | null;
  error?: string;
}

/**
 * Execute runtime and extract version info.
 *
 * Feature-test approach: run the actual command rather than
 * searching PATH manually. This catches both missing binaries
 * and broken installations.
 */
async function probeRuntime(name: RuntimeName): Promise<RuntimeInfo> {
  const versionFlag = name === "php" ? "-v" : "--version";

  try {
    const proc = Bun.spawn([name, versionFlag], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const [stdout, stderr] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      return {
        available: false,
        version: null,
        path: null,
        error: stderr.trim() || `${name} exited with code ${exitCode}`,
      };
    }

    // Parse version from first line of output
    const version = extractVersion(name, stdout);

    // Get actual path (optional, for diagnostics)
    const path = await getExecutablePath(name);

    return {
      available: true,
      version,
      path,
    };
  } catch (e) {
    // ENOENT = command not found in PATH
    if (e instanceof Error && "code" in e && e.code === "ENOENT") {
      return {
        available: false,
        version: null,
        path: null,
        error: `${name} not found in PATH`,
      };
    }

    return {
      available: false,
      version: null,
      path: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Extract version from runtime output.
 *
 * Uses anchored patterns to avoid false matches.
 * Extracts major.minor (ignoring patch for comparison).
 */
function extractVersion(name: RuntimeName, output: string): string | null {
  const firstLine = output.split("\n")[0] || "";

  if (name === "php") {
    // PHP 8.3.14 (cli) (built: Nov 21 2024 13:41:21) (NTS)
    // Pattern: "PHP " at start of line, followed by version
    const match = firstLine.match(/^PHP\s+(\d+\.\d+\.\d+)/);
    if (match) {
      // Return major.minor only
      const parts = match[1].split(".");
      return `${parts[0]}.${parts[1]}`;
    }
  } else {
    // ruby 3.3.6 (2024-11-05 revision 75015d4c1f) [x86_64-linux]
    // Pattern: "ruby " at start of line, followed by version
    const match = firstLine.match(/^ruby\s+(\d+\.\d+\.\d+)/);
    if (match) {
      const parts = match[1].split(".");
      return `${parts[0]}.${parts[1]}`;
    }
  }

  return null;
}

/**
 * Get executable path for diagnostics.
 * Uses shell built-in approach for portability.
 */
async function getExecutablePath(name: string): Promise<string | null> {
  try {
    // Use 'command -v' which is POSIX shell built-in
    const proc = Bun.spawn(["sh", "-c", `command -v ${name}`], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const stdout = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;

    if (exitCode === 0) {
      return stdout.trim() || null;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Compare version strings (major.minor).
 * Returns true if actual >= required.
 */
function versionSatisfies(actual: string, required: string): boolean {
  const [actualMajor, actualMinor] = actual.split(".").map(Number);
  const [requiredMajor, requiredMinor] = required.split(".").map(Number);

  if (Number.isNaN(actualMajor) || Number.isNaN(actualMinor)) {
    return false;
  }

  if (actualMajor > requiredMajor) return true;
  if (actualMajor < requiredMajor) return false;
  return actualMinor >= requiredMinor;
}

/**
 * Check if dependencies are installed.
 */
function checkDeps(runtime: RuntimeName): boolean {
  if (runtime === "php") {
    return existsSync(join(PROJECT_ROOT, "vendor/autoload.php"));
  }
  return (
    existsSync(join(PROJECT_ROOT, "Gemfile.lock")) ||
    existsSync(join(PROJECT_ROOT, ".bundle"))
  );
}

/**
 * Check environment for a specific adapter.
 *
 * Validation order:
 * 1. Adapter script exists
 * 2. Runtime is available (feature test)
 * 3. Runtime version satisfies requirement
 * 4. Dependencies are installed
 */
export async function checkAdapter(adapter: AdapterName): Promise<CheckResult> {
  const runtime = ADAPTER_RUNTIME[adapter];
  const requiredVersion = REQUIRED_VERSIONS[runtime];
  const scriptPath = join(PROJECT_ROOT, ADAPTER_SCRIPTS[adapter]);

  // 1. Check adapter script exists
  if (!existsSync(scriptPath)) {
    return {
      adapter,
      ok: false,
      error: Errors.adapterScriptMissing(adapter, scriptPath),
    };
  }

  // 2. Probe runtime (feature test)
  const info = await probeRuntime(runtime);

  if (!info.available) {
    return {
      adapter,
      ok: false,
      error: Errors.runtimeNotFound(runtime, info.error || "not available"),
    };
  }

  // 3. Check version
  if (!info.version) {
    return {
      adapter,
      ok: false,
      error: Errors.runtimeVersionMismatch(runtime, requiredVersion, "unknown"),
    };
  }

  if (!versionSatisfies(info.version, requiredVersion)) {
    return {
      adapter,
      ok: false,
      error: Errors.runtimeVersionMismatch(runtime, requiredVersion, info.version),
    };
  }

  // 4. Check dependencies
  if (!checkDeps(runtime)) {
    const cmd = runtime === "php" ? "composer install" : "bundle install";
    return {
      adapter,
      ok: false,
      error: Errors.depsNotInstalled(runtime, cmd),
    };
  }

  return { adapter, ok: true };
}

/**
 * Check environment for multiple adapters.
 * Runs checks in parallel for efficiency.
 */
export async function checkAdapters(
  adapters: AdapterName[]
): Promise<CheckResult[]> {
  return Promise.all(adapters.map(checkAdapter));
}

/**
 * Check all adapters and return only errors.
 */
export async function checkAllAdapters(): Promise<CheckResult[]> {
  const results = await checkAdapters([...ADAPTER_NAMES]);
  return results.filter((r) => !r.ok);
}

/**
 * Quick check if an adapter can run.
 * Throws CliError if not.
 */
export async function ensureAdapterReady(adapter: AdapterName): Promise<void> {
  const result = await checkAdapter(adapter);
  if (!result.ok && result.error) {
    throw result.error;
  }
}

// ============================================================================
// Test Exports
// ============================================================================

/**
 * Internal functions exported for testing.
 * Not part of the public API - may change without notice.
 *
 * @internal
 */
export const internal = {
  extractVersion,
  versionSatisfies,
  ADAPTER_RUNTIME,
  REQUIRED_VERSIONS,
};
